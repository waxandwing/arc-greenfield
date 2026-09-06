import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { moveWorkspacePlanToCalendar, moveWorkspacePlanToIdeas } from "../lib/workspace-plan-operations";
import { commitWorkspace, createWorkspaceHistory, undoWorkspace } from "../lib/workspace-history";

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

test("parking a Unit in Ideas moves the entire tree and Undo restores it as one history action", () => {
  let history = createWorkspaceHistory(workspace());
  const parked = moveWorkspacePlanToIdeas(history.present, "unit-1");
  history = commitWorkspace(history, parked);

  for (const id of ["unit-1", "lesson-a", "lesson-b"]) {
    assert.equal(history.present.plans.find((item) => item.id === id)?.location, "ideas");
  }
  assert.equal(history.past.length, 1);

  history = undoWorkspace(history);
  for (const id of ["unit-1", "lesson-a", "lesson-b"]) {
    assert.equal(history.present.plans.find((item) => item.id === id)?.location, "calendar");
  }
});

test("a child lesson parked independently becomes an independent Ideas object", () => {
  const next = moveWorkspacePlanToIdeas(workspace(), "lesson-a");
  const lesson = next.plans.find((item) => item.id === "lesson-a");

  assert.equal(lesson?.location, "ideas");
  assert.equal(lesson?.parentUnitId, null);
  assert.equal(lesson?.childOrder, null);
  assert.equal(next.plans.find((item) => item.id === "unit-1")?.location, "calendar");
});

test("restoring a parked Unit to a date preserves relative lesson offsets", () => {
  const parked = moveWorkspacePlanToIdeas(workspace(), "unit-1");
  const restored = moveWorkspacePlanToCalendar(parked, "unit-1", "2026-09-15", "course-a");

  assert.equal(restored.plans.find((item) => item.id === "unit-1")?.date, "2026-09-15");
  assert.equal(restored.plans.find((item) => item.id === "lesson-a")?.date, "2026-09-15");
  assert.equal(restored.plans.find((item) => item.id === "lesson-b")?.date, "2026-09-17");
  for (const id of ["unit-1", "lesson-a", "lesson-b"]) {
    assert.equal(restored.plans.find((item) => item.id === id)?.location, "calendar");
  }
});

test("unknown plan ids are a no-op", () => {
  const source = workspace();
  assert.equal(moveWorkspacePlanToIdeas(source, "missing"), source);
});
