import test from "node:test";
import assert from "node:assert/strict";
import { previewInstructionalShift } from "../lib/efficiency-operations";
import { shiftPreflightToImpactSet } from "../lib/movement-impact-adapter";
import { veteranArtTeacherWeekFixture } from "./fixtures/veteran-art-teacher-week";

test("Shift preview translates a movable A-day sequence into canonical impact vocabulary", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const preflight = previewInstructionalShift(workspace, ["three-d-art-p6"], "2026-09-14");
  const impact = shiftPreflightToImpactSet(workspace, preflight);

  assert.ok(impact.shifted.length > 0);
  assert.ok(impact.shifted.some((item) => item.id === "three-d-slot-joints" && item.fromDate === "2026-09-14" && item.toDate === "2026-09-16"));
  assert.equal(impact.protected.length, 0);
  assert.equal(impact.displaced.length, 0);
  assert.ok(impact.warnings.some((message) => /can move one class meeting/i.test(message)));
});

test("a fixed assessment protects its whole Unit tree from Shift", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const preflight = previewInstructionalShift(workspace, ["studio-art-p2"], "2026-09-14");
  const impact = shiftPreflightToImpactSet(workspace, preflight);

  assert.ok(preflight.blockedRootIds.includes("studio-seeing-drawing"));
  assert.ok(impact.protected.some((item) => item.id === "studio-portfolio-check"));
  assert.equal(impact.shifted.some((item) => item.id === "studio-contour"), false);
  assert.ok(impact.warnings.some((message) => /protected or blocked/i.test(message)));
});

test("collision preview names the blocked landing instead of implying a successful shift", () => {
  const workspace = veteranArtTeacherWeekFixture();
  workspace.plans.push({
    id: "stationary-studio-lesson",
    type: "lesson",
    title: "Stationary conference",
    courseId: "studio-art-p2",
    date: "2026-09-17",
    endDate: null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: true,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {}
  });

  const preflight = previewInstructionalShift(workspace, ["studio-art-p2"], "2026-09-16");
  const impact = shiftPreflightToImpactSet(workspace, preflight);

  assert.ok(impact.errors.length > 0 || impact.protected.length > 0);
  assert.equal(impact.landing.length, 0);
});
