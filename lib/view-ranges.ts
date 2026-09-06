import type { SchoolCalendar } from "./domain";
import { addCalendarDays, formatDateKey, fridayFor, mondayFor, parseDateKey } from "./date-utils";

export type CalendarDay = {
  key: string;
  date: Date;
  inPrimaryMonth: boolean;
};

export type CalendarWeek = {
  key: string;
  days: CalendarDay[];
};

export type QuarterRange = {
  id: string;
  label: string;
  start: string;
  end: string;
  weeks: CalendarWeek[];
};

function schoolWeek(startMonday: Date, primaryMonth?: number): CalendarWeek {
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = addCalendarDays(startMonday, index);
    return {
      key: formatDateKey(date),
      date,
      inPrimaryMonth: primaryMonth === undefined || date.getMonth() === primaryMonth
    };
  });
  return { key: days[0].key, days };
}

export function monthWeeks(anchor: Date): CalendarWeek[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const last = new Date(year, month + 1, 0, 12, 0, 0, 0);
  let cursor = mondayFor(first);
  const end = fridayFor(last);
  const weeks: CalendarWeek[] = [];

  while (cursor <= end) {
    weeks.push(schoolWeek(cursor, month));
    cursor = addCalendarDays(cursor, 7);
  }
  return weeks;
}

export function quarterRange(calendar: SchoolCalendar, quarterId: string): QuarterRange | null {
  const boundary = calendar.quarterBoundaries.find((quarter) => quarter.id === quarterId);
  if (!boundary?.start || !boundary?.end) return null;

  const startDate = parseDateKey(boundary.start);
  const endDate = parseDateKey(boundary.end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return null;

  let cursor = mondayFor(startDate);
  const end = fridayFor(endDate);
  const weeks: CalendarWeek[] = [];
  while (cursor <= end) {
    weeks.push(schoolWeek(cursor));
    cursor = addCalendarDays(cursor, 7);
  }

  return { ...boundary, weeks };
}

export function availableQuarterRanges(calendar: SchoolCalendar): QuarterRange[] {
  return calendar.quarterBoundaries
    .map((quarter) => quarterRange(calendar, quarter.id))
    .filter((quarter): quarter is QuarterRange => Boolean(quarter));
}
