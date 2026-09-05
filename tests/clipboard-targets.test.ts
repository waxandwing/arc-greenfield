import test from "node:test";
import assert from "node:assert/strict";
import type { Plan, Workspace } from "../lib/domain";
import { canPasteClipboardToTarget, createClipboard, pasteClipboard } from "../lib/clipboard";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: type === "note" ? null : "course-a",
    date: type === "note" ? null : "2026-09-08",
    endDate: type === "unit" ? "2026-09-12" : null,
    location: type === "note" ? "ideas" : "calendar",
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
    courses: [{ id: "course-a", name: "Art", periodLabel: "1", color: "#000" }],
    calendar: { firstStudentDay: null, lastStudentDay: null, quarterBoundaries: [], noSchoolDates: [], weekendsVisible: false },
    plans,
    priorities: [],
    yearMarkers: [],
    preferences: { landingView: "week", lastUsedView: "week", dayVisibleInSwitcher: true, collapsedUnitIds: [] },
    updatedAt: "2026-09-01T00:00:00.000Z"
  };
}

test("note magnets can paste into a day Notes target", () => {
  const source = workspace([plan({ id: "note", title: "Prep copies", type: "note" })]);
  const clipboard = createClipboard(source, "note", "copy");
  assert.ok(clipboard);
  const target = { location: "calendar" as const, date: "2026-09-10", courseId: null };
  assert.equal(canPasteClipboardToTarget(clipboard, target), true);
  const pasted = pasteClipboard(source, clipboard, target);
  const copy = pasted.workspace.plans.find((item) => item.id === pasted.pastedRootId);
  assert.equal(copy?.type, "note");
  assert.equal(copy?.date, "2026-09-10");
  assert.equal(copy?.courseId, null);
});

test("note magnets cannot paste into a class calendar lane", () => {
  const source = workspace([plan({ id: "note", title: "Prep copies", type: "note" })]);
  const clipboard = createClipboard(source, "note", "copy");
  assert.ok(clipboard);
  const target = { location: "calendar" as const, date: "2026-09-10", courseId: "course-a" };
  assert.equal(canPasteClipboardToTarget(clipboard, target), false);
  const pasted = pasteClipboard(source, clipboard, target);
  assert.equal(pasted.pastedRootId, null);
  assert.equal(pasted.workspace.plans.length, 1);
});

test("Units and Lessons cannot paste into day Notes", () => {
  for (const type of ["unit", "lesson"] as const) {
    const source = workspace([plan({ id: type, title: type, type })]);
    const clipboard = createClipboard(source, type, "copy");
    assert.ok(clipboard);
    const target = { location: "calendar" as const, date: "2026-09-10", courseId: null };
    assert.equal(canPasteClipboardToTarget(clipboard, target), false);
    const pasted = pasteClipboard(source, clipboard, target);
    assert.equal(pasted.pastedRootId, null);
    assert.equal(pasted.workspace.plans.length, 1);
  }
});

test("Units and Lessons still paste into class calendar lanes", () => {
  for (const type of ["unit", "lesson"] as const) {
    const source = workspace([plan({ id: type, title: type, type })]);
    const clipboard = createClipboard(source, type, "copy");
    assert.ok(clipboard);
    const target = { location: "calendar" as const, date: "2026-09-10", courseId: "course-a" };
    assert.equal(canPasteClipboardToTarget(clipboard, target), true);
    const pasted = pasteClipboard(source, clipboard, target);
    assert.ok(pasted.pastedRootId);
    assert.equal(pasted.workspace.plans.length, 2);
  }
});
