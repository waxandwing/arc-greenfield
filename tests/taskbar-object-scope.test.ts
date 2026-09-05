import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { movePlanToTaskBarSafely, objectLocation } from "../lib/object-lifecycle";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-08",
    endDate: type === "unit" ? "2026-09-12" : null,
    location: "ideas",
    arcLocation: "fridge",
    taskContext: null,
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

test("moving a reconciled Unit to Task Bar moves only the Unit, not its child Lessons", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const child = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: "unit", childOrder: 0 });
  const moved = movePlanToTaskBarSafely([unit, child], unit.id, "must");

  assert.equal(objectLocation(moved.find((item) => item.id === "unit")!), "taskbar");
  assert.equal(moved.find((item) => item.id === "unit")?.taskContext?.tier, "must");
  assert.equal(objectLocation(moved.find((item) => item.id === "lesson")!), "fridge");
  assert.equal(moved.find((item) => item.id === "lesson")?.taskContext, null);
});

test("moving a Unit to Task Bar fails closed while a child Lesson is still calendar-placed", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const child = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: "unit", childOrder: 0, location: "calendar", arcLocation: "calendar", date: "2026-09-09" });
  const original = [unit, child];
  const moved = movePlanToTaskBarSafely(original, unit.id, "must");

  assert.deepEqual(moved, original);
});
