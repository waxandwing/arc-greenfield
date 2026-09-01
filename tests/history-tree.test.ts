import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { movePlanToCalendarDate } from "../lib/plan-operations";
import { commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace } from "../lib/workspace-history";

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
  const lessonA = plan({ id: "lesson-a", title: "Pinch pots", type: "lesson", parentUnitId: unit.id, childOrder: 0, date: "2026-09-08" });
  const lessonB = plan({ id: "lesson-b", title: "Coil build", type: "lesson", parentUnitId: unit.id, childOrder: 1, date: "2026-09-10" });
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [{ id: "course-a", name: "3D Art", periodLabel: "2", color: "#2f6f73" }],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: [unit, lessonA, lessonB],
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("moving a Unit is one history action and Undo restores the whole tree", () => {
  const source = workspace();
  let history = createWorkspaceHistory(source);
  const moved = { ...history.present, plans: movePlanToCalendarDate(history.present.plans, "unit-1", "2026-09-15", "course-a") };
  history = commitWorkspace(history, moved);

  assert.equal(history.present.plans.find((item) => item.id === "unit-1")?.date, "2026-09-15");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-a")?.date, "2026-09-15");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-b")?.date, "2026-09-17");
  assert.equal(history.past.length, 1);

  history = undoWorkspace(history);
  assert.equal(history.present.plans.find((item) => item.id === "unit-1")?.date, "2026-09-08");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-a")?.date, "2026-09-08");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-b")?.date, "2026-09-10");

  history = redoWorkspace(history);
  assert.equal(history.present.plans.find((item) => item.id === "unit-1")?.date, "2026-09-15");
  assert.equal(history.present.plans.find((item) => item.id === "lesson-b")?.date, "2026-09-17");
});
