import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../lib/domain";
import { quarterForDate, yearMonths } from "../lib/view-ranges";

test("Year Map renders each school-year month once even when a quarter changes mid-month", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.firstStudentDay = "2026-08-10";
  workspace.calendar.lastStudentDay = "2027-05-28";
  workspace.calendar.quarterBoundaries = [
    { id: "q1", label: "Quarter 1", start: "2026-08-10", end: "2026-10-15" },
    { id: "q2", label: "Quarter 2", start: "2026-10-16", end: "2026-12-18" },
    { id: "q3", label: "Quarter 3", start: "2027-01-04", end: "2027-03-12" },
    { id: "q4", label: "Quarter 4", start: "2027-03-15", end: "2027-05-28" }
  ];

  const months = yearMonths(workspace.calendar);
  assert.deepEqual(months.map((month) => month.key), [
    "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    "2027-01", "2027-02", "2027-03", "2027-04", "2027-05"
  ]);
  assert.deepEqual(months.find((month) => month.key === "2026-10")?.quarterIds, ["q1", "q2"]);
  assert.deepEqual(months.find((month) => month.key === "2027-03")?.quarterIds, ["q3", "q4"]);
});

test("quarterForDate uses real configured boundary dates", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.firstStudentDay = "2026-08-10";
  workspace.calendar.lastStudentDay = "2026-12-18";
  workspace.calendar.quarterBoundaries = [
    { id: "q1", label: "Quarter 1", start: "2026-08-10", end: "2026-10-15" },
    { id: "q2", label: "Quarter 2", start: "2026-10-16", end: "2026-12-18" }
  ];
  assert.equal(quarterForDate(workspace.calendar, "2026-10-15"), "q1");
  assert.equal(quarterForDate(workspace.calendar, "2026-10-16"), "q2");
  assert.equal(quarterForDate(workspace.calendar, "2026-08-01"), null);
});
