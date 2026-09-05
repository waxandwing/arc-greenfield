import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { commitWorkspace, createWorkspaceHistory } from "../lib/workspace-history";
import { repairPlanRelationships } from "../lib/workspace-integrity";

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
    arcLocation: "calendar",
    taskContext: null,
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
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [
      { id: "course-a", name: "AP Art History", periodLabel: "1", color: "#7C9CAD" },
      { id: "course-b", name: "2D Art", periodLabel: "2", color: "#C96845" }
    ],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans,
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-05T00:00:00.000Z"
  };
}

test("Lesson with missing Unit is preserved but detached", () => {
  const orphan = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: "missing-unit", childOrder: 3, notes: "do not lose" });
  const repaired = repairPlanRelationships(workspace([orphan]));
  const result = repaired.plans[0];

  assert.equal(result.id, orphan.id);
  assert.equal(result.parentUnitId, null);
  assert.equal(result.childOrder, null);
  assert.equal(result.notes, "do not lose");
});

test("Lesson nested under a non-Unit is detached instead of hidden as a pseudo-child", () => {
  const fakeParent = plan({ id: "parent", title: "Not a unit", type: "note" });
  const child = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: fakeParent.id, childOrder: 0 });
  const repaired = repairPlanRelationships(workspace([fakeParent, child]));

  assert.equal(repaired.plans.find((item) => item.id === child.id)?.parentUnitId, null);
});

test("cross-course Lesson/Unit relationship is detached without changing either course", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", courseId: "course-a" });
  const child = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: unit.id, childOrder: 0, courseId: "course-b" });
  const repaired = repairPlanRelationships(workspace([unit, child]));
  const result = repaired.plans.find((item) => item.id === child.id)!;

  assert.equal(result.parentUnitId, null);
  assert.equal(result.courseId, "course-b");
  assert.equal(repaired.plans.find((item) => item.id === unit.id)?.courseId, "course-a");
});

test("valid same-course Unit/Lesson relationship is left untouched", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const child = plan({ id: "lesson", title: "Narmer", type: "lesson", parentUnitId: unit.id, childOrder: 0 });
  const source = workspace([unit, child]);
  assert.equal(repairPlanRelationships(source), source);
});

test("history refuses a commit that introduces duplicate stable IDs", () => {
  const original = plan({ id: "stable", title: "Original", type: "lesson" });
  const history = createWorkspaceHistory(workspace([original]));
  const duplicate = { ...original, title: "Duplicate record" };
  const next = { ...history.present, plans: [original, duplicate] };
  const committed = commitWorkspace(history, next);

  assert.equal(committed, history);
  assert.equal(committed.present.plans.length, 1);
  assert.equal(committed.present.plans[0].title, "Original");
});
