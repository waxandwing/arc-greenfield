const DAY_MS = 86_400_000;

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function shiftDateKey(value: string | null, days: number): string | null {
  if (!value) return null;
  return formatDateKey(addCalendarDays(parseDateKey(value), days));
}

export function calendarDayDelta(from: string, to: string): number {
  return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / DAY_MS);
}

export function mondayFor(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + delta);
  next.setHours(12, 0, 0, 0);
  return next;
}

export function fridayFor(date: Date): Date {
  return addCalendarDays(mondayFor(date), 4);
}
