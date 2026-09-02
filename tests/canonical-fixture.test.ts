import test from "node:test";
import assert from "node:assert/strict";
import { veteranArtTeacherWeekFixture } from "./fixtures/veteran-art-teacher-week";
import { orderedUnitChildren } from "../lib/plan-tree";
import { courseMeetsOnDate } from "../lib/efficiency-operations";

test("canonical veteran teacher fixture carries the disruption and hierarchy evidence we audit against", () => {
  const workspace = veteranArtTeacherWeekFixture();
  assert.equal(workspace.courses.length, 3);
  assert.equal(workspace.calendar.noSchoolDates.some((item) => item.date === "2026-09-18"), true);
  assert.equal(workspace.plans.some((plan) => plan.location === "fridge"), true);
  assert.equal(workspace.plans.some((plan) => plan.fixedDate), true);

  const studioLessons = orderedUnitChildren(workspace.plans, "studio-seeing-drawing");
  assert.deepEqual(studioLessons.map((lesson) => lesson.id), [
    "studio-contour",
    "studio-negative-space",
    "studio-value-demo",
    "studio-portfolio-check"
  ]);
});

test("canonical fixture includes class-specific schedule truth", () => {
  const workspace = veteranArtTeacherWeekFixture();
  assert.equal(courseMeetsOnDate(workspace, "studio-art-p2", "2026-09-15"), true);
  assert.equal(courseMeetsOnDate(workspace, "three-d-art-p6", "2026-09-15"), false);
  assert.equal(courseMeetsOnDate(workspace, "three-d-art-p6", "2026-09-16"), true);
  assert.equal(courseMeetsOnDate(workspace, "studio-art-p2", "2026-09-18"), false);
});
