import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { createClipboard, pasteClipboard } from "../lib/clipboard";

function lesson(id: string): Plan {
  return {
    id,
    type: "lesson",
    title: "Visual analysis",
    courseId: "course-a",
    date: "2026-09-08",
    endDate: null,
    location: "calendar",
    arcLocation: "calendar",
    taskContext: null,
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "retain me",
    resources: [],
    details: {}
  };
}

function workspace(plans: Plan[]): Workspace {
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [{ id: "course-a", name: "AP Art History", periodLabel: "1", color: "#7C9CAD" }],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans,
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-05T00:00:00.000Z"
  };
}

test("Cut paste fails closed if the original stable ID still exists in the destination workspace", () => {
  const sourcePlan = lesson("stable-id");
  const source = workspace([sourcePlan]);
  const clipboard = createClipboard(source, sourcePlan.id, "cut");
  assert.ok(clipboard);

  // Deliberately misuse the low-level paste API without applyCut first. The
  // domain must refuse to create two canonical records with one identity.
  const result = pasteClipboard(source, clipboard, { location: "calendar", date: "2026-09-15", courseId: "course-a" });

  assert.equal(result.pastedRootId, null);
  assert.equal(result.nextClipboard, clipboard);
  assert.equal(result.workspace, source);
  assert.equal(result.workspace.plans.length, 1);
  assert.equal(result.workspace.plans[0].id, "stable-id");
});
