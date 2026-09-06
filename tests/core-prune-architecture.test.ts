import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const APP_DIR = join(process.cwd(), "app");

function cssFiles() {
  return readdirSync(APP_DIR).filter((name) => name.endsWith(".css"));
}

function css(name: string) {
  return readFileSync(join(APP_DIR, name), "utf8");
}

test("B00.5 keeps executable CSS free of emergency important overrides", () => {
  for (const file of cssFiles()) {
    assert.equal(css(file).includes("!important"), false, `${file} contains !important`);
  }
});

test("global CSS does not resurrect removed prototype selectors", () => {
  const globalCss = css("globals.css");
  const retired = [
    ".setupPage",
    ".setupCard",
    ".setupGrid",
    ".setupCopy",
    ".stepNumber",
    ".courseAdder",
    ".courseChips",
    ".courseChip",
    ".setupFooter",
    ".weekControls",
    ".magnetEditor",
    ".primaryAction"
  ];
  for (const selector of retired) {
    assert.equal(globalCss.includes(selector), false, `${selector} returned to globals.css`);
  }
});

test("visual language remains decorative instead of becoming a structural override layer", () => {
  const visual = css("arc-visual-language.css");
  const structuralOwners = [
    ".viewSwitcher",
    ".magnetActions",
    ".priorityHeading",
    ".pasteTarget",
    ".selected"
  ];
  for (const selector of structuralOwners) {
    assert.equal(visual.includes(selector), false, `${selector} belongs with its structural owner, not visual language`);
  }
});

test("removed Week patch stylesheet is no longer imported", () => {
  const layout = readFileSync(join(APP_DIR, "layout.tsx"), "utf8");
  assert.equal(layout.includes("week-planner.css"), false);
});
