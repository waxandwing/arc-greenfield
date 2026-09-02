import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Arc color preferences use one palette source and canonical workspace persistence", () => {
  const domain = readFileSync(resolve(process.cwd(), "lib/domain.ts"), "utf8");
  const schemes = readFileSync(resolve(process.cwd(), "lib/arc-color-schemes.ts"), "utf8");
  const picker = readFileSync(resolve(process.cwd(), "app/arc-color-scheme-picker.tsx"), "utf8");

  assert.match(domain, /ArcColorScheme = "studio" \| "sunroom" \| "blueprint" \| "clay"/);
  assert.match(domain, /colorScheme\?: ArcColorScheme/);
  assert.match(domain, /colorScheme: "studio"/);

  for (const label of ["Arc Studio", "Sunroom", "Blueprint", "Clay + Paper"]) {
    assert.equal(schemes.includes(label), true, `canonical palette is missing ${label}`);
  }

  assert.equal(picker.includes("ARC_COLOR_SCHEMES"), true, "picker must consume the canonical scheme list");
  assert.equal(picker.includes("loadWorkspace"), true, "picker must read through the canonical workspace store");
  assert.equal(picker.includes("saveWorkspace"), true, "picker must persist through the canonical workspace store");
  assert.equal(picker.includes("localStorage.getItem"), false, "picker must not read raw workspace storage");
  assert.equal(picker.includes("localStorage.setItem"), false, "picker must not write raw workspace storage");
  assert.equal(picker.includes("arc.greenfield.workspace.v1"), false, "picker must not hardcode the anonymous workspace key");
  assert.equal(picker.includes("position: \"fixed\""), false, "palette chooser must not float over the planning surface");
});
