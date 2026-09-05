import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { canPlaceInDayNotes, dayNoteMagnetsForDate, moveMagnetToDayNotes, movePlanToCalendarDate } from "../lib/plan-operations";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-08",
    endDate: type === "unit" ? "2026-09-12" : null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {},
    ...rest
  };
}

test("moving a nested Lesson within its class preserves Unit ownership", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const moved = movePlanToCalendarDate([unit, lesson], "lesson", "2026-09-10", "course-a");
  const result = moved.find((item) => item.id === "lesson");
  assert.equal(result?.date, "2026-09-10");
  assert.equal(result?.parentUnitId, "unit");
  assert.equal(result?.childOrder, 0);
});

test("moving a nested Lesson to another class makes it standalone", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const moved = movePlanToCalendarDate([unit, lesson], "lesson", "2026-09-10", "course-b");
  const result = moved.find((item) => item.id === "lesson");
  assert.equal(result?.courseId, "course-b");
  assert.equal(result?.date, "2026-09-10");
  assert.equal(result?.parentUnitId, null);
  assert.equal(result?.childOrder, null);
});

test("moving a Unit still shifts its full lesson tree by the same date delta", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" });
  const moved = movePlanToCalendarDate([unit, lesson], "unit", "2026-09-15", "course-b");
  assert.equal(moved.find((item) => item.id === "unit")?.date, "2026-09-15");
  assert.equal(moved.find((item) => item.id === "lesson")?.date, "2026-09-16");
  assert.ok(moved.every((item) => item.courseId === "course-b"));
});

test("class calendar cells reject note magnets", () => {
  const note = plan({ id: "note", title: "Prep copies", type: "note", courseId: null, date: null, location: "ideas" });
  const moved = movePlanToCalendarDate([note], "note", "2026-09-10", "course-a");
  assert.deepEqual(moved, [note]);
});

test("day Notes accept note magnets and remove course ownership", () => {
  const note = plan({ id: "note", title: "Prep copies", type: "note", courseId: "course-a", date: null, location: "ideas" });
  const moved = moveMagnetToDayNotes([note], "note", "2026-09-10");
  const result = moved[0];
  assert.equal(result.type, "note");
  assert.equal(result.date, "2026-09-10");
  assert.equal(result.courseId, null);
  assert.equal(result.location, "calendar");
  assert.equal(result.parentUnitId, null);
  assert.equal(result.childOrder, null);
});

test("day Notes reject Lessons and Units", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson" });
  assert.equal(canPlaceInDayNotes(unit), false);
  assert.equal(canPlaceInDayNotes(lesson), false);
  assert.deepEqual(moveMagnetToDayNotes([unit, lesson], "unit", "2026-09-10"), [unit, lesson]);
  assert.deepEqual(moveMagnetToDayNotes([unit, lesson], "lesson", "2026-09-10"), [unit, lesson]);
});

test("day Notes query returns only free-standing note magnets for that date", () => {
  const matching = plan({ id: "matching", title: "Prep copies", type: "note", courseId: null, date: "2026-09-10" });
  const otherDay = plan({ id: "other-day", title: "Email museum", type: "note", courseId: null, date: "2026-09-11" });
  const courseNote = plan({ id: "course-note", title: "Class-specific", type: "note", courseId: "course-a", date: "2026-09-10" });
  const lesson = plan({ id: "lesson", title: "Review", type: "lesson", date: "2026-09-10" });
  assert.deepEqual(dayNoteMagnetsForDate([matching, otherDay, courseNote, lesson], "2026-09-10").map((item) => item.id), ["matching"]);
});
