import type { SchoolCalendar } from '../calendar'
import {
  applyShiftOperation,
  undoShiftOperation,
  validateShiftPersistenceInput,
  type LessonWorkspace,
  type PlanningWorkspace,
  type ShiftOperation,
  type ShiftPersistenceInput,
  type UnitWorkspace,
} from '../planning'

export type CommandFailure = {
  ok: false
  message: string
}

export type CommandSuccess<T> = {
  ok: true
  value: T
}

export type CommandResult<T> = CommandSuccess<T> | CommandFailure

type ShiftCommandContext = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  shift: ShiftPersistenceInput
}

export type PreparedShift = {
  shift: ShiftPersistenceInput
  sectionName: string
}

export function prepareRecoveryShift(
  context: ShiftCommandContext,
  operation: ShiftOperation,
): CommandResult<PreparedShift> {
  const { calendar, planning, units, lessons, shift } = context
  const section = planning.sections.find((candidate) => candidate.id === operation.sectionId)
  if (!section) return fail('Arc cannot apply this Shift because the class no longer exists. Nothing changed.')

  try {
    const applied = applyShiftOperation({
      operation,
      section,
      lessons: lessons.lessons,
      deliveryStates: lessons.deliveryStates,
      units: units.units,
      calendar,
      overrides: shift.overrides,
    })
    const candidate: ShiftPersistenceInput = {
      calendarId: calendar.id,
      overrides: applied.overrides,
      undo: applied.undo,
    }
    const validation = validateShiftPersistenceInput(candidate, calendar, planning, units, lessons)
    if (validation.scheduleErrors.length > 0 || !validation.undoValid) {
      return fail('Arc refused this Shift because the resulting Section schedule did not pass its integrity check. Nothing changed.')
    }
    return success({ shift: candidate, sectionName: section.name })
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error))
  }
}

export function prepareUndoShift(context: ShiftCommandContext): CommandResult<PreparedShift> {
  const { calendar, planning, units, lessons, shift } = context
  if (!shift.undo) return fail('Arc has no Shift available to undo.')

  const section = planning.sections.find((candidate) => candidate.id === shift.undo?.sectionId)
  try {
    const overrides = undoShiftOperation(shift.overrides, shift.undo)
    const candidate: ShiftPersistenceInput = { calendarId: calendar.id, overrides, undo: null }
    const validation = validateShiftPersistenceInput(candidate, calendar, planning, units, lessons)
    if (validation.scheduleErrors.length > 0) {
      return fail('Arc could not safely undo that Shift because the previous Section schedule is no longer valid. Nothing changed.')
    }
    return success({ shift: candidate, sectionName: section?.name ?? '' })
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error))
  }
}

function success<T>(value: T): CommandSuccess<T> {
  return { ok: true, value }
}

function fail(message: string): CommandFailure {
  return { ok: false, message }
}
