import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { movePlanToCalendarDate } from "../lib/plan-operations";

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
