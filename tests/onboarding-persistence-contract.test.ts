import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const entrySource = readFileSync(new URL("../app/arc-entry.tsx", import.meta.url), "utf8");

test("onboarding completion reopens persisted setup instead of saving a stale render snapshot", () => {
  assert.match(entrySource, /const stored = loadWorkspace\(ownerId\);/);
  assert.match(entrySource, /if \(!isReady\(stored\)\) return;/);
  assert.doesNotMatch(entrySource, /onComplete=\{\(\) => \{\s*const next = \{ \.\.\.workspace, ownerId \};\s*saveWorkspace\(next, ownerId\);/s);
});
