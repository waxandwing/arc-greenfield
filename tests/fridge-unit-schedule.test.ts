import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { movePlanToCalendarDate } from "../lib/plan-operations";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return { id, title, type, courseId: "course-a", date: null, endDate: null, location: "fridge", parentUnitId: null, childOrder: null, fixedDate: false, continuationOfId: null, notes: "", resources: [], details: {}, ...rest };
}

test("an unscheduled Fridge Unit schedules its nested Lessons with it", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [
    plan({ id: "unit", title: "Printmaking", type: "unit" }),
    plan({ id: "lesson", title: "Monoprint demo", type: "lesson", parentUnitId: "unit", childOrder: 0 })
  ];
  const plans = movePlanToCalendarDate(workspace.plans, "unit", "2026-09-14", "course-b");
  assert.equal(plans.find((item) => item.id === "unit")?.date, "2026-09-14");
  assert.equal(plans.find((item) => item.id === "lesson")?.date, "2026-09-14");
  assert.ok(plans.every((item) => item.location === "calendar"));
  assert.ok(plans.every((item) => item.courseId === "course-b"));
});
