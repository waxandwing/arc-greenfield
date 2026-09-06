import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP_DIR = join(process.cwd(), "app");

function filesWithExtension(root: string, extension: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory()
      ? filesWithExtension(path, extension)
      : path.endsWith(extension) ? [path] : [];
  });
}

function css(name: string) {
  return readFileSync(join(APP_DIR, name), "utf8");
}

test("B00.5 keeps executable CSS free of emergency important overrides", () => {
  for (const file of filesWithExtension(APP_DIR, ".css")) {
    assert.equal(
      readFileSync(file, "utf8").includes("!important"),
      false,
      `${relative(process.cwd(), file)} contains !important`
    );
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
