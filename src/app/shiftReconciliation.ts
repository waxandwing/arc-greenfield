import type { SchoolCalendar } from '../calendar'
import {
  validateShiftPersistenceInput,
  type LessonWorkspace,
  type PlanningWorkspace,
  type ShiftPersistenceInput,
  type UnitWorkspace,
} from '../planning'

export type ReconciledShift = {
  allowed: boolean
  next: ShiftPersistenceInput | null
  undoDropped: boolean
}

export function reconcileShiftState(
  shiftState: ShiftPersistenceInput | null,
  nextCalendar: SchoolCalendar,
  nextPlanning: PlanningWorkspace | null,
  nextUnits: UnitWorkspace | null,
  nextLessons: LessonWorkspace | null,
): ReconciledShift {
  if (!shiftState) {
    return {
      allowed: true,
      next: { calendarId: nextCalendar.id, overrides: [], sameDayApprovals: [], undo: null },
      undoDropped: false,
    }
  }

  if (!nextPlanning || !nextUnits || !nextLessons) {
    if (shiftState.overrides.length > 0 || shiftState.sameDayApprovals.length > 0) {
      return { allowed: false, next: shiftState, undoDropped: false }
    }
    return {
      allowed: true,
      next: { calendarId: nextCalendar.id, overrides: [], sameDayApprovals: [], undo: null },
      undoDropped: Boolean(shiftState.undo),
    }
  }

  const candidate: ShiftPersistenceInput = { ...shiftState, calendarId: nextCalendar.id }
  const validation = validateShiftPersistenceInput(candidate, nextCalendar, nextPlanning, nextUnits, nextLessons)

  if (validation.scheduleErrors.length > 0) {
    return { allowed: false, next: shiftState, undoDropped: false }
  }

  if (!validation.undoValid && candidate.undo) {
    return { allowed: true, next: { ...candidate, undo: null }, undoDropped: true }
  }

  return { allowed: true, next: candidate, undoDropped: false }
}
