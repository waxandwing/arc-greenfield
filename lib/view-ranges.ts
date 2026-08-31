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

function fridayFor(date: Date) {
  const monday = mondayFor(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

function schoolWeek(startMonday: Date, primaryMonth?: number): CalendarWeek {
  const days = Array.from({ length: 5 }, (_, index) => {
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
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 7);
    cursor = next;
  }
  return weeks;
}

export function quarterRange(calendar: SchoolCalendar, quarterId: string): QuarterRange | null {
  const boundary = calendar.quarterBoundaries.find((quarter) => quarter.id === quarterId);
  if (!boundary?.start || !boundary?.end) return null;

  let cursor = mondayFor(parseDate(boundary.start));
  const end = fridayFor(parseDate(boundary.end));
  const weeks: CalendarWeek[] = [];
  while (cursor <= end) {
    weeks.push(schoolWeek(cursor));
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
