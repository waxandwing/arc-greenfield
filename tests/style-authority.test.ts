import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const RETIRED_STYLES = [
  "workspace-rebuild.css",
  "arc-interactions.css",
  "range-views.css",
  "range-interactions.css",
  "arc-visual-language.css",
  "week-planner.css"
];

test("planner has one workspace stylesheet authority and retired layers stay deleted", () => {
  const layout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
  const cssImports = [...layout.matchAll(/import\s+["']\.\/(.+?\.css)["'];/g)].map((match) => match[1]);
  assert.deepEqual(cssImports, ["globals.css", "onboarding-screen.css", "workspace-rebuild-v2.css"]);

  for (const retired of RETIRED_STYLES) {
    assert.equal(existsSync(resolve(process.cwd(), "app", retired)), false, `${retired} must stay deleted`);
    assert.equal(layout.includes(`\"./${retired}\"`), false, `${retired} must not re-enter the global cascade`);
  }
});

test("globals.css contains primitives, not a second planner shell", () => {
  const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
  for (const staleSelector of [".deskPage", ".calendarDesk", ".ideasPanel", ".priorityPanel", ".weekHeader", ".lessonMagnet"]) {
    assert.equal(globals.includes(staleSelector), false, `${staleSelector} belongs to the retired planner layer`);
  }
  assert.ok(globals.length < 3000, "global styles should stay intentionally small");
});
