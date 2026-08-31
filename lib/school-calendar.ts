import type { SchoolCalendar } from "./domain";

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`);
}

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
  const cursor = fromDateKey(startDate);

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + direction);
    const candidate = toDateKey(cursor);
    if (isInstructionalDay(calendar, candidate)) remaining -= 1;
  }

  return toDateKey(cursor);
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
    cursor = moveCalendarDay(cursor, 1);
  }

  return result;
}

function moveCalendarDay(dateKey: string, delta: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}
