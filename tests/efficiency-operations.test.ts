import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import {
  applyInstructionalShift,
  checkpointQuarter,
  copyLessonNext,
  courseMeetsOnDate,
  extendLesson,
  nextCourseMeetingDate,
  nextInstructionalDate,
  previewInstructionalShift,
  reuseWeek,
  tackLesson
} from "../lib/efficiency-operations";

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

function withCourse(weekdays?: number[]) {
  const workspace = emptyWorkspace();
  workspace.courses = [{
    id: "course-a",
    name: "Studio Art",
    periodLabel: "2",
    color: "#eeb834",
    ...(weekdays ? { meetingPattern: { kind: "weekdays" as const, weekdays } } : {})
  }];
  return workspace;
}

test("next instructional date skips weekends and no-school dates", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.noSchoolDates = [{ id: "monday", date: "2026-09-07", label: "No school" }];
  assert.equal(nextInstructionalDate(workspace.calendar, "2026-09-04"), "2026-09-08");
});

test("old workspaces without a meeting pattern retain Monday-Friday behavior", () => {
  const workspace = withCourse();
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-08"), true);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-07"), "2026-09-08");
});

test("Monday Wednesday Friday class skips Tuesday and Thursday", () => {
  const workspace = withCourse([1, 3, 5]);
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-08"), false);
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-09"), true);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-07"), "2026-09-09");
});

test("Tuesday Thursday class skips Wednesday", () => {
  const workspace = withCourse([2, 4]);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-08"), "2026-09-10");
});

test("no-school dates override a normal course meeting weekday", () => {
  const workspace = withCourse([1, 3, 5]);
  workspace.calendar.noSchoolDates = [{ id: "off", date: "2026-09-09", label: "No school" }];
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-09"), false);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-07"), "2026-09-11");
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

test("Tack follows the lesson class meeting pattern", () => {
  let workspace = withCourse([1, 3, 5]);
  workspace.plans = [plan({ id: "lesson", title: "Critique", type: "lesson", date: "2026-09-07" })];
  workspace = tackLesson(workspace, "lesson");
  assert.equal(workspace.plans[0].date, "2026-09-09");
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

test("Extend and Copy next use the next real class meeting", () => {
  const workspace = withCourse([2, 4]);
  workspace.plans = [plan({ id: "lesson", title: "Clay demo", type: "lesson", date: "2026-09-08" })];
  const extended = extendLesson(workspace, "lesson");
  assert.equal(extended.workspace.plans.find((item) => item.id === extended.continuationId)?.date, "2026-09-10");
  const copied = copyLessonNext(workspace, "lesson");
  assert.equal(copied.workspace.plans.find((item) => item.id === copied.copyId)?.date, "2026-09-10");
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

test("Shift preflight blocks an entire unit tree when one child is fixed", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [
    plan({ id: "unit", title: "Printmaking", type: "unit", date: "2026-09-08", endDate: "2026-09-10" }),
    plan({ id: "lesson-a", title: "Demo", type: "lesson", date: "2026-09-08", parentUnitId: "unit", childOrder: 0 }),
    plan({ id: "lesson-b", title: "Critique", type: "lesson", date: "2026-09-10", parentUnitId: "unit", childOrder: 1, fixedDate: true })
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-08");
  assert.deepEqual(preview.blockedRootIds, ["unit"]);
  assert.equal(preview.affectedPlanIds.length, 0);
  assert.equal(preview.conflicts[0]?.kind, "fixed-date");
});

test("Shift preflight detects collisions with lessons outside the move set", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [
    plan({ id: "moving", title: "Moving lesson", type: "lesson", date: "2026-09-08" }),
    plan({ id: "older-unit", title: "Existing unit", type: "unit", date: "2026-09-01", endDate: "2026-09-11" }),
    plan({ id: "occupied", title: "Already there", type: "lesson", date: "2026-09-09", parentUnitId: "older-unit", childOrder: 0 })
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-08");
  assert.deepEqual(preview.blockedRootIds, ["moving"]);
  assert.equal(preview.conflicts[0]?.kind, "lesson-collision");
  assert.equal(preview.conflicts[0]?.conflictingPlanId, "occupied");
});

test("Shift collision uses the actual next course meeting date", () => {
  const workspace = withCourse([1, 3, 5]);
  workspace.plans = [
    plan({ id: "moving", title: "Moving lesson", type: "lesson", date: "2026-09-07" }),
    plan({ id: "older-unit", title: "Existing unit", type: "unit", date: "2026-09-01", endDate: "2026-09-11" }),
    plan({ id: "occupied", title: "Already there", type: "lesson", date: "2026-09-09", parentUnitId: "older-unit", childOrder: 0 })
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-07");
  assert.deepEqual(preview.blockedRootIds, ["moving"]);
  assert.equal(preview.conflicts[0]?.targetDate, "2026-09-09");
  assert.equal(preview.conflicts[0]?.conflictingPlanId, "occupied");
});

test("Shift apply moves only roots that passed preflight and skips no-school dates", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.noSchoolDates = [{ id: "off", date: "2026-09-09", label: "No school" }];
  workspace.plans = [
    plan({ id: "unit", title: "Sculpture", type: "unit", date: "2026-09-08", endDate: "2026-09-10" }),
    plan({ id: "lesson", title: "Armature", type: "lesson", date: "2026-09-08", parentUnitId: "unit", childOrder: 0 })
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-08");
  const next = applyInstructionalShift(workspace, preview);
  assert.equal(next.plans.find((item) => item.id === "unit")?.date, "2026-09-10");
  assert.equal(next.plans.find((item) => item.id === "lesson")?.date, "2026-09-10");
});

test("Shift moves a Unit tree by each member's next real class meeting", () => {
  const workspace = withCourse([1, 3, 5]);
  workspace.plans = [
    plan({ id: "unit", title: "Sculpture", type: "unit", date: "2026-09-07", endDate: "2026-09-11" }),
    plan({ id: "lesson-a", title: "Armature", type: "lesson", date: "2026-09-07", parentUnitId: "unit", childOrder: 0 }),
    plan({ id: "lesson-b", title: "Build", type: "lesson", date: "2026-09-09", parentUnitId: "unit", childOrder: 1 })
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-07");
  const next = applyInstructionalShift(workspace, preview);
  assert.equal(next.plans.find((item) => item.id === "unit")?.date, "2026-09-09");
  assert.equal(next.plans.find((item) => item.id === "unit")?.endDate, "2026-09-14");
  assert.equal(next.plans.find((item) => item.id === "lesson-a")?.date, "2026-09-09");
  assert.equal(next.plans.find((item) => item.id === "lesson-b")?.date, "2026-09-11");
});
