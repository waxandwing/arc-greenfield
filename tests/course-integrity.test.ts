import test from "node:test";
import assert from "node:assert/strict";
import type { Workspace } from "../lib/domain";
import { commitWorkspace, createWorkspaceHistory } from "../lib/workspace-history";

function workspace(): Workspace {
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [
      { id: "course-a", name: "3D Art", periodLabel: "2", color: "#2f6f73" },
      { id: "course-b", name: "AP Art History", periodLabel: "4", color: "#557b93" }
    ],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: [{
      id: "unit-1", type: "unit", title: "Clay", courseId: "course-a", date: "2026-09-08", endDate: "2026-09-12", location: "calendar", parentUnitId: null, childOrder: null, fixedDate: false, continuationOfId: null, notes: "", resources: [], details: {}
    }],
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("a raw course removal commit cannot leave Arc plans orphaned", () => {
  const source = workspace();
  const history = createWorkspaceHistory(source);
  const next = { ...source, courses: source.courses.filter((course) => course.id !== "course-a") };
  const committed = commitWorkspace(history, next);
  assert.equal(committed.present.courses.length, 1);
  assert.equal(committed.present.plans[0].courseId, "course-b");
  assert.equal(committed.present.plans[0].location, "ideas");
});

test("opening a workspace repairs stale course references too", () => {
  const source = workspace();
  source.courses = source.courses.filter((course) => course.id !== "course-a");
  const history = createWorkspaceHistory(source);
  assert.equal(history.present.plans[0].courseId, "course-b");
  assert.equal(history.present.plans[0].location, "ideas");
});
