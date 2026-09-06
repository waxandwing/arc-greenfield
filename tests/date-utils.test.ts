import test from "node:test";
import assert from "node:assert/strict";
import {
  addCalendarDays,
  calendarDayDelta,
  formatDateKey,
  mondayFor,
  parseDateKey,
  shiftDateKey
} from "../lib/date-utils";

test("date keys round-trip without UTC conversion", () => {
  const date = parseDateKey("2026-09-06");
  assert.equal(date.getHours(), 12);
  assert.equal(formatDateKey(date), "2026-09-06");
});

test("calendar day shifts and deltas preserve local calendar intent", () => {
  assert.equal(shiftDateKey("2026-09-04", 3), "2026-09-07");
  assert.equal(calendarDayDelta("2026-09-04", "2026-09-07"), 3);
});

test("Monday projection is Monday-first including Sunday anchors", () => {
  const sunday = parseDateKey("2026-09-06");
  assert.equal(formatDateKey(mondayFor(sunday)), "2026-08-31");
  assert.equal(formatDateKey(addCalendarDays(mondayFor(sunday), 4)), "2026-09-04");
});
