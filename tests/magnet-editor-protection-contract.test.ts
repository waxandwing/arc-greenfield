import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "app/magnet-editor.tsx"), "utf8");

test("Magnet editor does not present Park to Fridge as available for protected content", () => {
  assert.match(source, /protectedFromFridge = plan\.fixedDate \|\| children\.some\(\(child\) => child\.fixedDate\)/);
  assert.match(source, /disabled=\{protectedFromFridge\}/);
  assert.match(source, /Protected date\. Unlock the fixed/);
});

test("fixed child Lessons cannot use the Unit sequence Fridge shortcut", () => {
  assert.match(source, /disabled=\{child\.fixedDate\}/);
  assert.match(source, /Unlock this fixed Lesson before parking it/);
});
