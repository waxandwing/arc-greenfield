import test from "node:test";
import assert from "node:assert/strict";
import type { SchoolCalendar } from "../lib/domain";
import { monthWeeks, quarterRange } from "../lib/view-ranges";

function weekday(date: Date) {
  return date.getDay();
}

test("Month weeks are always Monday through Friday", () => {
  // September 2026 begins on a Tuesday. The leading outside-month day
  // must be Monday Aug 31, never a trailing/random Monday on the right.
  const weeks = monthWeeks(new Date(2026, 8, 15, 12, 0, 0, 0));

  assert.ok(weeks.length > 0);
  for (const week of weeks) {
    assert.equal(week.days.length, 5);
    assert.equal(weekday(week.days[0].date), 1, `${week.key} should start Monday`);
    assert.equal(weekday(week.days[4].date), 5, `${week.key} should end Friday`);
  }

  assert.equal(weeks[0].days[0].key, "2026-08-31");
  assert.deepEqual(weeks[0].days.map((day) => weekday(day.date)), [1, 2, 3, 4, 5]);
});

test("Month weeks stay Monday-first when the month begins on Sunday", () => {
  // November 2026 begins on Sunday; Arc's teacher week still starts Monday.
  const weeks = monthWeeks(new Date(2026, 10, 1, 12, 0, 0, 0));

  assert.equal(weeks[0].days[0].key, "2026-10-26");
  assert.equal(weeks[0].days[4].key, "2026-10-30");
  assert.equal(weeks[1].days[0].key, "2026-11-02");
  assert.deepEqual(weeks[1].days.map((day) => weekday(day.date)), [1, 2, 3, 4, 5]);
});

test("Quarter ranges use the same Monday-first five-day week contract", () => {
  const calendar: SchoolCalendar = {
    firstStudentDay: "2026-08-10",
    lastStudentDay: "2027-05-28",
    quarterBoundaries: [
      { id: "q1", label: "Quarter 1", start: "2026-08-10", end: "2026-10-09" }
    ],
    noSchoolDates: [],
    weekendsVisible: false
  };

  const quarter = quarterRange(calendar, "q1");
  assert.ok(quarter);
  for (const week of quarter.weeks) {
    assert.equal(weekday(week.days[0].date), 1);
    assert.equal(weekday(week.days[4].date), 5);
    assert.deepEqual(week.days.map((day) => weekday(day.date)), [1, 2, 3, 4, 5]);
  }
});
