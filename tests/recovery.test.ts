import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan, type Workspace } from "../lib/domain";
import { applyRecoveryPreview, nextInstructionalDate, previewDisruption } from "../lib/recovery";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-04",
    endDate: type === "unit" ? "2026-09-11" : null,
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

function workspace(plans: Plan[], noSchoolDates: Workspace["calendar"]["noSchoolDates"] = []): Workspace {
  const base = emptyWorkspace();
  return {
    ...base,
    teacherName: "Kelly",
    courses: [{ id: "course-a", name: "AP Art History", periodLabel: "2", color: "#c96b43" }],
    calendar: {
      ...base.calendar,
      firstStudentDay: "2026-08-10",
      lastStudentDay: "2027-05-28",
      noSchoolDates
    },
    plans
  };
}

test("recovery skips weekends and no-school dates", () => {
  const current = workspace([], [{ id: "holiday", date: "2026-09-07", label: "No school" }]);
  assert.equal(nextInstructionalDate(current, "2026-09-04"), "2026-09-08");
});

test("fixed plans are never assigned a recovery destination", () => {
  const current = workspace([
    plan({ id: "movable", title: "Discussion", type: "lesson" }),
    plan({ id: "fixed", title: "District assessment", type: "lesson", fixedDate: true })
  ]);
  const preview = previewDisruption(current, "2026-09-04");
  assert.equal(preview.movableCount, 1);
  assert.equal(preview.fixedCount, 1);
  assert.equal(preview.impacts.find((item) => item.planId === "fixed")?.toDate, null);
});

test("destination collisions are surfaced before mutation", () => {
  const current = workspace([
    plan({ id: "moving", title: "Visual analysis", type: "lesson" }),
    plan({ id: "existing", title: "Quiz", type: "lesson", date: "2026-09-07" })
  ]);
  const preview = previewDisruption(current, "2026-09-04");
  assert.equal(preview.collisionCount, 1);
  assert.deepEqual(preview.impacts.find((item) => item.planId === "moving")?.collisionTitles, ["Quiz"]);
});

test("preview does not mutate workspace", () => {
  const current = workspace([plan({ id: "moving", title: "Visual analysis", type: "lesson" })]);
  const before = JSON.stringify(current);
  previewDisruption(current, "2026-09-04");
  assert.equal(JSON.stringify(current), before);
});

test("confirmed recovery moves plans without deleting anything", () => {
  const current = workspace([
    plan({ id: "unit", title: "Egypt", type: "unit", endDate: "2026-09-11" }),
    plan({ id: "fixed", title: "Performance", type: "lesson", fixedDate: true })
  ]);
  const preview = previewDisruption(current, "2026-09-04");
  const next = applyRecoveryPreview(current, preview);
  assert.equal(next.plans.length, current.plans.length);
  assert.equal(next.plans.find((item) => item.id === "unit")?.date, "2026-09-07");
  assert.equal(next.plans.find((item) => item.id === "unit")?.endDate, "2026-09-14");
  assert.equal(next.plans.find((item) => item.id === "fixed")?.date, "2026-09-04");
});

test("recovery metadata records where a moved plan came from", () => {
  const current = workspace([plan({ id: "moving", title: "Visual analysis", type: "lesson" })]);
  const preview = previewDisruption(current, "2026-09-04");
  const next = applyRecoveryPreview(current, preview);
  const moved = next.plans.find((item) => item.id === "moving");
  assert.equal(moved?.details.lastRecoveryFrom, "2026-09-04");
  assert.equal(moved?.details.lastRecoveryTo, "2026-09-07");
});
