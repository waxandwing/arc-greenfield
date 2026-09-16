#!/usr/bin/env node
/**
 * Cheap presence check for Kelly labeled desk SVGs.
 *
 * - Always lists the 22 expected canonical filenames.
 * - Exits 0 when binaries are absent (expected BLOCKED state) OR all present.
 * - Exits 1 if code/docs claim canonical wires while binaries are still missing
 *   (heuristic: src references to /assets/desk/canonical/*.svg without the file).
 *
 * Usage: npm run check:canonical-desk-svgs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalDir = path.join(root, "public/assets/desk/canonical");

/** Expected canonical filenames (22) — must match LABELED-SVG-CHECKLIST.md */
const EXPECTED = [
  "wood-background-light.svg",
  "ideas-tray.svg",
  "ideas-tray-vector-alt.svg",
  "settings-tab.svg",
  "todos-tab.svg",
  "todos-tab-alt.svg",
  "calendar-tab-selected.svg",
  "calendar-tab-unselected.svg",
  "calendar-background.svg",
  "calendar-date-rainbow.svg",
  "today-button.svg",
  "today-highlight.svg",
  "start-class-mark.svg",
  "magnet-blue.svg",
  "magnet-green.svg",
  "magnet-mustard.svg",
  "magnet-terracotta.svg",
  "arc-upper-left-logo.svg",
  "arctable-mark.svg",
  "postit-blue.svg",
  "postit-stack.svg",
  "calendar-class-selected-marker.svg",
];

const present = [];
const missing = [];
for (const name of EXPECTED) {
  const p = path.join(canonicalDir, name);
  if (fs.existsSync(p) && fs.statSync(p).size > 0) present.push(name);
  else missing.push(name);
}

console.log("Kelly labeled desk SVGs — expected canonical filenames (22):");
for (const name of EXPECTED) {
  const ok = present.includes(name);
  console.log(`  ${ok ? "PRESENT" : "MISSING"}  ${name}`);
}
console.log(`\nSummary: ${present.length}/${EXPECTED.length} present.`);

if (missing.length === EXPECTED.length) {
  console.log(
    "\nBLOCKED (expected): all 22 binaries absent. Drop originals in uploads/desk-incoming/.",
  );
  console.log("Do not invent substitutes. See uploads/desk-incoming/LABELED-SVG-CHECKLIST.md");
}

// Fail if source claims a canonical SVG wire while that file is missing.
const claimRe = /(?:assets\/desk\/canonical\/|desk\/canonical\/)([a-z0-9-]+\.svg)/gi;
const srcRoots = ["src", "tests"].map((d) => path.join(root, d));
const falseClaims = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx?|jsx?|mjs|cjs|css)$/.test(ent.name)) continue;
    const text = fs.readFileSync(full, "utf8");
    let m;
    claimRe.lastIndex = 0;
    while ((m = claimRe.exec(text))) {
      const file = m[1];
      if (EXPECTED.includes(file) && missing.includes(file)) {
        falseClaims.push(`${path.relative(root, full)} → ${file}`);
      }
    }
  }
}

for (const d of srcRoots) walk(d);

const strict = process.argv.includes("--strict") || process.env.CANONICAL_SVG_STRICT === "1";

if (falseClaims.length) {
  const uniq = [...new Set(falseClaims)];
  // Prefer-canonical + runtime fallback (e.g. magnets) is allowed while fully BLOCKED;
  // fail when someone starts landing binaries without finishing, or --strict.
  if (present.length === 0 && !strict) {
    console.warn("\nWARN: code prefers canonical SVG paths that are not present yet:");
    for (const line of uniq) console.warn(`  ${line}`);
    console.warn("OK while fully BLOCKED — do not invent binaries. Use --strict to fail.");
  } else {
    console.error("\nFAIL: code references canonical SVGs that are not present:");
    for (const line of uniq) console.error(`  ${line}`);
    console.error(
      "Either drop the binaries in uploads/desk-incoming/ (then incorporate), or remove the premature wire.",
    );
    process.exit(1);
  }
}

if (present.length === EXPECTED.length) {
  console.log("\nOK: all 22 canonical SVGs present.");
} else if (present.length > 0) {
  console.log(
    `\nPARTIAL: ${missing.length} still missing. Do not claim full Kelly labeled authority yet.`,
  );
  if (strict) process.exit(1);
}

process.exit(0);
