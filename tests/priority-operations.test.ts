import test from "node:test";
import assert from "node:assert/strict";
import type { Workspace } from "../lib/domain";
import { deletePriority, movePriority, renamePriority, reorderPriority } from "../lib/priority-operations";

function workspace(): Workspace {
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [],
    calendar: { firstStudentDay: null, lastStudentDay: null, quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: [],
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
  assert.equal(unchanged, next);
});
