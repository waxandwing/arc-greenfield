import type { SchoolCalendar } from "./domain";

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

export type YearMonth = {
  key: string;
  date: Date;
  quarterIds: string[];
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function mondayFor(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + delta);
  next.setHours(12, 0, 0, 0);
  return next;
}

function weekEndFor(date: Date, weekendsVisible: boolean) {
  const monday = mondayFor(date);
  const end = new Date(monday);
  end.setDate(monday.getDate() + (weekendsVisible ? 6 : 4));
  return end;
}

function calendarWeek(startMonday: Date, primaryMonth?: number, weekendsVisible = false): CalendarWeek {
  const days = Array.from({ length: weekendsVisible ? 7 : 5 }, (_, index) => {
    const date = new Date(startMonday);
    date.setDate(startMonday.getDate() + index);
    return {
      key: dateKey(date),
      date,
      inPrimaryMonth: primaryMonth === undefined ? true : date.getMonth() === primaryMonth
    };
  });
  return { key: days[0].key, days };
}

export function monthWeeks(anchor: Date, weekendsVisible = false): CalendarWeek[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const last = new Date(year, month + 1, 0, 12, 0, 0, 0);
  let cursor = mondayFor(first);
  const end = weekEndFor(last, weekendsVisible);
  const weeks: CalendarWeek[] = [];

  while (cursor <= end) {
    weeks.push(calendarWeek(cursor, month, weekendsVisible));
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 7);
    cursor = next;
  }
  return weeks;
}

export function quarterRange(calendar: SchoolCalendar, quarterId: string): QuarterRange | null {
  const boundary = calendar.quarterBoundaries.find((quarter) => quarter.id === quarterId);
  if (!boundary?.start || !boundary?.end) return null;

  const startDate = parseDate(boundary.start);
  const endDate = parseDate(boundary.end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return null;

  let cursor = mondayFor(startDate);
  const end = weekEndFor(endDate, calendar.weekendsVisible);
  const weeks: CalendarWeek[] = [];
  while (cursor <= end) {
    weeks.push(calendarWeek(cursor, undefined, calendar.weekendsVisible));
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 7);
    cursor = next;
  }

  return { ...boundary, weeks };
}

export function availableQuarterRanges(calendar: SchoolCalendar): QuarterRange[] {
  return calendar.quarterBoundaries
    .map((quarter) => quarterRange(calendar, quarter.id))
    .filter((quarter): quarter is QuarterRange => Boolean(quarter));
}

/**
 * Returns every school-year month exactly once. A month that crosses a quarter
 * boundary carries both quarter IDs so the Year Map can show the transition
 * without rendering a duplicate mini-month.
 */
export function yearMonths(calendar: SchoolCalendar): YearMonth[] {
  if (!calendar.firstStudentDay || !calendar.lastStudentDay || calendar.firstStudentDay > calendar.lastStudentDay) return [];
  const ranges = availableQuarterRanges(calendar);
  const cursor = parseDate(`${calendar.firstStudentDay.slice(0, 7)}-01`);
  const last = parseDate(`${calendar.lastStudentDay.slice(0, 7)}-01`);
  const months: YearMonth[] = [];

  while (cursor <= last && months.length < 18) {
    const key = dateKey(cursor).slice(0, 7);
    const monthStart = `${key}-01`;
    const monthEndDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12, 0, 0, 0);
    const monthEnd = dateKey(monthEndDate);
    const quarterIds = ranges
      .filter((range) => range.start <= monthEnd && range.end >= monthStart)
      .map((range) => range.id);
    months.push({ key, date: new Date(cursor), quarterIds });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function quarterForDate(calendar: SchoolCalendar, value: string): string | null {
  return availableQuarterRanges(calendar).find((range) => range.start <= value && range.end >= value)?.id ?? null;
}
