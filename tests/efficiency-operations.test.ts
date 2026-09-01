import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { checkpointQuarter, copyLessonNext, extendLesson, nextInstructionalDate, reuseWeek, tackLesson } from "../lib/efficiency-operations";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-04",
    endDate: type === "unit" ? "2026-09-04" : null,
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

test("next instructional date skips weekends and no-school dates", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.noSchoolDates = [{ id: "monday", date: "2026-09-07", label: "No school" }];
  assert.equal(nextInstructionalDate(workspace.calendar, "2026-09-04"), "2026-09-08");
});

test("Tack moves the same lesson and respects fixed dates", () => {
  let workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "lesson", title: "Critique", type: "lesson" })];
  workspace = tackLesson(workspace, "lesson");
  assert.equal(workspace.plans[0].id, "lesson");
  assert.equal(workspace.plans[0].date, "2026-09-07");
  const fixed = { ...workspace, plans: [{ ...workspace.plans[0], fixedDate: true }] };
  assert.deepEqual(tackLesson(fixed, "lesson").plans, fixed.plans);
});

test("Extend creates a continuation without moving the original", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "lesson", title: "Clay demo", type: "lesson" })];
  const result = extendLesson(workspace, "lesson");
  assert.equal(result.workspace.plans.length, 2);
  assert.equal(result.workspace.plans[0].date, "2026-09-04");
  const continuation = result.workspace.plans.find((item) => item.id === result.continuationId);
  assert.equal(continuation?.date, "2026-09-07");
  assert.equal(continuation?.continuationOfId, "lesson");
});

test("Copy next creates a distinct stable ID", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "lesson", title: "Visual analysis", type: "lesson" })];
  const result = copyLessonNext(workspace, "lesson");
  assert.equal(result.workspace.plans.length, 2);
  assert.notEqual(result.copyId, "lesson");
  assert.equal(result.workspace.plans[1].title, "Visual analysis");
});

test("Reuse week remaps unit-child IDs and shifts dates seven days", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [
    plan({ id: "unit", title: "Prehistory", type: "unit", date: "2026-09-01", endDate: "2026-09-04" }),
    plan({ id: "lesson", title: "Cave Context", type: "lesson", date: "2026-09-02", parentUnitId: "unit", childOrder: 0 })
  ];
  const result = reuseWeek(workspace, "2026-08-31");
  assert.equal(result.createdIds.length, 2);
  const copiedUnit = result.workspace.plans.find((item) => item.id === result.createdIds[0]);
  const copiedLesson = result.workspace.plans.find((item) => item.id === result.createdIds[1]);
  assert.equal(copiedUnit?.date, "2026-09-08");
  assert.equal(copiedLesson?.date, "2026-09-09");
  assert.equal(copiedLesson?.parentUnitId, copiedUnit?.id);
});

test("Quarter checkpoint is non-destructive", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "lesson", title: "Checkpoint me", type: "lesson" })];
  const next = checkpointQuarter(workspace, "q1");
  assert.equal(next.plans.length, 1);
  assert.equal(next.checkpoints?.length, 1);
  assert.equal(next.checkpoints?.[0].plans[0].id, "lesson");
});
