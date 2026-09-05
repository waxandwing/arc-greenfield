import test from "node:test";
import assert from "node:assert/strict";
import type { Workspace } from "../lib/domain";
import { objectLocation } from "../lib/object-lifecycle";
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
      id: "unit-1", type: "unit", title: "Clay", courseId: "course-a", date: "2026-09-08", endDate: "2026-09-12", location: "calendar", arcLocation: "calendar", taskContext: null, parentUnitId: null, childOrder: null, fixedDate: true, continuationOfId: null, notes: "Keep glaze notes", resources: [{ id: "r1", label: "Demo", url: "https://example.com/demo" }], details: { standards: "VA.912.S.1.1" }
    }],
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("a raw course removal commit cannot leave Arc plans orphaned or split-brain", () => {
  const source = workspace();
  const original = structuredClone(source.plans[0]);
  const history = createWorkspaceHistory(source);
  const next = { ...source, courses: source.courses.filter((course) => course.id !== "course-a") };
  const committed = commitWorkspace(history, next);
  const repaired = committed.present.plans[0];

  assert.equal(committed.present.courses.length, 1);
  assert.equal(repaired.courseId, "course-b");
  assert.equal(repaired.location, "ideas");
  assert.equal(repaired.arcLocation, "fridge");
  assert.equal(objectLocation(repaired), "fridge");
  assert.equal(repaired.id, original.id);
  assert.equal(repaired.date, original.date);
  assert.equal(repaired.fixedDate, true);
  assert.equal(repaired.notes, original.notes);
  assert.deepEqual(repaired.resources, original.resources);
  assert.deepEqual(repaired.details, original.details);
});

test("opening a workspace repairs stale course references too", () => {
  const source = workspace();
  source.courses = source.courses.filter((course) => course.id !== "course-a");
  const history = createWorkspaceHistory(source);
  assert.equal(history.present.plans[0].courseId, "course-b");
  assert.equal(history.present.plans[0].location, "ideas");
  assert.equal(history.present.plans[0].arcLocation, "fridge");
  assert.equal(objectLocation(history.present.plans[0]), "fridge");
});

test("Task Bar object stays a Task Bar object when its course disappears", () => {
  const source = workspace();
  source.plans[0] = {
    ...source.plans[0],
    arcLocation: "taskbar",
    location: "ideas",
    taskContext: { tier: "must", notes: "Print before lunch" }
  };
  source.courses = source.courses.filter((course) => course.id !== "course-a");
  const history = createWorkspaceHistory(source);
  const repaired = history.present.plans[0];

  assert.equal(repaired.courseId, "course-b");
  assert.equal(repaired.location, "ideas");
  assert.equal(repaired.arcLocation, "taskbar");
  assert.equal(objectLocation(repaired), "taskbar");
  assert.equal(repaired.taskContext?.tier, "must");
  assert.equal(repaired.fixedDate, true);
});
