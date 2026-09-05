import assert from "node:assert/strict";
import test from "node:test";
import type { Plan } from "../lib/domain";
import { moveObjectToCalendar, moveObjectToFridge, moveObjectToTaskBar, objectLocation, updateTaskContext, type ArcPlanningObject } from "../lib/object-lifecycle";

function object(): ArcPlanningObject {
  const base: Plan = {
    id: "obj-1",
    type: "lesson",
    title: "Evidence practice",
    courseId: "course-a",
    date: "2026-09-10",
    endDate: null,
    location: "calendar",
    parentUnitId: "unit-a",
    childOrder: 2,
    fixedDate: false,
    continuationOfId: null,
    notes: "rich lesson note",
    resources: [{ id: "r1", label: "source", url: "https://example.com" }],
    details: { standard: "VA", visibility: "teacher" }
  };
  return base;
}

test("one stable object travels Calendar → Fridge → Task Bar → Calendar without losing rich fields", () => {
  const original = object();
  const fridge = moveObjectToFridge(original);
  assert.equal(fridge.id, original.id);
  assert.equal(objectLocation(fridge), "fridge");
  assert.equal(fridge.notes, original.notes);
  assert.deepEqual(fridge.resources, original.resources);
  assert.deepEqual(fridge.details, original.details);
  assert.equal(fridge.parentUnitId, original.parentUnitId);

  const task = updateTaskContext(moveObjectToTaskBar(fridge, "must"), {
    notes: "print before first bell",
    startTime: "06:45",
    durationMinutes: 15
  });
  assert.equal(task.id, original.id);
  assert.equal(objectLocation(task), "taskbar");
  assert.equal(task.taskContext?.tier, "must");
  assert.equal(task.taskContext?.durationMinutes, 15);
  assert.equal(task.notes, original.notes);

  const scheduled = moveObjectToCalendar(task, { date: "2026-09-15", courseId: "course-b" });
  assert.equal(scheduled.id, original.id);
  assert.equal(objectLocation(scheduled), "calendar");
  assert.equal(scheduled.date, "2026-09-15");
  assert.equal(scheduled.courseId, "course-b");
  assert.equal(scheduled.taskContext?.startTime, "06:45");
  assert.equal(scheduled.notes, original.notes);
  assert.deepEqual(scheduled.resources, original.resources);
  assert.deepEqual(scheduled.details, original.details);
});
