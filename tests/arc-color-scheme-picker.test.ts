import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Arc color preferences use one palette source and a normal workspace control", () => {
  const domain = readFileSync(resolve(process.cwd(), "lib/domain.ts"), "utf8");
  const schemes = readFileSync(resolve(process.cwd(), "lib/arc-color-schemes.ts"), "utf8");
  const control = readFileSync(resolve(process.cwd(), "app/arc-color-scheme-control.tsx"), "utf8");
  const shell = readFileSync(resolve(process.cwd(), "app/arc-shell.tsx"), "utf8");

  assert.match(domain, /ArcColorScheme = "studio" \| "sunroom" \| "blueprint" \| "clay"/);
  assert.match(domain, /colorScheme\?: ArcColorScheme/);
  assert.match(domain, /colorScheme: "studio"/);

  for (const label of ["Arc Studio", "Sunroom", "Blueprint", "Clay + Paper"]) {
    assert.equal(schemes.includes(label), true, `canonical palette is missing ${label}`);
  }

  assert.equal(control.includes("ARC_COLOR_SCHEMES"), true, "control must consume the canonical scheme list");
  assert.equal(control.includes("localStorage"), false, "control must not own persistence");
  assert.equal(control.includes("MutationObserver"), false, "control must not watch the DOM");
  assert.equal(control.includes("createPortal"), false, "control must render normally inside More");
  assert.equal(shell.includes("ArcColorSchemeControl"), true, "shell must own the preference update path");
  assert.equal(existsSync(resolve(process.cwd(), "app/arc-color-scheme-picker.tsx")), false, "observer picker must stay deleted");
  assert.equal(existsSync(resolve(process.cwd(), "app/arc-color-scheme-picker.module.css")), false, "observer picker styles must stay deleted");
});
