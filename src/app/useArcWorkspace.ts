import { useState } from 'react'
import {
  compareISODate,
  currentLocalISODate,
  findContainingBoundary,
  hydrateSchoolCalendar,
  moveAnchor,
  saveCalendarToBrowser,
  todayAnchor,
  type CalendarHydrationInput,
  type ISODate,
  type PeriodDirection,
  type SchoolCalendar,
} from '../calendar'
import { DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import {
  applyShiftOperation,
  courseIdsProtectedByUnits,
  saveLessonAndShiftStateToBrowser,
  savePlanningWorkspaceToBrowser,
  saveShiftStateToBrowser,
  saveUnitsToBrowser,
  sectionIdsProtectedByDelivery,
  undoShiftOperation,
  unitIdsProtectedByLessons,
  validateLessonWorkspace,
  validateShiftPersistenceInput,
  validateUnitWorkspace,
  type LessonWorkspace,
  type LessonWorkspaceInput,
  type PlanningWorkspace,
  type PlanningWorkspaceInput,
  type ShiftOperation,
  type ShiftPersistenceInput,
  type UnitWorkspace,
  type UnitWorkspaceInput,
} from '../planning'
import { reconcileShiftState } from './shiftReconciliation'
import { loadWorkspaceSnapshot } from './workspaceBootstrap'

type ViewAvailability = { available: boolean; reason?: string }

export function useArcWorkspace(onCloseMode: () => void) {
  const [snapshot] = useState(loadWorkspaceSnapshot)
  const {
    restoredCalendar,
    restoredPlanning,
    restoredUnits,
    restoredLessons,
    restoredShift,
  } = snapshot

  const [activeView, setActiveView] = useState<CalendarView>(DEFAULT_HOME_VIEW)
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(restoredCalendar?.calendar ?? null)
  const [calendarInput, setCalendarInput] = useState<CalendarHydrationInput | null>(restoredCalendar?.input ?? null)
  const [anchorDate, setAnchorDate] = useState<ISODate | null>(restoredCalendar?.calendar.firstDay ?? null)
  const [planningWorkspace, setPlanningWorkspace] = useState<PlanningWorkspace | null>(restoredPlanning?.workspace ?? null)
  const [planningInput, setPlanningInput] = useState<PlanningWorkspaceInput | null>(restoredPlanning?.input ?? null)
  const [unitWorkspace, setUnitWorkspace] = useState<UnitWorkspace | null>(restoredUnits?.workspace ?? null)
  const [unitInput, setUnitInput] = useState<UnitWorkspaceInput | null>(restoredUnits?.input ?? null)
  const [lessonWorkspace, setLessonWorkspace] = useState<LessonWorkspace | null>(restoredLessons?.workspace ?? null)
  const [lessonInput, setLessonInput] = useState<LessonWorkspaceInput | null>(restoredLessons?.input ?? null)
  const [shiftState, setShiftState] = useState<ShiftPersistenceInput | null>(
    restoredShift?.input
      ?? (restoredCalendar ? { calendarId: restoredCalendar.calendar.id, overrides: [], undo: null } : null),
  )
  const [storageNotice, setStorageNotice] = useState<string | null>(snapshot.storageNotice)

  function persistReconciledShift(next: ShiftPersistenceInput | null): boolean {
    if (!next) return true
    setShiftState(next)
    return saveShiftStateToBrowser(next)
  }

  function useCalendar(nextCalendar: SchoolCalendar, input: CalendarHydrationInput) {
    if (unitWorkspace && planningWorkspace) {
      const unitErrors = validateUnitWorkspace(unitWorkspace, nextCalendar, planningWorkspace)
      if (unitErrors.length > 0) {
        setStorageNotice('That calendar change would make one or more existing Units invalid. Adjust or remove those Unit placements first; Arc has not changed the calendar.')
        return
      }
      if (lessonWorkspace) {
        const lessonErrors = validateLessonWorkspace(lessonWorkspace, nextCalendar, planningWorkspace, unitWorkspace)
        if (lessonErrors.length > 0) {
          setStorageNotice('That calendar change would invalidate an existing Lesson plan or recorded class progress. Resolve those Lesson dates first; Arc has not changed the calendar.')
          return
        }
      }
    }

    const shift = reconcileShiftState(shiftState, nextCalendar, planningWorkspace, unitWorkspace, lessonWorkspace)
    if (!shift.allowed) {
      setStorageNotice('That calendar change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the calendar.')
      return
    }

    const nextAnchor = anchorDate
      && compareISODate(anchorDate, nextCalendar.firstDay) >= 0
      && compareISODate(anchorDate, nextCalendar.lastDay) <= 0
      ? anchorDate
      : nextCalendar.firstDay
    let nextView = activeView
    if (nextView === 'Quarter' && !findContainingBoundary(nextCalendar.quarters, nextAnchor)) nextView = DEFAULT_HOME_VIEW
    if (nextView === 'Semester' && !findContainingBoundary(nextCalendar.semesters, nextAnchor)) nextView = DEFAULT_HOME_VIEW

    const calendarPersisted = saveCalendarToBrowser(input)
    const shiftPersisted = persistReconciledShift(shift.next)
    setCalendar(nextCalendar)
    setCalendarInput(input)
    setAnchorDate(nextAnchor)
    setActiveView(nextView)
    onCloseMode()
    if (!calendarPersisted || !shiftPersisted) setStorageNotice('This change is active for this session, but Arc could not save all related planning state in this browser.')
    else if (shift.undoDropped) setStorageNotice('Calendar updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
    else setStorageNotice(null)
  }

  function useTerms(input: CalendarHydrationInput) {
    const nextCalendar = hydrateSchoolCalendar(input)
    const shift = reconcileShiftState(shiftState, nextCalendar, planningWorkspace, unitWorkspace, lessonWorkspace)
    if (!shift.allowed) {
      setStorageNotice('Those term changes would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the terms.')
      return
    }

    const calendarPersisted = saveCalendarToBrowser(input)
    const shiftPersisted = persistReconciledShift(shift.next)
    setCalendar(nextCalendar)
    setCalendarInput(input)
    onCloseMode()
    if (anchorDate) {
      const quarterStillContainsAnchor = findContainingBoundary(nextCalendar.quarters, anchorDate)
      const semesterStillContainsAnchor = findContainingBoundary(nextCalendar.semesters, anchorDate)
      if (activeView === 'Quarter' && !quarterStillContainsAnchor) setActiveView(DEFAULT_HOME_VIEW)
      if (activeView === 'Semester' && !semesterStillContainsAnchor) setActiveView(DEFAULT_HOME_VIEW)
    }
    if (!calendarPersisted || !shiftPersisted) setStorageNotice('These term dates are active for this session, but Arc could not save all related planning state in this browser.')
    else if (shift.undoDropped) setStorageNotice('Terms updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
    else setStorageNotice(null)
  }

  function useClasses(input: PlanningWorkspaceInput, workspace: PlanningWorkspace) {
    if (calendar && unitWorkspace && lessonWorkspace) {
      const lessonErrors = validateLessonWorkspace(lessonWorkspace, calendar, workspace, unitWorkspace)
      if (lessonErrors.length > 0) {
        setStorageNotice('That class change would orphan existing Lesson progress. Resolve the affected Lesson history first; Arc has not changed the classes.')
        return
      }
      const shift = reconcileShiftState(shiftState, calendar, workspace, unitWorkspace, lessonWorkspace)
      if (!shift.allowed) {
        setStorageNotice('That class change would orphan an existing Section schedule. Resolve the affected Shift history first; Arc has not changed the classes.')
        return
      }
      const classesPersisted = savePlanningWorkspaceToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setPlanningWorkspace(workspace)
      setPlanningInput(input)
      onCloseMode()
      if (!classesPersisted || !shiftPersisted) setStorageNotice('These classes are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Classes updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = savePlanningWorkspaceToBrowser(input)
    setPlanningWorkspace(workspace)
    setPlanningInput(input)
    onCloseMode()
    setStorageNotice(persisted ? null : 'These classes are active for this session, but Arc could not save them in this browser.')
  }

  function useUnits(input: UnitWorkspaceInput, workspace: UnitWorkspace) {
    if (calendar && planningWorkspace && lessonWorkspace) {
      const lessonErrors = validateLessonWorkspace(lessonWorkspace, calendar, planningWorkspace, workspace)
      if (lessonErrors.length > 0) {
        setStorageNotice('That Unit change would invalidate one or more Lessons. Move or update those Lessons first; Arc has not changed the Units.')
        return
      }
      const shift = reconcileShiftState(shiftState, calendar, planningWorkspace, workspace, lessonWorkspace)
      if (!shift.allowed) {
        setStorageNotice('That Unit change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the Units.')
        return
      }
      const unitsPersisted = saveUnitsToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setUnitWorkspace(workspace)
      setUnitInput(input)
      onCloseMode()
      if (!unitsPersisted || !shiftPersisted) setStorageNotice('These Units are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Units updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = saveUnitsToBrowser(input)
    setUnitWorkspace(workspace)
    setUnitInput(input)
    onCloseMode()
    setStorageNotice(persisted ? null : 'These Units are active for this session, but Arc could not save them in this browser.')
  }

  function useLessons(input: LessonWorkspaceInput, workspace: LessonWorkspace, requestedShiftState: ShiftPersistenceInput) {
    if (!calendar || !planningWorkspace || !unitWorkspace) {
      setStorageNotice('Arc cannot save these Lessons because the planning context is incomplete. Nothing changed.')
      return
    }

    let candidateShift: ShiftPersistenceInput = {
      calendarId: calendar.id,
      overrides: requestedShiftState.overrides.map((override) => ({ ...override })),
      undo: requestedShiftState.undo,
    }
    let validation = validateShiftPersistenceInput(candidateShift, calendar, planningWorkspace, unitWorkspace, workspace)
    if (validation.scheduleErrors.length > 0) {
      setStorageNotice('That Lesson change would invalidate an existing Section schedule. Resolve the affected Section dates first; Arc has not changed the Lessons.')
      return
    }

    let undoDropped = false
    if (!validation.undoValid) {
      candidateShift = { ...candidateShift, undo: null }
      undoDropped = true
      validation = validateShiftPersistenceInput(candidateShift, calendar, planningWorkspace, unitWorkspace, workspace)
      if (validation.scheduleErrors.length > 0) {
        setStorageNotice('Arc refused this Lesson change because the resulting Section schedule did not pass its integrity check. Nothing changed.')
        return
      }
    }

    const persisted = saveLessonAndShiftStateToBrowser(input, candidateShift)
    if (!persisted.saved) {
      setStorageNotice(persisted.rollbackSucceeded
        ? 'Arc could not save the Lesson and Section schedule together, so it restored the previous browser state. Nothing changed.'
        : 'Arc could not save the Lesson and Section schedule together, and browser storage also refused a complete rollback. Do not continue editing in this tab until the stored workspace is checked.')
      return
    }

    setLessonWorkspace(workspace)
    setLessonInput(input)
    setShiftState(candidateShift)
    onCloseMode()
    setStorageNotice(undoDropped
      ? 'Lessons updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.'
      : null)
  }

  function applyRecoveryShift(operation: ShiftOperation): string | null {
    if (!calendar || !planningWorkspace || !unitWorkspace || !lessonWorkspace || !shiftState) {
      return 'Arc cannot apply this Shift because the planning state is incomplete. Nothing changed.'
    }
    const section = planningWorkspace.sections.find((candidate) => candidate.id === operation.sectionId)
    if (!section) return 'Arc cannot apply this Shift because the class no longer exists. Nothing changed.'

    try {
      const applied = applyShiftOperation({
        operation,
        section,
        lessons: lessonWorkspace.lessons,
        deliveryStates: lessonWorkspace.deliveryStates,
        units: unitWorkspace.units,
        calendar,
        overrides: shiftState.overrides,
      })
      const candidate: ShiftPersistenceInput = { calendarId: calendar.id, overrides: applied.overrides, undo: applied.undo }
      const validation = validateShiftPersistenceInput(candidate, calendar, planningWorkspace, unitWorkspace, lessonWorkspace)
      if (validation.scheduleErrors.length > 0 || !validation.undoValid) {
        return 'Arc refused this Shift because the resulting Section schedule did not pass its integrity check. Nothing changed.'
      }

      const persisted = saveShiftStateToBrowser(candidate)
      setShiftState(candidate)
      setStorageNotice(persisted
        ? `Shift applied to ${section.name}. Undo is available.`
        : `Shift applied to ${section.name} for this session, but Arc could not save the Section schedule in this browser.`)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function undoLastShift() {
    if (!calendar || !planningWorkspace || !unitWorkspace || !lessonWorkspace || !shiftState?.undo) return
    const section = planningWorkspace.sections.find((candidate) => candidate.id === shiftState.undo?.sectionId)
    try {
      const overrides = undoShiftOperation(shiftState.overrides, shiftState.undo)
      const candidate: ShiftPersistenceInput = { calendarId: calendar.id, overrides, undo: null }
      const validation = validateShiftPersistenceInput(candidate, calendar, planningWorkspace, unitWorkspace, lessonWorkspace)
      if (validation.scheduleErrors.length > 0) {
        setStorageNotice('Arc could not safely undo that Shift because the previous Section schedule is no longer valid. Nothing changed.')
        return
      }
      const persisted = saveShiftStateToBrowser(candidate)
      setShiftState(candidate)
      setStorageNotice(persisted
        ? `Undid the last Shift${section ? ` for ${section.name}` : ''}.`
        : `Undid the last Shift${section ? ` for ${section.name}` : ''} for this session, but Arc could not save the restored Section schedule.`)
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : String(error))
    }
  }

  function movePeriod(direction: PeriodDirection) {
    if (!calendar || !anchorDate) return
    const next = moveAnchor(calendar, activeView, anchorDate, direction)
    if (next) setAnchorDate(next)
  }

  function goToday() {
    if (!calendar) return
    const today = todayAnchor(calendar, currentLocalISODate())
    if (today) setAnchorDate(today)
  }

  function viewAvailability(view: CalendarView): ViewAvailability {
    if (!calendar) return { available: false, reason: 'Set up the school calendar first.' }
    if (view === 'Quarter' && calendar.quarters.length === 0) return { available: false, reason: 'Quarter dates are not configured yet.' }
    if (view === 'Semester' && calendar.semesters.length === 0) return { available: false, reason: 'Semester dates are not configured yet.' }
    return { available: true }
  }

  const previousTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'previous') : null
  const nextTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'next') : null
  const todayTarget = calendar ? todayAnchor(calendar, currentLocalISODate()) : null
  const hasTerms = Boolean(calendar && (calendar.quarters.length > 0 || calendar.semesters.length > 0))
  const hasClasses = Boolean(planningWorkspace && planningWorkspace.courses.length > 0)
  const hasUnits = Boolean(unitWorkspace && unitWorkspace.units.length > 0)
  const hasLessons = Boolean(lessonWorkspace && lessonWorkspace.lessons.length > 0)
  const recoveryCount = lessonWorkspace?.deliveryStates.filter((state) => state.status === 'in-progress').length ?? 0

  return {
    activeView,
    setActiveView,
    calendar,
    calendarInput,
    anchorDate,
    planningWorkspace,
    planningInput,
    unitWorkspace,
    unitInput,
    lessonWorkspace,
    lessonInput,
    shiftState,
    storageNotice,
    previousTarget,
    nextTarget,
    todayTarget,
    hasTerms,
    hasClasses,
    hasUnits,
    hasLessons,
    recoveryCount,
    protectedCourseIds: courseIdsProtectedByUnits(unitWorkspace),
    protectedUnitIds: unitIdsProtectedByLessons(lessonWorkspace),
    protectedSectionIds: sectionIdsProtectedByDelivery(lessonWorkspace),
    viewAvailability,
    useCalendar,
    useTerms,
    useClasses,
    useUnits,
    useLessons,
    applyRecoveryShift,
    undoLastShift,
    movePeriod,
    goToday,
  }
}
