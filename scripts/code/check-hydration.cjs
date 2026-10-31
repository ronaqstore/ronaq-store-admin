"use strict";

const fs = require("fs");
const path = require("path");
const traverse = require("@babel/traverse").default;
const { Reporter } = require("./lib/reporter.cjs");
const { walkTree } = require("./lib/walkTree.cjs");
const { parseFile } = require("./lib/parseFile.cjs");

const r = new Reporter("Next.js Hydration & SSR Audit", { emoji: "💧" });

const srcRoot = path.join(__dirname, "../../src");

const BLOCK_TAGS_IN_P = new Set([
  "p",
  "div",
  "section",
  "article",
  "ul",
  "ol",
  "table",
  "form",
  "header",
  "footer",
  "main",
  "aside",
]);

const SAFE_HOOK_NAMES = new Set([
  "useEffect",
  "useLayoutEffect",
  "useCallback",
  "useMemo",
  "useSyncExternalStore",
]);

if (fs.existsSync(srcRoot)) {
  walkTree(srcRoot, (absPath, relPathRaw) => {
    if (!/\.(tsx|jsx)$/.test(absPath)) return;

    const relPath = relPathRaw.split(path.sep).join("/");
    // Exempt shadcn primitives, test files, and Next generated types
    if (
      relPath.includes("components/ui/") ||
      relPath.includes(".test.") ||
      relPath.includes(".spec.") ||
      relPath.includes("next-env.d.ts")
    ) {
      return;
    }

    const code = fs.readFileSync(absPath, "utf8");

    // Fast check before parsing
    const hasSuspect =
      code.includes("window.") ||
      code.includes("document.") ||
      code.includes("localStorage.") ||
      code.includes("sessionStorage.") ||
      code.includes("navigator.") ||
      code.includes("Date.now") ||
      code.includes("Math.random") ||
      code.includes("crypto.randomUUID") ||
      code.includes("<p") ||
      code.includes("<button") ||
      code.includes("<a");

    if (!hasSuspect) return;

    let ast;
    try {
      ast = parseFile(absPath, code);
    } catch (e) {
      r.addParseError(relPath, e.message);
      return;
    }

    traverse(ast, {
      // 1. Check client-only globals and non-deterministic function calls
      MemberExpression(p) {
        const line = p.node.loc ? p.node.loc.start.line : 0;
        const obj = p.node.object;
        const prop = p.node.property;

        // Determine if expression is inside safe lifecycle / handler context
        let isSafeContext = false;
        let curr = p;
        while (curr) {
          // Inside useEffect / useLayoutEffect / useMemo / useCallback / useSyncExternalStore
          // Direct call: useEffect(...) OR Member call: React.useEffect(...)
          if (curr.isCallExpression()) {
            const callee = curr.node.callee;
            if (callee.type === "Identifier" && SAFE_HOOK_NAMES.has(callee.name)) {
              isSafeContext = true;
              break;
            }
            if (
              callee.type === "MemberExpression" &&
              callee.property.type === "Identifier" &&
              SAFE_HOOK_NAMES.has(callee.property.name)
            ) {
              isSafeContext = true;
              break;
            }
          }

          // Inside an event handler (function named handle* or on*)
          if (
            (curr.isFunctionDeclaration() ||
              curr.isFunctionExpression() ||
              curr.isArrowFunctionExpression()) &&
            curr.parentPath &&
            curr.parentPath.isVariableDeclarator() &&
            curr.parentPath.node.id.type === "Identifier" &&
            (curr.parentPath.node.id.name.startsWith("handle") ||
              curr.parentPath.node.id.name.startsWith("on"))
          ) {
            isSafeContext = true;
            break;
          }

          // Inside JSX event prop (e.g. onClick={() => ...}, onOpenChange={() => ...})
          if (curr.isJSXAttribute()) {
            const attrName = curr.node.name.name;
            if (
              typeof attrName === "string" &&
              (attrName.startsWith("on") ||
                attrName === "disabledDates" ||
                attrName === "filterDates")
            ) {
              isSafeContext = true;
              break;
            }
          }

          // Inside class method or object method property (e.g. onClick: () => {}, mutationFn: () => {})
          if (
            curr.isObjectProperty() &&
            curr.node.key.type === "Identifier" &&
            (curr.node.key.name.startsWith("on") ||
              curr.node.key.name.startsWith("handle") ||
              curr.node.key.name === "mutationFn" ||
              curr.node.key.name === "subscribe" ||
              curr.node.key.name === "getSnapshot" ||
              curr.node.key.name === "getServerSnapshot")
          ) {
            isSafeContext = true;
            break;
          }

          // Inside enclosing block/function guarded by typeof window === 'undefined'
          if (curr.isBlockStatement() || curr.isProgram()) {
            const body = curr.node.body;
            if (Array.isArray(body)) {
              for (const stmt of body) {
                if (stmt.type === "IfStatement") {
                  const test = stmt.test;
                  if (
                    test &&
                    test.type === "BinaryExpression" &&
                    ((test.left.type === "UnaryExpression" &&
                      test.left.operator === "typeof" &&
                      test.left.argument.name === "window") ||
                      (test.right.type === "UnaryExpression" &&
                        test.right.operator === "typeof" &&
                        test.right.argument.name === "window"))
                  ) {
                    isSafeContext = true;
                    break;
                  }
                }
              }
            }
            if (isSafeContext) break;
          }

          // Inside typeof check (e.g. typeof window !== 'undefined')
          if (curr.isUnaryExpression() && curr.node.operator === "typeof") {
            isSafeContext = true;
            break;
          }
          curr = curr.parentPath;
        }

        if (isSafeContext) return;

        // Allow window.setTimeout / clearTimeout / setInterval / clearInterval if in callbacks or effects
        const propName = prop.name || "";
        if (
          obj.type === "Identifier" &&
          obj.name === "window" &&
          (propName === "setTimeout" ||
            propName === "clearTimeout" ||
            propName === "setInterval" ||
            propName === "clearInterval")
        ) {
          return;
        }

        // Check window.<property> outside safe context
        if (obj.type === "Identifier" && obj.name === "window") {
          r.addViolation(
            relPath,
            line,
            `Direct access to \`window.${propName || "property"}\` in render body causes SSR crashes and hydration mismatches.`,
            { fix: "Move window access into a `useEffect` hook or guard with `typeof window !== 'undefined'`." }
          );
        }

        // Check localStorage.<property> outside safe context
        if (obj.type === "Identifier" && obj.name === "localStorage") {
          r.addViolation(
            relPath,
            line,
            `Direct access to \`localStorage.${propName || "property"}\` in render body causes SSR hydration mismatches.`,
            { fix: "Access localStorage inside `useEffect` or guard with `typeof window !== 'undefined'`." }
          );
        }

        // Check sessionStorage.<property> outside safe context
        if (obj.type === "Identifier" && obj.name === "sessionStorage") {
          r.addViolation(
            relPath,
            line,
            `Direct access to \`sessionStorage.${propName || "property"}\` in render body causes SSR hydration mismatches.`,
            { fix: "Access sessionStorage inside `useEffect` or guard with `typeof window !== 'undefined'`." }
          );
        }

        // Check Date.now() outside safe context
        if (
          obj.type === "Identifier" &&
          obj.name === "Date" &&
          prop.type === "Identifier" &&
          prop.name === "now"
        ) {
          r.addViolation(
            relPath,
            line,
            "Non-deterministic `Date.now()` in render body causes SSR hydration mismatches.",
            { fix: "Pass timestamp from server via props or compute inside `useEffect`." }
          );
        }
      },

      // 2. Check JSX nesting rules that cause HTML parser auto-closing
      JSXElement(p) {
        const opening = p.node.openingElement;
        const line = opening.loc ? opening.loc.start.line : 0;
        const tagName =
          opening.name.type === "JSXIdentifier" ? opening.name.name : null;

        if (!tagName) return;

        // Rule A: <p> cannot wrap block elements
        if (tagName === "p") {
          p.traverse({
            JSXElement(childPath) {
              const childOpening = childPath.node.openingElement;
              const childTag =
                childOpening.name.type === "JSXIdentifier"
                  ? childOpening.name.name
                  : null;
              if (childTag && BLOCK_TAGS_IN_P.has(childTag.toLowerCase())) {
                const childLine = childOpening.loc
                  ? childOpening.loc.start.line
                  : line;
                r.addViolation(
                  relPath,
                  childLine,
                  `Invalid HTML nesting: \`<p>\` (L${line}) cannot contain block element \`<${childTag}>\`. Browsers auto-close \`<p>\`, breaking React hydration.`,
                  { fix: `Replace outer \`<p>\` with \`<div>\` or move \`<${childTag}>\` outside the paragraph.` }
                );
              }
            },
          });
        }

        // Rule B: <button> cannot wrap <button>
        if (tagName === "button") {
          p.traverse({
            JSXElement(childPath) {
              const childTag =
                childPath.node.openingElement.name.type === "JSXIdentifier"
                  ? childPath.node.openingElement.name.name
                  : null;
              if (childTag === "button") {
                const childLine = childPath.node.openingElement.loc
                  ? childPath.node.openingElement.loc.start.line
                  : line;
                r.addViolation(
                  relPath,
                  childLine,
                  `Invalid HTML nesting: \`<button>\` (L${line}) cannot contain nested \`<button>\`.`,
                  { fix: "Change inner or outer element to `<div>` or separate into sibling buttons." }
                );
              }
            },
          });
        }

        // Rule C: <a> cannot wrap <a>
        if (tagName === "a" || tagName === "Link") {
          p.traverse({
            JSXElement(childPath) {
              const childTag =
                childPath.node.openingElement.name.type === "JSXIdentifier"
                  ? childPath.node.openingElement.name.name
                  : null;
              if (childTag === "a" || childTag === "Link") {
                const childLine = childPath.node.openingElement.loc
                  ? childPath.node.openingElement.loc.start.line
                  : line;
                r.addViolation(
                  relPath,
                  childLine,
                  `Invalid HTML nesting: \`<${tagName}>\` (L${line}) cannot contain nested \`<${childTag}>\`.`,
                  { fix: "Avoid nesting interactive links inside links." }
                );
              }
            },
          });
        }
      },
    });
  });
}

r.finish({
  fixTip: "Hydration Safety: Keep SSR renders deterministic and ensure valid HTML nesting for flawless hydration.",
});
