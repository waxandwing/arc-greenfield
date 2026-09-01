import test from "node:test";
import assert from "node:assert/strict";
import { resolveArcShortcut } from "../lib/shortcuts";

test("Cmd/Ctrl S resolves to Save now", () => {
  assert.equal(resolveArcShortcut({ key: "s", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }), "save");
  assert.equal(resolveArcShortcut({ key: "S", metaKey: false, ctrlKey: true, shiftKey: false, altKey: false }), "save");
});
