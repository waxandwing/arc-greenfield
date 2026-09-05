import assert from "node:assert/strict";
import test from "node:test";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { movePlanToCalendarDate } from "../lib/plan-operations";
import { movePlanTreeToIdeas } from "../lib/plan-tree";
import { weekDisplayDates, weekDisplayOrder, yearAttendanceDisplayOrder } from "../lib/calendar-display";

function samplePlan(): Plan {
  return {
    id: "stable-object",
    type: "lesson",
    title: "Visual evidence practice",
    courseId: "apah",
    date: "2026-09-09",
    endDate: null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "Keep this richer note even when the object returns to the Fridge.",
    resources: [{ id: "r1", label: "Source", url: "https://example.com/source" }],
    details: { startTime: "15:10", advancedField: "retain-me" }
  };
}

test("Week is Mon-Fri by default and Sun-Sat only when weekends are enabled", () => {
  assert.deepEqual(weekDisplayOrder(false), [1, 2, 3, 4, 5]);
  assert.deepEqual(weekDisplayOrder(true), [0, 1, 2, 3, 4, 5, 6]);

  const anchor = new Date(2026, 8, 9, 12, 0, 0);
  assert.deepEqual(weekDisplayDates(anchor, false).map((day) => day.label), ["Mon", "Tue", "Wed", "Thu", "Fri"]);
  assert.deepEqual(weekDisplayDates(anchor, true).map((day) => day.label), ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
});

test("Year Map attendance columns remain Monday through Friday regardless of Week preference", () => {
  assert.deepEqual(yearAttendanceDisplayOrder(), [1, 2, 3, 4, 5]);
});

test("default workspace keeps weekends off", () => {
  assert.equal(emptyWorkspace().calendar.weekendsVisible, false);
});

test("moving a planned object back to the Fridge preserves its stable identity and rich data", () => {
  const original = samplePlan();
  const [fridge] = movePlanTreeToIdeas([original], original.id);

  assert.equal(fridge.id, original.id);
  assert.equal(fridge.location, "ideas");
  assert.equal(fridge.date, original.date, "date is retained as hidden history/context rather than erased");
  assert.equal(fridge.notes, original.notes);
  assert.deepEqual(fridge.resources, original.resources);
  assert.deepEqual(fridge.details, original.details);
});

test("moving the same Fridge object back to Calendar keeps identity and retained rich data", () => {
  const original = samplePlan();
  const [fridge] = movePlanTreeToIdeas([original], original.id);
  const [scheduled] = movePlanToCalendarDate([fridge], fridge.id, "2026-09-15", "apah");

  assert.equal(scheduled.id, original.id);
  assert.equal(scheduled.location, "calendar");
  assert.equal(scheduled.date, "2026-09-15");
  assert.equal(scheduled.notes, original.notes);
  assert.deepEqual(scheduled.resources, original.resources);
  assert.deepEqual(scheduled.details, original.details);
});
