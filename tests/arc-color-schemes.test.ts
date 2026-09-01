import assert from "node:assert/strict";
import test from "node:test";
import { ARC_COLOR_SCHEMES, arcColorScheme } from "../lib/arc-color-schemes";
import { emptyWorkspace } from "../lib/domain";

test("new workspaces default to the canonical Arc Studio scheme", () => {
  assert.equal(emptyWorkspace().preferences.colorScheme, "studio");
});

test("all choices stay inside the approved Arc asset color family", () => {
  const approved = new Set(["#F6F1E7", "#174F64", "#AAC7D0", "#EFBE3F", "#F0D538", "#EFAA57", "#DF8968"]);
  for (const scheme of ARC_COLOR_SCHEMES) {
    for (const value of [scheme.paper, scheme.deep, scheme.blue, scheme.gold, scheme.yellow, scheme.orange, scheme.coral, ...scheme.quarters]) {
      assert.ok(approved.has(value), `${scheme.id} introduced non-Arc color ${value}`);
    }
  }
});

test("unknown or migrated preference falls back to Arc Studio", () => {
  assert.equal(arcColorScheme(undefined).id, "studio");
});
