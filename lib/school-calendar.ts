import type { SchoolCalendar } from "./domain";
import { formatDateKey, parseDateKey, shiftDateKey } from "./date-utils";

export const toDateKey = formatDateKey;
export const fromDateKey = parseDateKey;

export function isWeekend(dateKey: string): boolean {
  const day = fromDateKey(dateKey).getDay();
  return day === 0 || day === 6;
}

export function isNoSchoolDate(calendar: SchoolCalendar, dateKey: string): boolean {
  return calendar.noSchoolDates.some((entry) => entry.date === dateKey);
}

export function isInstructionalDay(calendar: SchoolCalendar, dateKey: string): boolean {
  return !isWeekend(dateKey) && !isNoSchoolDate(calendar, dateKey);
}

export function moveInstructionalDays(
  calendar: SchoolCalendar,
  startDate: string,
  delta: number
): string {
  if (delta === 0) return startDate;

  const direction = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  let cursor = startDate;

  while (remaining > 0) {
    cursor = shiftDateKey(cursor, direction)!;
    if (isInstructionalDay(calendar, cursor)) remaining -= 1;
  }

  return cursor;
}

export function instructionalSpan(
  calendar: SchoolCalendar,
  startDate: string,
  instructionalDays: number
): string[] {
  if (instructionalDays <= 0) return [];
  const result: string[] = [];
  let cursor = startDate;

  while (result.length < instructionalDays) {
    if (isInstructionalDay(calendar, cursor)) result.push(cursor);
    cursor = shiftDateKey(cursor, 1)!;
  }

  return result;
}
