import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import {
  deletePriority,
  linkPriorityToPlan,
  movePriority,
  priorityCounts,
  renamePriority,
  reorderPriority,
  togglePriorityCircle,
  togglePriorityCompleted
} from "../lib/priority-operations";

function workspace(): Workspace {
  const plan: Plan = {
    id: "lesson-1",
    type: "lesson",
    title: "Critique",
    courseId: "course-a",
    date: "2026-09-08",
    endDate: null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {}
  };
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [],
    calendar: { firstStudentDay: null, lastStudentDay: null, quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: [plan],
    priorities: [
      { id: "a", title: "Print rubrics", tier: "must", completed: false, scope: "school" },
      { id: "b", title: "Email family", tier: "must", completed: false, scope: "school" },
      { id: "c", title: "Order clay", tier: "should", completed: false, scope: "school" }
    ],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("priorities can be renamed, moved between tiers, and deleted", () => {
  let next = renamePriority(workspace(), "a", "  Print critique sheets  ");
  assert.equal(next.priorities[0].title, "Print critique sheets");
  next = movePriority(next, "a", "could");
  assert.equal(next.priorities[0].tier, "could");
  next = deletePriority(next, "a");
  assert.equal(next.priorities.some((priority) => priority.id === "a"), false);
});

test("priority reorder only swaps within the same tier", () => {
  const next = reorderPriority(workspace(), "b", -1);
  assert.deepEqual(next.priorities.map((priority) => priority.id), ["b", "a", "c"]);
  const unchanged = reorderPriority(next, "b", -1);
  assert.deepEqual(unchanged.priorities.map((priority) => priority.id), ["b", "a", "c"]);
});

test("red circle is independent from completion", () => {
  const circled = togglePriorityCircle(workspace(), "a");
  assert.equal(circled.priorities[0].circled, true);
  assert.equal(circled.priorities[0].completed, false);
  const uncircled = togglePriorityCircle(circled, "a");
  assert.equal(uncircled.priorities[0].circled, false);
});

test("completion crosses out a task and can be reversed before deletion", () => {
  const completed = togglePriorityCompleted(workspace(), "a", "2026-09-01T12:00:00.000Z");
  assert.equal(completed.priorities[0].completed, true);
  assert.equal(completed.priorities[0].crossedOutAt, "2026-09-01T12:00:00.000Z");
  const reopened = togglePriorityCompleted(completed, "a");
  assert.equal(reopened.priorities[0].completed, false);
  assert.equal(reopened.priorities[0].crossedOutAt, null);
});

test("a priority can link to a real calendar or Fridge object", () => {
  const linked = linkPriorityToPlan(workspace(), "a", "lesson-1");
  assert.equal(linked.priorities[0].linkedPlanId, "lesson-1");
  const unchanged = linkPriorityToPlan(linked, "a", "missing");
  assert.equal(unchanged.priorities[0].linkedPlanId, "lesson-1");
});

test("priority counts reflect Must Should Could", () => {
  assert.deepEqual(priorityCounts(workspace().priorities), { must: 2, should: 1, could: 0 });
});