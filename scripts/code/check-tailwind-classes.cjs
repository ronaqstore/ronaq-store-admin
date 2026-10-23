"use strict";

const fs = require("fs");
const path = require("path");
const { Reporter } = require("./lib/reporter.cjs");
const { walkTree } = require("./lib/walkTree.cjs");

const r = new Reporter("Tailwind CSS Class Deprecations Audit", { emoji: "🎨" });

const srcRoot = path.join(__dirname, "../../src");

const DEPRECATED_INSET = /(?:^|[\s"'`])((?:[a-z0-9/[\]-]+:)*)(-?)(start|end)-(\d+(?:\.\d+)?|px|full|auto|\[[^\]]+\])/g;

function replacementFor(match, variants, neg, side, value) {
  const axis = side === "start" ? "s" : "e";
  return `${variants}${neg}inset-${axis}-${value}`;
}

function scanText(relPath, code) {
  const lines = code.split(/\r?\n/);
  lines.forEach((line, idx) => {
    DEPRECATED_INSET.lastIndex = 0;
    let m;
    while ((m = DEPRECATED_INSET.exec(line))) {
      const full = `${m[1] || ""}${m[2] || ""}${m[3]}-${m[4]}`;
      const next = replacementFor(m[0], m[1] || "", m[2] || "", m[3], m[4]);
      r.addViolation(
        relPath,
        idx + 1,
        `Deprecated Tailwind positioning class "${full}" — use "${next}" (inset-inline-start/end)`
      );
    }
  });
}

if (fs.existsSync(srcRoot)) {
  walkTree(
    srcRoot,
    (absPath, relPathRaw) => {
      const relPath = relPathRaw.split(path.sep).join("/");
      const code = fs.readFileSync(absPath, "utf8");
      scanText(relPath, code);
    },
    { extensions: new Set([".ts", ".tsx", ".js", ".jsx", ".css"]) }
  );
}

r.finish({
  fixTip:
    "Replace deprecated start-* / end-* positioning utilities with inset-s-* / inset-e-* (Tailwind v4.2+). Keep ms-/me-/ps-/pe- and text-start/text-end as-is.",
});
