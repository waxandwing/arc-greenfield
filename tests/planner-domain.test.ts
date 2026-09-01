import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard } from "../lib/clipboard";
import { clonePlanTree, collectPlanTree, movePlanTreeToIdeas, shiftPlanTree } from "../lib/plan-tree";
import { quarterRange } from "../lib/view-ranges";

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

const unit = plan({ id: "unit-1", title: "Clay Foundations", type: "unit" });
const lessonA = plan({ id: "lesson-a", title: "Pinch pots", type: "lesson", parentUnitId: unit.id, childOrder: 0, date: "2026-09-08" });
const lessonB = plan({ id: "lesson-b", title: "Coil build", type: "lesson", parentUnitId: unit.id, childOrder: 1, date: "2026-09-10" });
const plans = [unit, lessonA, lessonB];

function workspace(sourcePlans = plans): Workspace {
  return {
    schemaVersion: 2,
    id: "workspace",
    ownerId: null,
    teacherName: "Teacher",
    roles: [],
    courses: [{ id: "course-a", name: "3D Art", periodLabel: "2", color: "#2f6f73" }, { id: "course-b", name: "AP Art History", periodLabel: "4", color: "#557b93" }],
    calendar: { firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-26", quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans: structuredClone(sourcePlans),
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("collectPlanTree keeps a Unit and all embedded Lessons together", () => {
  assert.deepEqual(collectPlanTree(plans, unit.id).map((item) => item.id), ["unit-1", "lesson-a", "lesson-b"]);
});

test("shifting a Unit preserves Lesson spacing and can change class", () => {
  const shifted = shiftPlanTree(plans, unit.id, 7, "course-b");
  assert.equal(shifted.find((item) => item.id === "unit-1")?.date, "2026-09-15");
  assert.equal(shifted.find((item) => item.id === "lesson-a")?.date, "2026-09-15");
  assert.equal(shifted.find((item) => item.id === "lesson-b")?.date, "2026-09-17");
  assert.ok(shifted.every((item) => item.courseId === "course-b"));
});

test("copying a Unit creates new IDs while preserving hierarchy", () => {
  const clones = clonePlanTree(plans, unit.id, "2026-10-06", "course-b");
  const root = clones.find((item) => item.parentUnitId === null);
  assert.ok(root);
  assert.notEqual(root.id, unit.id);
  const children = clones.filter((item) => item.parentUnitId === root.id);
  assert.equal(children.length, 2);
  assert.equal(children[0].date, "2026-10-06");
  assert.equal(children[1].date, "2026-10-08");
});

test("moving a Unit to Ideas preserves its internal dates for later scheduling", () => {
  const moved = movePlanTreeToIdeas(plans, unit.id);
  assert.ok(moved.every((item) => item.location === "ideas"));
  assert.equal(moved.find((item) => item.id === "lesson-b")?.date, "2026-09-10");
});

test("cut then paste restores the whole Unit tree at a new date and class", () => {
  const source = workspace();
  const clipboard = createClipboard(source, unit.id, "cut");
  assert.ok(clipboard);
  const cut = applyCut(source, clipboard);
  assert.equal(cut.plans.length, 0);
  const pasted = pasteClipboard(cut, clipboard, { location: "calendar", date: "2026-11-03", courseId: "course-b" });
  assert.ok(pasted.pastedRootId);
  assert.equal(pasted.workspace.plans.length, 3);
  const pastedRoot = pasted.workspace.plans.find((item) => item.id === pasted.pastedRootId);
  assert.equal(pastedRoot?.date, "2026-11-03");
  const pastedChildren = pasted.workspace.plans.filter((item) => item.parentUnitId === pastedRoot?.id).sort((a, b) => (a.childOrder ?? 0) - (b.childOrder ?? 0));
  assert.equal(pastedChildren[1].date, "2026-11-05");
  assert.ok(pasted.workspace.plans.every((item) => item.courseId === "course-b"));
});

test("a cut clipboard is consumed after one successful paste", () => {
  const source = workspace();
  const clipboard = createClipboard(source, unit.id, "cut");
  assert.ok(clipboard);
  const cut = applyCut(source, clipboard);
  const first = pasteClipboard(cut, clipboard, { location: "calendar", date: "2026-11-03", courseId: "course-b" });
  assert.ok(first.pastedRootId);
  assert.equal(clipboard.tree.length, 0);
  const second = pasteClipboard(first.workspace, clipboard, { location: "calendar", date: "2026-12-01", courseId: "course-a" });
  assert.equal(second.pastedRootId, null);
  assert.equal(second.workspace.plans.length, first.workspace.plans.length);
});

test("copying one nested Lesson pastes it as a standalone Lesson, not back into the source Unit", () => {
  const source = workspace();
  const clipboard = createClipboard(source, lessonB.id, "copy");
  assert.ok(clipboard);
  assert.equal(clipboard.tree.length, 1);
  assert.equal(clipboard.tree[0].parentUnitId, null);
  const pasted = pasteClipboard(source, clipboard, { location: "calendar", date: "2026-12-01", courseId: "course-b" });
  const pastedLesson = pasted.workspace.plans.find((item) => item.id === pasted.pastedRootId);
  assert.equal(pastedLesson?.parentUnitId, null);
  assert.equal(pastedLesson?.date, "2026-12-01");
  assert.equal(pastedLesson?.courseId, "course-b");
});

test("Quarter rejects an end date earlier than its start date", () => {
  const calendar = workspace().calendar;
  calendar.quarterBoundaries = [{ id: "q1", label: "Quarter 1", start: "2026-10-10", end: "2026-09-01" }];
  assert.equal(quarterRange(calendar, "q1"), null);
});

test("Quarter uses configured real boundaries", () => {
  const calendar = workspace().calendar;
  calendar.quarterBoundaries = [{ id: "q1", label: "Quarter 1", start: "2026-08-10", end: "2026-10-09" }];
  const range = quarterRange(calendar, "q1");
  assert.ok(range);
  assert.equal(range.label, "Quarter 1");
  assert.ok(range.weeks.length >= 8);
});
