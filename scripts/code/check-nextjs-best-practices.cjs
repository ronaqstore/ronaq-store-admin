"use strict";

const fs = require("fs");
const path = require("path");
const traverse = require("@babel/traverse").default;
const { Reporter } = require("./lib/reporter.cjs");
const { walkTree } = require("./lib/walkTree.cjs");
const { parseFile } = require("./lib/parseFile.cjs");

const r = new Reporter("Next.js Built-in Features & Best Practices Audit", { emoji: "▲" });

const rootDir = path.join(__dirname, "../..");
const srcRoot = path.join(rootDir, "src");

const REQUIRED_LOADING = ["src/app/[locale]/dashboard/loading.tsx"];

const PREFETCH_ROUTE_PAGES = [
  "src/app/[locale]/dashboard/customers/[id]/page.tsx",
  "src/app/[locale]/dashboard/settings/store/page.tsx",
];

function normalizeRel(relPathRaw) {
  return relPathRaw.split(path.sep).join("/");
}

function isUseClient(code) {
  return code.includes("'use client'") || code.includes('"use client"');
}

function isNullOnlyPage(code) {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export\s+async\s+function\s+generateMetadata[\s\S]*?\n}/g, "")
    .replace(/export\s+const\s+metadata[\s\S]*?;/g, "")
    .trim();
  return /return\s+null\s*;?\s*}\s*$/.test(stripped) || /=>\s*null\s*;?\s*$/.test(stripped);
}

function usesPrefetchOrHydration(code) {
  return (
    /PrefetchHydrationBoundary/.test(code) ||
    /HydrationBoundary/.test(code) ||
    /dehydrate\(/.test(code) ||
    /PrefetchRoute/.test(code)
  );
}

REQUIRED_LOADING.forEach((reqPath) => {
  const full = path.join(rootDir, reqPath);
  if (!fs.existsSync(full)) {
    r.addViolation(
      reqPath,
      0,
      `Missing required route loading UI: ${reqPath}`,
      {
        fix: "Add dashboard/loading.tsx so navigations inside the authenticated shell stream a fallback.",
      }
    );
  }
});

PREFETCH_ROUTE_PAGES.forEach((reqPath) => {
  const full = path.join(rootDir, reqPath);
  if (!fs.existsSync(full)) return;
  const code = fs.readFileSync(full, "utf8");
  if (!usesPrefetchOrHydration(code)) {
    r.addViolation(
      reqPath,
      1,
      "Authenticated detail/settings page must prefetch on the server (`PrefetchHydrationBoundary` / `HydrationBoundary`)",
      {
        fix: "Wrap the client tree with PrefetchHydrationBoundary and prefetch the query options with the session token.",
      }
    );
  }
  if (isUseClient(code)) {
    r.addViolation(
      reqPath,
      1,
      '"use client" on page — App Router pages must stay Server Components',
      { fix: "Keep the page as an RSC and move interactivity into a client feature component." }
    );
  }
});

const pageContainerPath = path.join(srcRoot, "components/layout/page-container.tsx");
if (fs.existsSync(pageContainerPath)) {
  const code = fs.readFileSync(pageContainerPath, "utf8");
  if (isUseClient(code)) {
    r.addViolation(
      "src/components/layout/page-container.tsx",
      1,
      "`PageContainer` must stay a Server Component — a client shell forces an early client boundary on every dashboard page",
      {
        fix: "Keep PageContainer as an async RSC (getTranslations). Put interactive header actions in a thin client child.",
      }
    );
  }
}

const overviewDir = path.join(srcRoot, "app/[locale]/dashboard/overview");
if (fs.existsSync(overviewDir)) {
  const entries = fs.readdirSync(overviewDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith("@")) {
      r.addViolation(
        `src/app/[locale]/dashboard/overview/${entry.name}`,
        0,
        "Dead or unused overview parallel-route slot — remove `@slot` folders unless they render real streamed UI",
        {
          fix: "Delete unused @sales/@pie_stats/@bar_stats/@area_stats trees, or render real widgets from those pages.",
        }
      );
    }
  }
}

