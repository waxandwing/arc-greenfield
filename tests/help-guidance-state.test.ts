import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../lib/domain";
import {
  dismissExploreWelcome,
  hasExploredHelp,
  markHelpExplored,
  resetHelpExploration,
  setFirstTimeHelpEnabled,
  setHelpMarksVisible,
  shouldShowFirstTimeHelp
} from "../lib/help-guidance-state";

test("new workspaces invite first-time help without requiring it", () => {
  const workspace = emptyWorkspace();
  assert.equal(workspace.preferences.helpMarksVisible, true);
  assert.equal(workspace.preferences.firstTimeHelpEnabled, true);
  assert.equal(shouldShowFirstTimeHelp(workspace, "fridge"), true);
});

test("exploring one feature does not suppress help for unrelated tools", () => {
  const workspace = markHelpExplored(emptyWorkspace(), "fridge");
  assert.equal(hasExploredHelp(workspace, "fridge"), true);
  assert.equal(shouldShowFirstTimeHelp(workspace, "fridge"), false);
  assert.equal(shouldShowFirstTimeHelp(workspace, "shift"), true);
});

test("teachers can hide marks without disabling first-time explanations", () => {
  const workspace = setHelpMarksVisible(emptyWorkspace(), false);
  assert.equal(workspace.preferences.helpMarksVisible, false);
  assert.equal(shouldShowFirstTimeHelp(workspace, "unit"), true);
});

test("teachers can disable automatic explanations while global help remains available", () => {
  const workspace = setFirstTimeHelpEnabled(emptyWorkspace(), false);
  assert.equal(shouldShowFirstTimeHelp(workspace, "calendar"), false);
  assert.deepEqual(workspace.preferences.exploredHelpIds, []);
});

test("resetting exploration clears seen topics and restores the lightweight welcome", () => {
  let workspace = markHelpExplored(emptyWorkspace(), "calendar");
  workspace = dismissExploreWelcome(workspace);
  workspace = resetHelpExploration(workspace);
  assert.deepEqual(workspace.preferences.exploredHelpIds, []);
  assert.equal(workspace.preferences.exploreWelcomeDismissed, false);
});
