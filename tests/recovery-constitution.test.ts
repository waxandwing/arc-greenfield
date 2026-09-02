import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan, type Workspace } from "../lib/domain";
import { applyInstructionalShift, extendLesson, previewInstructionalShift } from "../lib/efficiency-operations";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-08",
    endDate: type === "unit" ? "2026-09-11" : null,
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

function workspace(plans: Plan[]): Workspace {
  const current = emptyWorkspace();
  current.courses = [
    { id: "course-a", name: "AP Art History", periodLabel: "2", color: "#d46b42" },
    { id: "course-b", name: "Studio Art", periodLabel: "4", color: "#4b8696" }
  ];
  current.plans = plans;
  return current;
}

test("recovery preview is read-only", () => {
  const current = workspace([plan({ id: "lesson", title: "Visual analysis", type: "lesson" })]);
  const before = structuredClone(current);
  previewInstructionalShift(current, ["course-a"], "2026-09-08");
  assert.deepEqual(current, before);
});

test("recovery never deletes plans", () => {
  const current = workspace([
    plan({ id: "unit", title: "Egypt", type: "unit" }),
    plan({ id: "lesson", title: "Ka and kingship", type: "lesson", parentUnitId: "unit", childOrder: 0 })
  ]);
  const preview = previewInstructionalShift(current, ["course-a"], "2026-09-08");
  const next = applyInstructionalShift(current, preview);
  assert.equal(next.plans.length, current.plans.length);
  assert.deepEqual(new Set(next.plans.map((item) => item.id)), new Set(current.plans.map((item) => item.id)));
});

test("selecting one class cannot move another class", () => {
  const current = workspace([
    plan({ id: "a", title: "APAH", type: "lesson", courseId: "course-a" }),
    plan({ id: "b", title: "Studio", type: "lesson", courseId: "course-b" })
  ]);
  const preview = previewInstructionalShift(current, ["course-a"], "2026-09-08");
  const next = applyInstructionalShift(current, preview);
  assert.notEqual(next.plans.find((item) => item.id === "a")?.date, "2026-09-08");
  assert.equal(next.plans.find((item) => item.id === "b")?.date, "2026-09-08");
});

test("a fixed child prevents a partial unit shift", () => {
  const current = workspace([
    plan({ id: "unit", title: "Mesopotamia", type: "unit" }),
    plan({ id: "lesson-a", title: "White Temple", type: "lesson", parentUnitId: "unit", childOrder: 0 }),
    plan({ id: "lesson-b", title: "Assessment", type: "lesson", parentUnitId: "unit", childOrder: 1, date: "2026-09-10", fixedDate: true })
  ]);
  const preview = previewInstructionalShift(current, ["course-a"], "2026-09-08");
  const next = applyInstructionalShift(current, preview);
  assert.deepEqual(next.plans, current.plans);
  assert.deepEqual(preview.blockedRootIds, ["unit"]);
});

test("a collision remains unresolved instead of overwriting the destination", () => {
  const current = workspace([
    plan({ id: "moving", title: "Discussion", type: "lesson", date: "2026-09-08" }),
    plan({ id: "older", title: "Earlier unit", type: "unit", date: "2026-09-01", endDate: "2026-09-18" }),
    plan({ id: "occupied", title: "Quiz", type: "lesson", parentUnitId: "older", childOrder: 0, date: "2026-09-09" })
  ]);
  const preview = previewInstructionalShift(current, ["course-a"], "2026-09-08");
  const next = applyInstructionalShift(current, preview);
  assert.equal(next.plans.find((item) => item.id === "moving")?.date, "2026-09-08");
  assert.equal(next.plans.find((item) => item.id === "occupied")?.date, "2026-09-09");
  assert.equal(preview.conflicts[0]?.conflictingPlanId, "occupied");
});

test("partial teaching continues without rewriting the original lesson", () => {
  const current = workspace([
    plan({ id: "lesson", title: "Armature demo", type: "lesson", details: { deliveryState: "partial" } })
  ]);
  const result = extendLesson(current, "lesson");
  assert.equal(result.workspace.plans.find((item) => item.id === "lesson")?.date, "2026-09-08");
  const continuation = result.workspace.plans.find((item) => item.id === result.continuationId);
  assert.equal(continuation?.continuationOfId, "lesson");
  assert.equal(continuation?.title, "Armature demo · continued");
});

test("two selected classes recover independently in one preview", () => {
  const current = workspace([
    plan({ id: "a", title: "APAH", type: "lesson", courseId: "course-a" }),
    plan({ id: "b", title: "Studio", type: "lesson", courseId: "course-b" })
  ]);
  const preview = previewInstructionalShift(current, ["course-a", "course-b"], "2026-09-08");
  const next = applyInstructionalShift(current, preview);
  assert.equal(preview.movableRootIds.length, 2);
  assert.equal(next.plans.find((item) => item.id === "a")?.date, "2026-09-09");
  assert.equal(next.plans.find((item) => item.id === "b")?.date, "2026-09-09");
});
