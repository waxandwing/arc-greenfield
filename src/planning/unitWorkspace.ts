import type { SchoolCalendar } from '../calendar'
import { createUnit, placeUnit, validateUnit, validateUnitCourse, type Unit } from './units'
import type { PlanningWorkspace } from './workspace'

export type UnitWorkspace = {
  calendarId: string
  units: Unit[]
}

export type UnitWorkspaceInput = UnitWorkspace

export function hydrateUnitWorkspace(
  input: UnitWorkspaceInput,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
): UnitWorkspace {
  const workspace: UnitWorkspace = {
    calendarId: input.calendarId.trim(),
    units: input.units.map((unit) => {
      const base = createUnit({
        id: unit.id,
        calendarId: unit.calendarId,
        courseId: unit.courseId,
        title: unit.title,
      })
      return unit.placement ? placeUnit(base, calendar, unit.placement) : base
    }),
  }

  const errors = validateUnitWorkspace(workspace, calendar, planning)
  if (errors.length > 0) throw new Error(`Cannot use Units. ${errors.join(' ')}`)
  return workspace
}

export function validateUnitWorkspace(
  workspace: UnitWorkspace,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
): string[] {
  const errors: string[] = []
  if (workspace.calendarId !== calendar.id) errors.push('Unit workspace belongs to a different school calendar.')
  if (planning.calendarId !== calendar.id) errors.push('Class workspace belongs to a different school calendar.')

  const ids = new Set<string>()
  for (const unit of workspace.units) {
    errors.push(...validateUnit(unit))
    if (ids.has(unit.id)) errors.push(`Duplicate Unit ID: ${unit.id}.`)
    ids.add(unit.id)

    const course = planning.courses.find((candidate) => candidate.id === unit.courseId)
    if (!course) errors.push(`${unit.title || unit.id} references a Course that does not exist.`)
    else errors.push(...validateUnitCourse(unit, course))

    if (unit.calendarId !== calendar.id) errors.push(`${unit.title || unit.id} belongs to a different school calendar.`)
  }

  return [...new Set(errors)]
}

export function courseIdsProtectedByUnits(workspace: UnitWorkspace | null): Set<string> {
  return new Set(workspace?.units.map((unit) => unit.courseId) ?? [])
}
