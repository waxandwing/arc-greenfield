import test from "node:test";
import assert from "node:assert/strict";
import { resolveArcShortcut, resolvePlanningIntentShortcut } from "../lib/shortcuts";

test("Cmd/Ctrl S resolves to Save now", () => {
  assert.equal(resolveArcShortcut({ key: "s", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }), "save");
  assert.equal(resolveArcShortcut({ key: "S", metaKey: false, ctrlKey: true, shiftKey: false, altKey: false }), "save");
});

test("R&D movement keys resolve as planning intents without entering the current live shortcut path", () => {
  const move = { key: "m", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  const park = { key: "f", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  const search = { key: "k", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false };

  assert.equal(resolvePlanningIntentShortcut(move), "open-move");
  assert.equal(resolvePlanningIntentShortcut(park), "preview-park");
  assert.equal(resolvePlanningIntentShortcut(search), "command-search");

  assert.equal(resolveArcShortcut(move), null);
  assert.equal(resolveArcShortcut(park), null);
  assert.equal(resolveArcShortcut(search), null);
});

test("planning intent shortcuts do not fire through modified text-entry-like combinations", () => {
  assert.equal(resolvePlanningIntentShortcut({ key: "m", metaKey: false, ctrlKey: false, shiftKey: true, altKey: false }), null);
  assert.equal(resolvePlanningIntentShortcut({ key: "f", metaKey: false, ctrlKey: false, shiftKey: false, altKey: true }), null);
});
