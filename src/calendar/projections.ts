import { addCalendarDays, compareISODate, eachCalendarDay } from './dateMath'
import { findContainingBoundary, getCalendarDay } from './schoolCalendar'
import type { CalendarDay, ISODate, SchoolCalendar, TermBoundary } from './types'

export type ProjectedDay = CalendarDay & {
  inSchoolYear: boolean
  isWeekend: boolean
}

export type DayProjection = {
  kind: 'day'
  date: ISODate
  day: ProjectedDay
  quarter: TermBoundary | null
  semester: TermBoundary | null
}

export type WeekProjection = {
  kind: 'week'
  startDate: ISODate
  endDate: ISODate
  days: ProjectedDay[]
  quarters: TermBoundary[]
  semesters: TermBoundary[]
}

export type MonthWeek = {
  startDate: ISODate
  endDate: ISODate
  days: ProjectedDay[]
}

export type MonthProjection = {
  kind: 'month'
  monthKey: `${number}-${number}`
  gridStartDate: ISODate
  gridEndDate: ISODate
  weeks: MonthWeek[]
  quarters: TermBoundary[]
  semesters: TermBoundary[]
}

export type BoundaryProjection = {
  id: string
  label: string
  startDate: ISODate
  endDate: ISODate
  days: ProjectedDay[]
}

export type QuarterProjection = BoundaryProjection & { kind: 'quarter' }
export type SemesterProjection = BoundaryProjection & { kind: 'semester' }

export type YearMapProjection = {
  kind: 'year-map'
  startDate: ISODate
  endDate: ISODate
  days: ProjectedDay[]
  quarters: TermBoundary[]
  semesters: TermBoundary[]
}

export function projectDay(calendar: SchoolCalendar, date: ISODate): DayProjection {
  return {
    kind: 'day',
    date,
    day: projectCalendarDay(calendar, date),
    quarter: findContainingBoundary(calendar.quarters, date),
    semester: findContainingBoundary(calendar.semesters, date),
  }
}

export function projectWeek(calendar: SchoolCalendar, anchorDate: ISODate): WeekProjection {
  const startDate = startOfMondayWeek(anchorDate)
  const endDate = addCalendarDays(startDate, 6)
  return {
    kind: 'week',
    startDate,
    endDate,
    days: eachCalendarDay(startDate, endDate).map((date) => projectCalendarDay(calendar, date)),
    quarters: boundariesIntersectingRange(calendar.quarters, startDate, endDate),
    semesters: boundariesIntersectingRange(calendar.semesters, startDate, endDate),
  }
}

export function projectMonth(calendar: SchoolCalendar, anchorDate: ISODate): MonthProjection {
  const { year, month } = parseISODate(anchorDate)
  const first = formatISODate(year, month, 1)
  const last = lastDayOfMonth(year, month)
  const gridStartDate = startOfMondayWeek(first)
  const gridEndDate = endOfSundayWeek(last)
  const allDays = eachCalendarDay(gridStartDate, gridEndDate).map((date) => projectCalendarDay(calendar, date))
  const weeks: MonthWeek[] = []

  for (let i = 0; i < allDays.length; i += 7) {
    const days = allDays.slice(i, i + 7)
    weeks.push({
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      days,
    })
  }

  return {
    kind: 'month',
    monthKey: `${year}-${String(month).padStart(2, '0')}` as `${number}-${number}`,
    gridStartDate,
    gridEndDate,
    weeks,
    quarters: boundariesIntersectingRange(calendar.quarters, first, last),
    semesters: boundariesIntersectingRange(calendar.semesters, first, last),
  }
}

export function projectQuarter(calendar: SchoolCalendar, date: ISODate): QuarterProjection | null {
  const boundary = findContainingBoundary(calendar.quarters, date)
  return boundary ? projectBoundary(calendar, boundary, 'quarter') : null
}

export function projectSemester(calendar: SchoolCalendar, date: ISODate): SemesterProjection | null {
  const boundary = findContainingBoundary(calendar.semesters, date)
  return boundary ? projectBoundary(calendar, boundary, 'semester') : null
}

export function projectYearMap(calendar: SchoolCalendar): YearMapProjection {
  return {
    kind: 'year-map',
    startDate: calendar.firstDay,
    endDate: calendar.lastDay,
    days: eachCalendarDay(calendar.firstDay, calendar.lastDay).map((date) => projectCalendarDay(calendar, date)),
    quarters: [...calendar.quarters],
    semesters: [...calendar.semesters],
  }
}

function projectBoundary(calendar: SchoolCalendar, boundary: TermBoundary, kind: 'quarter'): QuarterProjection
function projectBoundary(calendar: SchoolCalendar, boundary: TermBoundary, kind: 'semester'): SemesterProjection
function projectBoundary(
  calendar: SchoolCalendar,
  boundary: TermBoundary,
  kind: 'quarter' | 'semester',
): QuarterProjection | SemesterProjection {
  const base = {
    id: boundary.id,
    label: boundary.label,
    startDate: boundary.startDate,
    endDate: boundary.endDate,
    days: eachCalendarDay(boundary.startDate, boundary.endDate).map((date) => projectCalendarDay(calendar, date)),
  }

  return kind === 'quarter' ? { kind, ...base } : { kind, ...base }
}

function projectCalendarDay(calendar: SchoolCalendar, date: ISODate): ProjectedDay {
  const day = getCalendarDay(calendar, date)
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return {
    ...day,
    inSchoolYear: compareISODate(date, calendar.firstDay) >= 0 && compareISODate(date, calendar.lastDay) <= 0,
    isWeekend: weekday === 0 || weekday === 6,
  }
}

function boundariesIntersectingRange(boundaries: TermBoundary[], startDate: ISODate, endDate: ISODate): TermBoundary[] {
  return boundaries.filter((boundary) =>
    compareISODate(boundary.endDate, startDate) >= 0 && compareISODate(boundary.startDate, endDate) <= 0,
  )
}

function startOfMondayWeek(date: ISODate): ISODate {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  const mondayIndex = weekday === 0 ? 6 : weekday - 1
  return addCalendarDays(date, -mondayIndex)
}

function endOfSundayWeek(date: ISODate): ISODate {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  const distance = weekday === 0 ? 0 : 7 - weekday
  return addCalendarDays(date, distance)
}

function parseISODate(date: ISODate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function formatISODate(year: number, month: number, day: number): ISODate {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as ISODate
}

function lastDayOfMonth(year: number, month: number): ISODate {
  const date = new Date(Date.UTC(year, month, 0))
  return formatISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}
