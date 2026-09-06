import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { createWorkspaceHistory } from "../lib/workspace-history";
import { dispatchWorkspaceCommand, undoWorkspaceCommand } from "../lib/workspace-controller";

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

function workspace(): Workspace {
  const unit = plan({ id: "unit-1", title: "Clay Foundations", type: "unit" });
  const lesson = plan({ id: "lesson-1", title: "Pinch pots", type: "lesson", parentUnitId: unit.id, childOrder: 0 });
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [{ id: "course-a", name: "3D Art", periodLabel: "2", color: "#2f6f73" }],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: [unit, lesson],
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("controller records a Unit park as exactly one history command", () => {
  let history = createWorkspaceHistory(workspace());
  history = dispatchWorkspaceCommand(history, { type: "plan.move-to-ideas", planId: "unit-1" });

  assert.equal(history.past.length, 1);
  assert.equal(history.present.plans.find((item) => item.id === "unit-1")?.location, "ideas");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-1")?.location, "ideas");

  history = undoWorkspaceCommand(history);
  assert.equal(history.present.plans.find((item) => item.id === "unit-1")?.location, "calendar");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-1")?.location, "calendar");
});

test("controller no-op commands do not create empty history entries", () => {
  const history = createWorkspaceHistory(workspace());
  const next = dispatchWorkspaceCommand(history, { type: "plan.move-to-ideas", planId: "missing" });
  assert.equal(next, history);
  assert.equal(next.past.length, 0);
});
