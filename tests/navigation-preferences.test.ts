import test from "node:test";
import assert from "node:assert/strict";
import type { WorkspacePreferences } from "../lib/domain";
import { currentLandingChoices, resolveCurrentPlannerView, resolvePlannerHome } from "../lib/navigation-preferences";

function preferences(overrides: Partial<WorkspacePreferences> = {}): WorkspacePreferences {
  return {
    landingView: "week",
    lastUsedView: "week",
    dayVisibleInSwitcher: true,
    collapsedUnitIds: [],
    ...overrides
  };
}

test("fixed supported home resolves directly", () => {
  assert.equal(resolvePlannerHome(preferences({ landingView: "month", lastUsedView: "week" }), true), "month");
});

test("Day is now a supported first-class home", () => {
  assert.equal(resolvePlannerHome(preferences({ landingView: "day", lastUsedView: "week" }), true), "day");
});

test("Last used resolves from persisted lastUsedView", () => {
  assert.equal(resolvePlannerHome(preferences({ landingView: "last-used", lastUsedView: "day" }), true), "day");
});

test("unavailable Quarter falls back safely without mutating stored preference", () => {
  const source = preferences({ landingView: "quarter", lastUsedView: "month" });
  assert.equal(resolvePlannerHome(source, false), "week");
  assert.equal(source.landingView, "quarter");
  assert.equal(source.lastUsedView, "month");
});

test("not-yet-implemented Semester or Year falls back to current safe Week surface", () => {
  assert.equal(resolveCurrentPlannerView("semester", true), "week");
  assert.equal(resolveCurrentPlannerView("year", true), "week");
});

test("Quarter is valid only when current branch has quarter boundaries", () => {
  assert.equal(resolveCurrentPlannerView("quarter", true), "quarter");
  assert.equal(resolveCurrentPlannerView("quarter", false), "week");
});

test("Settings choices expose Day and only implemented available home surfaces", () => {
  assert.deepEqual(currentLandingChoices(false).map((choice) => choice.value), ["last-used", "day", "week", "month"]);
  assert.deepEqual(currentLandingChoices(true).map((choice) => choice.value), ["last-used", "day", "week", "month", "quarter"]);
});
