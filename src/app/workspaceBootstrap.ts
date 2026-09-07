import {
  loadCalendarFromBrowser,
} from '../calendar'
import {
  loadLessonsFromBrowser,
  loadPlanningWorkspaceFromBrowser,
  loadShiftStateFromBrowser,
  loadUnitsFromBrowser,
} from '../planning'

export function loadWorkspaceSnapshot() {
  const calendarLoad = loadCalendarFromBrowser()
  const restoredCalendar = calendarLoad.status === 'restored' ? calendarLoad.restored : null

  const planningLoad = restoredCalendar
    ? loadPlanningWorkspaceFromBrowser(restoredCalendar.calendar.id)
    : { status: 'empty' as const }
  const restoredPlanning = planningLoad.status === 'restored' ? planningLoad : null

  const unitLoad = restoredCalendar && restoredPlanning
    ? loadUnitsFromBrowser(restoredCalendar.calendar, restoredPlanning.workspace)
    : { status: 'empty' as const }
  const restoredUnits = unitLoad.status === 'restored' ? unitLoad : null

  const lessonLoad = restoredCalendar && restoredPlanning && restoredUnits
    ? loadLessonsFromBrowser(restoredCalendar.calendar, restoredPlanning.workspace, restoredUnits.workspace)
    : { status: 'empty' as const }
  const restoredLessons = lessonLoad.status === 'restored' ? lessonLoad : null

  const shiftLoad = restoredCalendar && restoredPlanning && restoredUnits && restoredLessons
    ? loadShiftStateFromBrowser(restoredCalendar.calendar, restoredPlanning.workspace, restoredUnits.workspace, restoredLessons.workspace)
    : { status: 'empty' as const }
  const restoredShift = shiftLoad.status === 'restored' ? shiftLoad : null

  return {
    calendarLoad,
    planningLoad,
    unitLoad,
    lessonLoad,
    shiftLoad,
    restoredCalendar,
    restoredPlanning,
    restoredUnits,
    restoredLessons,
    restoredShift,
    storageNotice: initialStorageNotice({
      calendarLoad,
      planningLoad,
      unitLoad,
      lessonLoad,
      shiftLoad,
      undoStatus: restoredShift?.undoStatus,
    }),
  }
}

type LoadStatus = { status: string }

type InitialStorageNoticeInput = {
  calendarLoad: LoadStatus
  planningLoad: LoadStatus
  unitLoad: LoadStatus
  lessonLoad: LoadStatus
  shiftLoad: LoadStatus
  undoStatus?: 'none' | 'restored' | 'discarded'
}

function initialStorageNotice(input: InitialStorageNoticeInput): string | null {
  const { calendarLoad, planningLoad, unitLoad, lessonLoad, shiftLoad, undoStatus } = input

  if (calendarLoad.status === 'invalid') return 'Arc found saved calendar data it could not verify. Nothing was restored; please confirm the calendar again.'
  if (calendarLoad.status === 'unavailable') return 'Calendar storage is unavailable in this browser. Changes may last only for this session.'
  if (planningLoad.status === 'invalid') return 'Arc found saved class data it could not verify. The calendar is safe; please confirm the classes again.'
  if (planningLoad.status === 'unavailable') return 'Class storage is unavailable in this browser. Class changes may last only for this session.'
  if (unitLoad.status === 'invalid') return 'Arc found saved Unit data it could not verify. Your calendar and classes are safe; please confirm the Units again.'
  if (unitLoad.status === 'unavailable') return 'Unit storage is unavailable in this browser. Unit changes may last only for this session.'
  if (lessonLoad.status === 'invalid') return 'Arc found saved Lesson progress it could not verify. Calendar, Classes, and Units are safe; please confirm the Lessons again.'
  if (lessonLoad.status === 'unavailable') return 'Lesson storage is unavailable in this browser. Lesson progress may last only for this session.'
  if (shiftLoad.status === 'invalid') return 'Arc found saved Section schedule changes it could not verify. Earlier planning data is safe; the Section schedule was not restored.'
  if (shiftLoad.status === 'unavailable') return 'Section schedule storage is unavailable in this browser. Shift changes may last only for this session.'
  if (undoStatus === 'discarded') return 'Arc restored the Section schedule, but its previous Undo was no longer safe and was discarded.'
  return null
}
