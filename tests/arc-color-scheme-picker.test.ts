import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const approved = new Set([
  "#174F64", "#AAC7D0", "#EFBE3F", "#F0D538", "#DF8968", "#EFAA57",
  "#6F9EAA", "#8AAEB6", "#C3DADF", "#7FA7AD", "#BDD4DA", "#F6F1E7",
  "#F8F1DF", "#F4F1E9", "#F7EFE5", "#C8BDAB", "#FFFDF8", "#DDD5C6", "#687175"
]);

test("Arc exposes four persistent asset-derived color schemes in More preferences", () => {
  const domain = readFileSync(resolve(process.cwd(), "lib/domain.ts"), "utf8");
  const picker = readFileSync(resolve(process.cwd(), "app/arc-color-scheme-picker.tsx"), "utf8");

  assert.match(domain, /ArcColorScheme = "studio" \| "sunroom" \| "blueprint" \| "clay"/);
  assert.match(domain, /colorScheme\?: ArcColorScheme/);
  assert.match(domain, /colorScheme: "studio"/);

  for (const label of ["Arc Studio", "Sunroom", "Blueprint", "Clay + Paper"]) {
    assert.equal(picker.includes(label), true, `missing ${label}`);
  }
  assert.equal(picker.includes("arc.colorScheme"), true);
  assert.equal(picker.includes("preferences: { ...workspace.preferences, colorScheme: id }"), true);
  assert.match(picker, /findMorePreferencesMount/);
  assert.match(picker, /createPortal/);
  assert.equal(picker.includes("position: \"fixed\""), false, "palette chooser must not float over the planning surface");
  assert.equal(picker.includes("if (!mountNode) return null"), true, "palette chooser should only appear inside More preferences");

  const hexes = [...picker.matchAll(/#[0-9A-F]{6}/g)].map((match) => match[0]);
  const unapproved = [...new Set(hexes.filter((hex) => !approved.has(hex)))];
  assert.deepEqual(unapproved, [], `off-brand picker colors: ${unapproved.join(", ")}`);
});
