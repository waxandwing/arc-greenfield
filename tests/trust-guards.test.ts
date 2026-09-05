import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { applyCut, createClipboard, cutBlocker, pasteClipboard } from "../lib/clipboard";
import { shiftPlanTree } from "../lib/plan-tree";

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

test("lowest-level Unit tree shift refuses to move any fixed dated descendant", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", date: "2026-09-08" });
  const flexible = plan({ id: "flex", title: "Narmer", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" });
  const fixed = plan({ id: "fixed", title: "Museum visit", type: "lesson", parentUnitId: "unit", childOrder: 1, date: "2026-09-10", fixedDate: true });
  const original = [unit, flexible, fixed];

  const shifted = shiftPlanTree(original, unit.id, 7, "course-b");
  assert.deepEqual(shifted, original);
});

test("a zero-day Unit tree change may change class while preserving fixed dates", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", date: "2026-09-08" });
  const fixed = plan({ id: "fixed", title: "Museum visit", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-10", fixedDate: true });
  const shifted = shiftPlanTree([unit, fixed], unit.id, 0, "course-b");

  assert.equal(shifted.find((item) => item.id === "unit")?.date, "2026-09-08");
  assert.equal(shifted.find((item) => item.id === "fixed")?.date, "2026-09-10");
  assert.ok(shifted.every((item) => item.courseId === "course-b"));
});

test("Cut is refused when the selected object tree contains a fixed dated anchor", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const fixed = plan({ id: "fixed", title: "Museum visit", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-10", fixedDate: true });
  const source = workspace([unit, fixed]);

  const blocker = cutBlocker(source, unit.id);
  assert.equal(blocker?.code, "fixed-date");
  assert.deepEqual(blocker?.fixedPlans, [{ id: "fixed", title: "Museum visit", date: "2026-09-10" }]);
  assert.equal(createClipboard(source, unit.id, "cut"), null);
  assert.equal(source.plans.length, 2, "a blocked Cut never removes the source objects");
});

test("successful Cut → Paste preserves the exact stable IDs and rich data", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", notes: "retain unit note" });
  const lesson = plan({
    id: "lesson",
    title: "Narmer",
    type: "lesson",
    parentUnitId: "unit",
    childOrder: 0,
    date: "2026-09-09",
    notes: "retain lesson note",
    resources: [{ id: "source", label: "Smarthistory", url: "https://smarthistory.org" }],
    details: { standards: "visual analysis" }
  });
  const source = workspace([unit, lesson]);
  const clipboard = createClipboard(source, unit.id, "cut");
  assert.ok(clipboard);

  const cut = applyCut(source, clipboard);
  assert.equal(cut.plans.length, 0);

  const pasted = pasteClipboard(cut, clipboard, { location: "calendar", date: "2026-09-15", courseId: "course-b" });
  assert.equal(pasted.pastedRootId, "unit");
  assert.equal(pasted.nextClipboard, null);
  assert.deepEqual(new Set(pasted.workspace.plans.map((item) => item.id)), new Set(["unit", "lesson"]));
  assert.equal(pasted.workspace.plans.find((item) => item.id === "unit")?.date, "2026-09-15");
  assert.equal(pasted.workspace.plans.find((item) => item.id === "lesson")?.date, "2026-09-16");
  assert.equal(pasted.workspace.plans.find((item) => item.id === "lesson")?.parentUnitId, "unit");
  assert.equal(pasted.workspace.plans.find((item) => item.id === "lesson")?.notes, "retain lesson note");
  assert.deepEqual(pasted.workspace.plans.find((item) => item.id === "lesson")?.resources, lesson.resources);
  assert.deepEqual(pasted.workspace.plans.find((item) => item.id === "lesson")?.details, lesson.details);
});

test("Copy → Paste still creates new IDs because Copy is duplication, not movement", () => {
  const lesson = plan({ id: "lesson", title: "Narmer", type: "lesson" });
  const source = workspace([lesson]);
  const clipboard = createClipboard(source, lesson.id, "copy");
  assert.ok(clipboard);

  const pasted = pasteClipboard(source, clipboard, { location: "calendar", date: "2026-09-15", courseId: "course-b" });
  assert.notEqual(pasted.pastedRootId, lesson.id);
  assert.equal(pasted.nextClipboard, clipboard);
  assert.equal(pasted.workspace.plans.length, 2);
});
