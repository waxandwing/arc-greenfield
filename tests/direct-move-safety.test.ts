import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { moveLoosePlanByDelta, movePlanToCalendarDate, moveUnitTreeByDelta, nestLesson } from "../lib/plan-operations";

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

test("direct move cannot shift a fixed Lesson", () => {
  const fixed = plan({ id: "fixed", title: "Assessment", type: "lesson", fixedDate: true });
  const plans = [fixed];
  assert.deepEqual(movePlanToCalendarDate(plans, "fixed", "2026-09-09", "course-a"), plans);
  assert.deepEqual(moveLoosePlanByDelta(plans, "fixed", 1), plans);
});

test("direct Unit drag cannot carry a fixed child to another date", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const fixed = plan({ id: "fixed", title: "Assessment", type: "lesson", parentUnitId: "unit", fixedDate: true, date: "2026-09-10" });
  const plans = [unit, fixed];
  assert.deepEqual(movePlanToCalendarDate(plans, "unit", "2026-09-15", "course-a"), plans);
  assert.deepEqual(moveUnitTreeByDelta(plans, "unit", 7), plans);
});

test("direct loose Lesson move cannot overwrite another Lesson in the same class and day", () => {
  const moving = plan({ id: "moving", title: "Discussion", type: "lesson", date: "2026-09-08" });
  const occupied = plan({ id: "occupied", title: "Quiz", type: "lesson", date: "2026-09-09" });
  const plans = [moving, occupied];
  assert.deepEqual(movePlanToCalendarDate(plans, "moving", "2026-09-09", "course-a"), plans);
});

test("direct Unit move blocks when a nested Lesson would collide after the shift", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", date: "2026-09-08", endDate: "2026-09-12" });
  const child = plan({ id: "child", title: "Khafre", type: "lesson", parentUnitId: "unit", date: "2026-09-09" });
  const occupied = plan({ id: "occupied", title: "Quiz", type: "lesson", parentUnitId: null, date: "2026-09-16" });
  const plans = [unit, child, occupied];
  assert.deepEqual(movePlanToCalendarDate(plans, "unit", "2026-09-15", "course-a"), plans);
});

test("fixed Lesson can still be nested when nesting does not change its date, class, or location", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", date: "2026-09-08", endDate: "2026-09-12" });
  const fixed = plan({ id: "fixed", title: "Assessment", type: "lesson", fixedDate: true, date: "2026-09-10" });
  const result = nestLesson([unit, fixed], "fixed", "unit");
  assert.equal(result.find((item) => item.id === "fixed")?.parentUnitId, "unit");
  assert.equal(result.find((item) => item.id === "fixed")?.date, "2026-09-10");
});

test("fixed Lesson cannot be nested when the Unit would clamp its date", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", date: "2026-09-08", endDate: "2026-09-12" });
  const fixed = plan({ id: "fixed", title: "Assessment", type: "lesson", fixedDate: true, date: "2026-09-20" });
  const plans = [unit, fixed];
  assert.deepEqual(nestLesson(plans, "fixed", "unit"), plans);
});