if (fs.existsSync(srcRoot)) {
  walkTree(srcRoot, (absPath, relPathRaw) => {
    if (!/\.(ts|tsx|js|jsx)$/.test(absPath)) return;

    const relPath = normalizeRel(relPathRaw);
    if (
      relPath.includes("components/ui/") ||
      relPath.includes("next-env.d.ts") ||
      relPath.startsWith("src/i18n/")
    ) {
      return;
    }

    const code = fs.readFileSync(absPath, "utf8");
    const base = path.basename(absPath);

    if (base === "page.tsx") {
      if (isUseClient(code)) {
        r.addViolation(
          relPath,
          1,
          '"use client" on page — App Router pages must stay Server Components for metadata and RSC data fetching',
          { fix: "Remove 'use client' from the page and extract interactive UI into a client component." }
        );
      }
      if (isNullOnlyPage(code)) {
        r.addViolation(
          relPath,
          1,
          "Stub page returns only `null` — remove dead parallel-route theater or render real content",
          { fix: "Delete unused slot pages or stream real UI from the page." }
        );
      }
    }

    if (
      relPath.startsWith("src/app/[locale]/dashboard/") &&
      base === "page.tsx" &&
      /<Suspense[\s>]/.test(code) &&
      !/<Suspense[^>]*fallback=/.test(code) &&
      !/fallback=\{/.test(code)
    ) {
      r.addViolation(
        relPath,
        1,
        "Bare `<Suspense>` without `fallback` on a dashboard page — provide a skeleton (e.g. DataTableSkeleton)",
        { fix: "Add fallback={<DataTableSkeleton ... />} or rely on a segment loading.tsx and remove empty Suspense." }
      );
    }

    let ast;
    try {
      ast = parseFile(absPath, code);
    } catch (e) {
      r.addParseError(relPath, e.message);
      return;
    }

    traverse(ast, {
      ImportDeclaration(p) {
        const source = p.node.source.value;
        const line = p.node.loc ? p.node.loc.start.line : 0;

        if (source === "next/link") {
          r.addViolation(
            relPath,
            line,
            "Forbidden direct `next/link` import — use localized `{ Link }` from `@/i18n/navigation` to maintain locale routing",
            { fix: "Change import to: import { Link } from '@/i18n/navigation';" }
          );
        }

        if (source === "next/navigation") {
          const forbiddenRoutingHooks = p.node.specifiers
            .filter(
              (spec) =>
                spec.type === "ImportSpecifier" &&
                ["useRouter", "usePathname"].includes(spec.imported.name)
            )
            .map((spec) => spec.imported.name);

          if (forbiddenRoutingHooks.length > 0 && !relPath.startsWith("src/app/not-found.tsx")) {
            r.addViolation(
              relPath,
              line,
              `Forbidden direct \`${forbiddenRoutingHooks.join(", ")}\` from \`next/navigation\` — use localized \`{ ${forbiddenRoutingHooks.join(", ")} }\` from \`@/i18n/navigation\` to maintain locale routing`,
              {
                fix: `Change import to: import { ${forbiddenRoutingHooks.join(", ")} } from '@/i18n/navigation';`,
              }
            );
          }
        }

        if (source === "react") {
          const hasLazy = p.node.specifiers.some(
            (spec) => spec.type === "ImportSpecifier" && spec.imported.name === "lazy"
          );
          if (hasLazy) {
            r.addViolation(
              relPath,
              line,
              "Forbidden `React.lazy` — use Next.js `dynamic()` from `next/dynamic` for SSR-compatible code splitting",
              { fix: "Replace with Next.js dynamic import: import dynamic from 'next/dynamic';" }
            );
          }
        }
      },

      JSXOpeningElement(p) {
        const name = p.node.name && p.node.name.name;
        const line = p.node.loc ? p.node.loc.start.line : 0;

        if (name === "img") {
          r.addViolation(
            relPath,
            line,
            "Forbidden raw `<img>` element — use Next.js `<Image>` from `next/image` for automatic optimization, responsive sizing, and CLS prevention",
            { fix: "Replace with Next.js `<Image>` from `next/image`." }
          );
        }

        if (name === "script" && !relPath.endsWith("src/app/layout.tsx")) {
          r.addViolation(
            relPath,
            line,
            "Forbidden raw `<script>` tag — use Next.js `<Script>` from `next/script` with an explicit loading strategy",
            { fix: "Replace with `<Script>` from `next/script`." }
          );
        }

        if (name === "head" || name === "title") {
          if (!relPath.endsWith("src/app/layout.tsx") && !relPath.includes("components/icons")) {
            r.addViolation(
              relPath,
              line,
              `Forbidden \`<${name}>\` tag in component body — Next.js App Router uses the Metadata API (\`export const metadata\` or \`generateMetadata\`)`,
              { fix: "Remove the tag and define page metadata using Next.js Metadata API." }
            );
          }
        }
      },
    });
  });
}

r.finish({
  fixTip:
    "Next.js Best Practices: RSC pages + PrefetchHydrationBoundary, Server Component PageContainer, loading.tsx, `@/i18n/navigation`, and `<Image>` from `next/image`.",
});
