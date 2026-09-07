import { addCalendarDays, compareISODate } from './dateMath'
import type { ISODate, SchoolCalendar, TermBoundary } from './types'
import type { CalendarView } from '../navigation/calendarViews'

export type PeriodDirection = 'previous' | 'next'

export function moveAnchor(calendar: SchoolCalendar, view: CalendarView, anchor: ISODate, direction: PeriodDirection): ISODate | null {
  switch (view) {
    case 'Day':
      return clampToSchoolYear(calendar, addCalendarDays(anchor, direction === 'next' ? 1 : -1))
    case 'Week':
      return clampToSchoolYear(calendar, addCalendarDays(anchor, direction === 'next' ? 7 : -7))
    case 'Month':
      return clampToSchoolYear(calendar, addMonthsUTC(anchor, direction === 'next' ? 1 : -1))
    case 'Quarter':
      return adjacentBoundaryAnchor(calendar.quarters, anchor, direction)
    case 'Semester':
      return adjacentBoundaryAnchor(calendar.semesters, anchor, direction)
    case 'Year Map':
      return null
  }
}

export function canMoveAnchor(calendar: SchoolCalendar, view: CalendarView, anchor: ISODate, direction: PeriodDirection): boolean {
  return moveAnchor(calendar, view, anchor, direction) !== null
}

export function todayAnchor(calendar: SchoolCalendar, today: ISODate): ISODate | null {
  return compareISODate(today, calendar.firstDay) >= 0 && compareISODate(today, calendar.lastDay) <= 0 ? today : null
}

export function currentLocalISODate(now = new Date()): ISODate {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` as ISODate
}

function adjacentBoundaryAnchor(boundaries: TermBoundary[], anchor: ISODate, direction: PeriodDirection): ISODate | null {
  if (boundaries.length === 0) return null
  const sorted = [...boundaries].sort((a, b) => compareISODate(a.startDate, b.startDate))
  const containingIndex = sorted.findIndex((boundary) => compareISODate(anchor, boundary.startDate) >= 0 && compareISODate(anchor, boundary.endDate) <= 0)

  if (containingIndex >= 0) {
    const targetIndex = containingIndex + (direction === 'next' ? 1 : -1)
    return sorted[targetIndex]?.startDate ?? null
  }

  if (direction === 'next') {
    return sorted.find((boundary) => compareISODate(boundary.startDate, anchor) > 0)?.startDate ?? null
  }

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (compareISODate(sorted[index].endDate, anchor) < 0) return sorted[index].startDate
  }
  return null
}

function clampToSchoolYear(calendar: SchoolCalendar, candidate: ISODate): ISODate | null {
  if (compareISODate(candidate, calendar.firstDay) < 0 || compareISODate(candidate, calendar.lastDay) > 0) return null
  return candidate
}

function addMonthsUTC(date: ISODate, months: number): ISODate {
  const [year, month, day] = date.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const targetYear = target.getUTCFullYear()
  const targetMonth = target.getUTCMonth()
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const safeDay = Math.min(day, lastDay)
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}` as ISODate
}
