import { addCalendarDays, compareISODate, eachCalendarDay } from './dateMath'
import type { CalendarDay, ISODate, SchoolCalendar, TermBoundary } from './types'

export function getCalendarDay(calendar: SchoolCalendar, date: ISODate): CalendarDay {
  const explicit = calendar.days[date]
  if (explicit) return explicit

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  const isWeekend = weekday === 0 || weekday === 6

  return {
    date,
    kind: isWeekend ? 'no-school' : 'instructional',
  }
}

export function isInstructionalDay(calendar: SchoolCalendar, date: ISODate): boolean {
  if (compareISODate(date, calendar.firstDay) < 0 || compareISODate(date, calendar.lastDay) > 0) return false
  return getCalendarDay(calendar, date).kind === 'instructional'
}

export function nextInstructionalDay(calendar: SchoolCalendar, from: ISODate): ISODate | null {
  for (let cursor = addCalendarDays(from, 1); compareISODate(cursor, calendar.lastDay) <= 0; cursor = addCalendarDays(cursor, 1)) {
    if (isInstructionalDay(calendar, cursor)) return cursor
  }
  return null
}

export function previousInstructionalDay(calendar: SchoolCalendar, from: ISODate): ISODate | null {
  for (let cursor = addCalendarDays(from, -1); compareISODate(cursor, calendar.firstDay) >= 0; cursor = addCalendarDays(cursor, -1)) {
    if (isInstructionalDay(calendar, cursor)) return cursor
  }
  return null
}

export function instructionalDaysBetween(calendar: SchoolCalendar, start: ISODate, end: ISODate): ISODate[] {
  return eachCalendarDay(start, end).filter((date) => isInstructionalDay(calendar, date))
}

export function findContainingBoundary(boundaries: TermBoundary[], date: ISODate): TermBoundary | null {
  return boundaries.find((boundary) => compareISODate(date, boundary.startDate) >= 0 && compareISODate(date, boundary.endDate) <= 0) ?? null
}

export function validateSchoolCalendar(calendar: SchoolCalendar): string[] {
  const errors: string[] = []

  if (compareISODate(calendar.firstDay, calendar.lastDay) > 0) errors.push('School year begins after it ends.')

  for (const [date, day] of Object.entries(calendar.days)) {
    if (date !== day.date) errors.push(`Calendar day key ${date} does not match record date ${day.date}.`)
    if (compareISODate(day.date, calendar.firstDay) < 0 || compareISODate(day.date, calendar.lastDay) > 0) {
      errors.push(`Calendar day ${day.date} falls outside the school-year bounds.`)
    }
  }

  for (const boundary of [...calendar.quarters, ...calendar.semesters]) {
    if (compareISODate(boundary.startDate, boundary.endDate) > 0) errors.push(`${boundary.label} begins after it ends.`)
    if (compareISODate(boundary.startDate, calendar.firstDay) < 0 || compareISODate(boundary.endDate, calendar.lastDay) > 0) {
      errors.push(`${boundary.label} falls outside the school-year bounds.`)
    }
  }

  return errors
}
