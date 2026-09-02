import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../lib/domain";
import { monthWeeks, quarterRange } from "../lib/view-ranges";

test("Month defaults to five-day teacher weeks", () => {
  const weeks = monthWeeks(new Date(2026, 8, 1, 12), false);
  assert.ok(weeks.length > 0);
  assert.ok(weeks.every((week) => week.days.length === 5));
  assert.deepEqual(weeks[0].days.map((day) => day.date.getDay()), [1, 2, 3, 4, 5]);
});

test("Month includes Saturday and Sunday only when opted in", () => {
  const weeks = monthWeeks(new Date(2026, 8, 1, 12), true);
  assert.ok(weeks.length > 0);
  assert.ok(weeks.every((week) => week.days.length === 7));
  assert.deepEqual(weeks[0].days.map((day) => day.date.getDay()), [1, 2, 3, 4, 5, 6, 0]);
});

test("Quarter uses the same weekend visibility rule as Month and Week", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.quarterBoundaries = [{ id: "q1", label: "Quarter 1", start: "2026-08-10", end: "2026-10-09" }];

  workspace.calendar.weekendsVisible = false;
  const workweek = quarterRange(workspace.calendar, "q1");
  assert.ok(workweek);
  assert.ok(workweek.weeks.every((week) => week.days.length === 5));

  workspace.calendar.weekendsVisible = true;
  const fullweek = quarterRange(workspace.calendar, "q1");
  assert.ok(fullweek);
  assert.ok(fullweek.weeks.every((week) => week.days.length === 7));
});
