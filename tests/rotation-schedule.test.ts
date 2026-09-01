import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { courseMeetsOnDate, nextCourseMeetingDate, previewInstructionalShift, rotationLabelForDate } from "../lib/efficiency-operations";

function rotatingWorkspace() {
  const workspace = emptyWorkspace();
  workspace.calendar.rotation = { anchorDate: "2026-09-07", labels: ["A", "B"] };
  workspace.courses = [
    { id: "course-a", name: "Ceramics A", periodLabel: "1", color: "#eeb834", meetingPattern: { kind: "rotation", labels: ["A"] } },
    { id: "course-b", name: "Ceramics B", periodLabel: "2", color: "#aac7d0", meetingPattern: { kind: "rotation", labels: ["B"] } }
  ];
  return workspace;
}

function lesson(id: string, courseId: string, date: string): Plan {
  return {
    id,
    type: "lesson",
    title: id,
    courseId,
    date,
    endDate: null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {}
  };
}

test("anchored A B rotation derives labels from instructional days", () => {
  const workspace = rotatingWorkspace();
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-07"), "A");
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-08"), "B");
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-09"), "A");
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-04"), "B");
});

test("rotation skips weekends and no-school days without consuming a cycle label", () => {
  const workspace = rotatingWorkspace();
  workspace.calendar.noSchoolDates = [{ id: "off", date: "2026-09-08", label: "No school" }];
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-09"), "B");
  assert.equal(rotationLabelForDate(workspace.calendar, "2026-09-10"), "A");
});

test("courses can meet on different labels in the same anchored rotation", () => {
  const workspace = rotatingWorkspace();
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-07"), true);
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-08"), false);
  assert.equal(courseMeetsOnDate(workspace, "course-b", "2026-09-07"), false);
  assert.equal(courseMeetsOnDate(workspace, "course-b", "2026-09-08"), true);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-07"), "2026-09-09");
  assert.equal(nextCourseMeetingDate(workspace, "course-b", "2026-09-07"), "2026-09-08");
});

test("Shift collision preflight uses the next matching rotation label", () => {
  const workspace = rotatingWorkspace();
  workspace.plans = [
    lesson("moving", "course-a", "2026-09-07"),
    { ...lesson("occupied", "course-a", "2026-09-09"), parentUnitId: "older-unit", childOrder: 0 },
    {
      id: "older-unit",
      type: "unit",
      title: "Existing unit",
      courseId: "course-a",
      date: "2026-09-01",
      endDate: "2026-09-11",
      location: "calendar",
      parentUnitId: null,
      childOrder: null,
      fixedDate: false,
      continuationOfId: null,
      notes: "",
      resources: [],
      details: {}
    }
  ];
  const preview = previewInstructionalShift(workspace, ["course-a"], "2026-09-07");
  assert.deepEqual(preview.blockedRootIds, ["moving"]);
  assert.equal(preview.conflicts[0]?.targetDate, "2026-09-09");
  assert.equal(preview.conflicts[0]?.conflictingPlanId, "occupied");
});

test("rotation pattern without a valid calendar anchor fails safely to ordinary instructional days", () => {
  const workspace = rotatingWorkspace();
  workspace.calendar.rotation = null;
  assert.equal(courseMeetsOnDate(workspace, "course-a", "2026-09-08"), true);
  assert.equal(nextCourseMeetingDate(workspace, "course-a", "2026-09-07"), "2026-09-08");
});
