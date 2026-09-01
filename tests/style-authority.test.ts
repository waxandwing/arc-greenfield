import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("planner has one workspace stylesheet authority", () => {
  const layout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
  const cssImports = [...layout.matchAll(/import\s+["']\.\/(.+?\.css)["'];/g)].map((match) => match[1]);
  assert.deepEqual(cssImports, ["globals.css", "onboarding-screen.css", "workspace-rebuild-v2.css"]);
  for (const retired of ["workspace-rebuild.css", "arc-interactions.css", "range-views.css", "range-interactions.css", "arc-visual-language.css", "week-planner.css"]) {
    assert.equal(layout.includes(`\"./${retired}\"`), false, `${retired} must not re-enter the global cascade`);
  }
});
