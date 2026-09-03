import { assertISODate, compareISODate } from '../calendar/dateMath'
import { assessCalendarReadiness } from '../calendar/readiness'
import { instructionalDaysBetween } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'

export type UnitId = string
export type CourseId = string

export type UnitPlacement = {
  startDate: ISODate
  endDate: ISODate
}

export type Unit = {
  id: UnitId
  calendarId: string
  courseId: CourseId
  title: string
  placement: UnitPlacement | null
}

export type UnitPlacementSummary = {
  startDate: ISODate
  endDate: ISODate
  instructionalDates: ISODate[]
  quarterIds: string[]
  semesterIds: string[]
}

export function createUnitId(): UnitId {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `unit-${token}`
}

export function createUnit(input: {
  calendarId: string
  courseId: CourseId
  title: string
  id?: UnitId
}): Unit {
  const unit: Unit = {
    id: input.id ?? createUnitId(),
    calendarId: input.calendarId,
    courseId: input.courseId,
    title: input.title.trim(),
    placement: null,
  }
  const errors = validateUnit(unit)
  if (errors.length > 0) throw new Error(`Cannot create unit. ${errors.join(' ')}`)
  return unit
}

export function validateUnit(unit: Unit): string[] {
  const errors: string[] = []
  if (!unit.id.trim()) errors.push('Unit ID is required.')
  if (!unit.calendarId.trim()) errors.push('Unit calendar ID is required.')
  if (!unit.courseId.trim()) errors.push('Unit course ID is required.')
  if (!unit.title.trim()) errors.push('Unit title is required.')

  if (unit.placement) {
    try { assertISODate(unit.placement.startDate) } catch (error) { errors.push(messageOf(error)) }
    try { assertISODate(unit.placement.endDate) } catch (error) { errors.push(messageOf(error)) }
    if (errors.length === 0 && compareISODate(unit.placement.startDate, unit.placement.endDate) > 0) {
      errors.push('Unit placement begins after it ends.')
    }
  }

  return errors
}

export function placeUnit(
  unit: Unit,
  calendar: SchoolCalendar,
  placement: UnitPlacement,
): Unit {
  const errors = validateUnitPlacement(unit, calendar, placement)
  if (errors.length > 0) throw new Error(`Cannot place unit. ${errors.join(' ')}`)
  return {
    ...unit,
    placement: { ...placement },
  }
}

export function unplaceUnit(unit: Unit): Unit {
  return { ...unit, placement: null }
}

export function validateUnitPlacement(
  unit: Unit,
  calendar: SchoolCalendar,
  placement: UnitPlacement,
): string[] {
  const errors = validateUnit({ ...unit, placement })
  if (unit.calendarId !== calendar.id) errors.push('Unit belongs to a different school calendar.')

  const readiness = assessCalendarReadiness(calendar)
  if (!readiness.ready) errors.push('School calendar is not ready for structural planning.')

  if (errors.length === 0) {
    if (compareISODate(placement.startDate, calendar.firstDay) < 0 || compareISODate(placement.endDate, calendar.lastDay) > 0) {
      errors.push('Unit placement falls outside the school-year bounds.')
    } else if (instructionalDaysBetween(calendar, placement.startDate, placement.endDate).length === 0) {
      errors.push('Unit placement must contain at least one confirmed instructional day.')
    }
  }

  return errors
}

export function summarizeUnitPlacement(unit: Unit, calendar: SchoolCalendar): UnitPlacementSummary | null {
  if (!unit.placement) return null
  const errors = validateUnitPlacement(unit, calendar, unit.placement)
  if (errors.length > 0) throw new Error(`Cannot summarize unit placement. ${errors.join(' ')}`)

  const { startDate, endDate } = unit.placement
  return {
    startDate,
    endDate,
    instructionalDates: instructionalDaysBetween(calendar, startDate, endDate),
    quarterIds: intersectingBoundaryIds(calendar.quarters, startDate, endDate),
    semesterIds: intersectingBoundaryIds(calendar.semesters, startDate, endDate),
  }
}

function intersectingBoundaryIds(
  boundaries: SchoolCalendar['quarters'],
  startDate: ISODate,
  endDate: ISODate,
): string[] {
  return boundaries
    .filter((boundary) => compareISODate(boundary.endDate, startDate) >= 0 && compareISODate(boundary.startDate, endDate) <= 0)
    .map((boundary) => boundary.id)
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
