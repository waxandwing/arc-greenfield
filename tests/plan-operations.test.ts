import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import {
  deleteSelection,
  detachLesson,
  movePlan,
  movePlanToCalendarDate,
  nestLesson
} from "../lib/plan-operations";

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

test("moving a Unit shifts its full lesson tree by the same date delta", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" });
  const moved = movePlanToCalendarDate([unit, lesson], "unit", "2026-09-15", "course-b");
  assert.equal(moved.find((item) => item.id === "unit")?.date, "2026-09-15");
  assert.equal(moved.find((item) => item.id === "lesson")?.date, "2026-09-16");
  assert.ok(moved.every((item) => item.courseId === "course-b"));
});

test("moving a Unit to the Fridge carries every nested Lesson without flattening the tree", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const first = plan({ id: "one", title: "One", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const second = plan({ id: "two", title: "Two", type: "lesson", parentUnitId: "unit", childOrder: 1 });
  const moved = movePlan([unit, first, second], "unit", { kind: "fridge" });
  assert.ok(moved.every((item) => item.location === "fridge"));
  assert.equal(moved.find((item) => item.id === "one")?.parentUnitId, "unit");
  assert.equal(moved.find((item) => item.id === "two")?.childOrder, 1);
});

test("dragging a Lesson onto a Unit nests it, adopts the Unit course, and clamps timing into the Unit", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit", courseId: "course-b", date: "2026-09-10", endDate: "2026-09-12" });
  const lesson = plan({ id: "lesson", title: "Visual Analysis", type: "lesson", courseId: "course-a", date: "2026-09-20" });
  const nested = nestLesson([unit, lesson], "lesson", "unit");
  const result = nested.find((item) => item.id === "lesson");
  assert.equal(result?.parentUnitId, "unit");
  assert.equal(result?.courseId, "course-b");
  assert.equal(result?.date, "2026-09-12");
  assert.equal(result?.childOrder, 0);
});

test("detaching a Lesson leaves the Unit intact and normalizes sibling order", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const first = plan({ id: "one", title: "One", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const second = plan({ id: "two", title: "Two", type: "lesson", parentUnitId: "unit", childOrder: 1 });
  const detached = detachLesson([unit, first, second], "one", { kind: "fridge" });
  assert.equal(detached.find((item) => item.id === "one")?.parentUnitId, null);
  assert.equal(detached.find((item) => item.id === "one")?.location, "fridge");
  assert.equal(detached.find((item) => item.id === "two")?.childOrder, 0);
});

test("deleting a Unit removes its full tree, while deleting a child only removes that Lesson", () => {
  const unit = plan({ id: "unit", title: "Prehistory", type: "unit" });
  const first = plan({ id: "one", title: "One", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const second = plan({ id: "two", title: "Two", type: "lesson", parentUnitId: "unit", childOrder: 1 });

  assert.deepEqual(deleteSelection([unit, first, second], "unit"), []);

  const childDelete = deleteSelection([unit, first, second], "one");
  assert.deepEqual(childDelete.map((item) => item.id), ["unit", "two"]);
  assert.equal(childDelete.find((item) => item.id === "two")?.childOrder, 0);
});