import { useState } from 'react'
import {
  compareISODate,
  currentLocalISODate,
  findContainingBoundary,
  hydrateSchoolCalendar,
  moveAnchor,
  createPlanNavigationContext,
  savePlanNavigationContext,
  saveCalendarToBrowser,
  todayAnchor,
  type CalendarHydrationInput,
  type ISODate,
  type PeriodDirection,
  type PlanNavigationContext,
  type SchoolCalendar,
} from '../calendar'
import { DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import {
  applyShiftOperation,
  createPlanningCapture,
  createPlanningNote,
  promoteCaptureToLesson,
  courseIdsProtectedByUnits,
  saveLessonAndShiftStateToBrowser,
  saveCapturesToBrowser,
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
  type CaptureWorkspace,
  type CurriculumImportProposal,
  type CurriculumImportReceipt,
  commitCurriculumImport,
  focusLesson,
  focusTeachingBlock,
  goPlanHome,
  prepareCurriculumCommit,
  resolvePlanContext,
  retreatPlanFocus,
  type ReimportDecision,
  type TeachingDayRailItem,
} from '../planning'
import { reconcileShiftState } from './shiftReconciliation'
import { loadWorkspaceSnapshot } from './workspaceBootstrap'

type ViewAvailability = { available: boolean; reason?: string }

export function useArcWorkspace(onCloseMode: () => void) {
  const [snapshot] = useState(loadWorkspaceSnapshot)
  const {
    restoredCalendar,
    restoredPlan,
    restoredAnchor,
    restoredPlanning,
    restoredUnits,
    restoredLessons,
    restoredShift,
    restoredCaptures,
  } = snapshot

  const initialPlan = initialPlanContext({
    calendar: restoredCalendar?.calendar ?? null,
    restoredPlan,
    restoredAnchor,
    planning: restoredPlanning?.workspace ?? null,
    units: restoredUnits?.workspace ?? null,
    lessons: restoredLessons?.workspace ?? null,
    overrides: restoredShift?.input?.overrides ?? [],
  })
  const [planContext, setPlanContext] = useState<PlanNavigationContext | null>(initialPlan.context)
  const [viewWasPersisted] = useState(initialPlan.viewWasPersisted)
  const [activeView, setActiveViewState] = useState<CalendarView>(initialPlan.context?.view ?? DEFAULT_HOME_VIEW)
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(restoredCalendar?.calendar ?? null)
  const [calendarInput, setCalendarInput] = useState<CalendarHydrationInput | null>(restoredCalendar?.input ?? null)
  const [anchorDate, setAnchorDate] = useState<ISODate | null>(initialPlan.context?.anchorDate ?? restoredAnchor ?? restoredCalendar?.calendar.firstDay ?? null)
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
  const [captureWorkspace, setCaptureWorkspace] = useState<CaptureWorkspace | null>(
    restoredCaptures ?? (restoredCalendar ? { calendarId: restoredCalendar.calendar.id, captures: [] } : null),
  )
  const [storageNotice, setStorageNotice] = useState<string | null>(snapshot.storageNotice)

  function persistReconciledShift(next: ShiftPersistenceInput | null): boolean {
    if (!next) return true
    setShiftState(next)
    return saveShiftStateToBrowser(next)
  }

  function authorityFor(overrides?: {
    calendar?: SchoolCalendar | null
    planning?: PlanningWorkspace | null
    units?: UnitWorkspace | null
    lessons?: LessonWorkspace | null
    shift?: ShiftPersistenceInput | null
  }) {
    const nextCalendar = overrides?.calendar ?? calendar
    if (!nextCalendar) return null
    return {
      calendar: nextCalendar,
      planning: overrides?.planning ?? planningWorkspace,
      units: overrides?.units ?? unitWorkspace,
      lessons: overrides?.lessons ?? lessonWorkspace,
      overrides: (overrides?.shift ?? shiftState)?.overrides ?? [],
    }
  }

  function commitPlan(draft: PlanNavigationContext | null, overrides?: Parameters<typeof authorityFor>[0]) {
    const authority = authorityFor(overrides)
    if (!authority || !draft) {
      setPlanContext(null)
      return
    }
    const resolved = resolvePlanContext(draft, authority)
    setPlanContext(resolved)
    setActiveViewState(resolved.view)
    setAnchorDate(resolved.anchorDate)
    savePlanNavigationContext(resolved)
  }

  function setActiveView(view: CalendarView) {
    if (!calendar) {
      setActiveViewState(view)
      return
    }
    const current = planContext ?? createPlanNavigationContext({
      calendarId: calendar.id,
      anchorDate: anchorDate ?? calendar.firstDay,
      view,
    })
    const leavingDay = current.view === 'Day' && view !== 'Day'
    commitPlan(leavingDay
      ? createPlanNavigationContext({ calendarId: calendar.id, anchorDate: current.anchorDate, view, focus: 'day' })
      : { ...current, view })
  }

  function useCalendar(nextCalendar: SchoolCalendar, input: CalendarHydrationInput) {
    if (unitWorkspace && planningWorkspace) {
      const unitErrors = validateUnitWorkspace(unitWorkspace, nextCalendar, planningWorkspace)
      if (unitErrors.length > 0) {
        setStorageNotice('That calendar change would make one or more existing Units invalid. Adjust or remove those Unit placements first; Arc has not changed the calendar.')
        return false
      }
      if (lessonWorkspace) {
        const lessonErrors = validateLessonWorkspace(lessonWorkspace, nextCalendar, planningWorkspace, unitWorkspace)
        if (lessonErrors.length > 0) {
          setStorageNotice('That calendar change would invalidate an existing Lesson plan or recorded class progress. Resolve those Lesson dates first; Arc has not changed the calendar.')
          return false
        }
      }
    }

    const shift = reconcileShiftState(shiftState, nextCalendar, planningWorkspace, unitWorkspace, lessonWorkspace)
    if (!shift.allowed) {
      setStorageNotice('That calendar change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the calendar.')
      return false
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
    if (captureWorkspace?.calendarId !== nextCalendar.id) {
      const emptyCaptures = { calendarId: nextCalendar.id, captures: [] }
      setCaptureWorkspace(emptyCaptures)
      saveCapturesToBrowser(emptyCaptures)
    }
    setCalendarInput(input)
    commitPlan(createPlanNavigationContext({
      calendarId: nextCalendar.id,
      anchorDate: nextAnchor,
      view: nextView,
      focus: nextCalendar.id === planContext?.calendarId ? planContext.focus : 'day',
      courseId: nextCalendar.id === planContext?.calendarId ? planContext.courseId : undefined,
      sectionId: nextCalendar.id === planContext?.calendarId ? planContext.sectionId : undefined,
      unitId: nextCalendar.id === planContext?.calendarId ? planContext.unitId : undefined,
      lessonId: nextCalendar.id === planContext?.calendarId ? planContext.lessonId : undefined,
      teachingBlockId: nextCalendar.id === planContext?.calendarId ? planContext.teachingBlockId : undefined,
    }), { calendar: nextCalendar, shift: shift.next })
    onCloseMode()
    if (!calendarPersisted || !shiftPersisted) setStorageNotice('This change is active for this session, but Arc could not save all related planning state in this browser.')
    else if (shift.undoDropped) setStorageNotice('Calendar updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
    else setStorageNotice(null)
    return true
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
    commitPlan((planContext && planContext.calendarId === nextCalendar.id
      ? { ...planContext, view: activeView === 'Quarter' && !findContainingBoundary(nextCalendar.quarters, planContext.anchorDate) ? DEFAULT_HOME_VIEW : activeView === 'Semester' && !findContainingBoundary(nextCalendar.semesters, planContext.anchorDate) ? DEFAULT_HOME_VIEW : activeView }
      : createPlanNavigationContext({ calendarId: nextCalendar.id, anchorDate: nextCalendar.firstDay, view: DEFAULT_HOME_VIEW })), { calendar: nextCalendar, shift: shift.next })
    onCloseMode()
    if (!calendarPersisted || !shiftPersisted) setStorageNotice('These term dates are active for this session, but Arc could not save all related planning state in this browser.')
    else if (shift.undoDropped) setStorageNotice('Terms updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
    else setStorageNotice(null)
  }

  function useClasses(input: PlanningWorkspaceInput, workspace: PlanningWorkspace) {
    if (calendar && unitWorkspace && lessonWorkspace) {
      const lessonErrors = validateLessonWorkspace(lessonWorkspace, calendar, workspace, unitWorkspace)
      if (lessonErrors.length > 0) {
        setStorageNotice('That class change would orphan existing Lesson progress. Resolve the affected Lesson history first; Arc has not changed the classes.')
        return false
      }
      const shift = reconcileShiftState(shiftState, calendar, workspace, unitWorkspace, lessonWorkspace)
      if (!shift.allowed) {
        setStorageNotice('That class change would orphan an existing Section schedule. Resolve the affected Shift history first; Arc has not changed the classes.')
        return false
      }
      const classesPersisted = savePlanningWorkspaceToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setPlanningWorkspace(workspace)
      setPlanningInput(input)
      onCloseMode()
      commitPlan(planContext ?? createPlanNavigationContext({
        calendarId: calendar.id,
        anchorDate: anchorDate ?? calendar.firstDay,
        view: activeView,
      }), { planning: workspace, shift: shift.next })
      if (!classesPersisted || !shiftPersisted) setStorageNotice('These classes are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Classes updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return true
    }
    const persisted = savePlanningWorkspaceToBrowser(input)
    setPlanningWorkspace(workspace)
    setPlanningInput(input)
    onCloseMode()
    if (calendar) {
      commitPlan(planContext ?? createPlanNavigationContext({
        calendarId: calendar.id,
        anchorDate: anchorDate ?? calendar.firstDay,
        view: activeView,
      }), { planning: workspace })
    }
    setStorageNotice(persisted ? null : 'These classes are active for this session, but Arc could not save them in this browser.')
    return true
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
      commitPlan(planContext ?? createPlanNavigationContext({
        calendarId: calendar.id,
        anchorDate: anchorDate ?? calendar.firstDay,
        view: activeView,
      }), { units: workspace, shift: shift.next })
      if (!unitsPersisted || !shiftPersisted) setStorageNotice('These Units are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Units updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = saveUnitsToBrowser(input)
    setUnitWorkspace(workspace)
    setUnitInput(input)
    onCloseMode()
    if (calendar) {
      commitPlan(planContext ?? createPlanNavigationContext({
        calendarId: calendar.id,
        anchorDate: anchorDate ?? calendar.firstDay,
        view: activeView,
      }), { units: workspace })
    }
    setStorageNotice(persisted ? null : 'These Units are active for this session, but Arc could not save them in this browser.')
  }

  function useLessons(input: LessonWorkspaceInput, workspace: LessonWorkspace, requestedShiftState: ShiftPersistenceInput): boolean {
    if (!calendar || !planningWorkspace || !unitWorkspace) {
      setStorageNotice('Arc cannot save these Lessons because the planning context is incomplete. Nothing changed.')
      return false
    }

    let candidateShift: ShiftPersistenceInput = {
      calendarId: calendar.id,
      overrides: requestedShiftState.overrides.map((override) => ({ ...override })),
      undo: requestedShiftState.undo,
    }
    let validation = validateShiftPersistenceInput(candidateShift, calendar, planningWorkspace, unitWorkspace, workspace)
    if (validation.scheduleErrors.length > 0) {
      setStorageNotice('That Lesson change would invalidate an existing Section schedule. Resolve the affected Section dates first; Arc has not changed the Lessons.')
      return false
    }

    let undoDropped = false
    if (!validation.undoValid) {
      candidateShift = { ...candidateShift, undo: null }
      undoDropped = true
      validation = validateShiftPersistenceInput(candidateShift, calendar, planningWorkspace, unitWorkspace, workspace)
      if (validation.scheduleErrors.length > 0) {
        setStorageNotice('Arc refused this Lesson change because the resulting Section schedule did not pass its integrity check. Nothing changed.')
        return false
      }
    }

    const persisted = saveLessonAndShiftStateToBrowser(input, candidateShift)
    if (!persisted.saved) {
      setStorageNotice(persisted.rollbackSucceeded
        ? 'Arc could not save the Lesson and Section schedule together, so it restored the previous browser state. Nothing changed.'
        : 'Arc could not save the Lesson and Section schedule together, and browser storage also refused a complete rollback. Do not continue editing in this tab until the stored workspace is checked.')
      return false
    }

    setLessonWorkspace(workspace)
    setLessonInput(input)
    setShiftState(candidateShift)
    onCloseMode()
    commitPlan(planContext ?? createPlanNavigationContext({
      calendarId: calendar.id,
      anchorDate: anchorDate ?? calendar.firstDay,
      view: activeView,
    }), { lessons: workspace, shift: candidateShift })
    setStorageNotice(undoDropped
      ? 'Lessons updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.'
      : null)
    return true
  }

  function saveCaptureWorkspace(next: CaptureWorkspace): boolean {
    const persisted = saveCapturesToBrowser(next)
    setCaptureWorkspace(next)
    setStorageNotice(persisted ? null : 'This Workspace change is active for this session, but Arc could not save it in this browser.')
    return persisted
  }

  function useCurriculumImport(proposal: CurriculumImportProposal, courseMatches: Record<string, string>, decisions: Record<string, ReimportDecision>): CurriculumImportReceipt | string {
    if (!calendar) return 'Set up the school year before importing curriculum.'
    try {
      const prepared = prepareCurriculumCommit({
        proposal,
        calendar,
        planning: planningWorkspace ?? { calendarId: calendar.id, courses: [], sections: [], notes: [] },
        units: unitWorkspace ?? { calendarId: calendar.id, units: [] },
        lessons: lessonWorkspace ?? { calendarId: calendar.id, lessons: [], deliveryStates: [] },
        courseMatches,
        decisions,
      })
      const result = commitCurriculumImport(prepared)
      if (!result.saved) return result.rollbackSucceeded
        ? 'Arc could not save the complete import, so it restored the previous planning truth. Nothing changed.'
        : 'Browser storage refused the import and a complete rollback. Stop editing in this tab until storage is checked.'
      setPlanningWorkspace(prepared.planning)
      setPlanningInput(prepared.planning)
      setUnitWorkspace(prepared.units)
      setUnitInput(prepared.units)
      setLessonWorkspace(prepared.lessons)
      setLessonInput(prepared.lessons)
      setStorageNotice(null)
      commitPlan(planContext ?? createPlanNavigationContext({
        calendarId: calendar.id,
        anchorDate: anchorDate ?? calendar.firstDay,
        view: activeView,
      }), { planning: prepared.planning, units: prepared.units, lessons: prepared.lessons })
      return prepared.receipt
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function addCapture(text: string): string | null {
    if (!calendar) return null
    try {
      const current = captureWorkspace?.calendarId === calendar.id ? captureWorkspace : { calendarId: calendar.id, captures: [] }
      const capture = createPlanningCapture(calendar.id, text)
      saveCaptureWorkspace({ ...current, captures: [...current.captures, capture] })
      return capture.id
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : String(error))
      return null
    }
  }

  function removeCapture(captureId: string): boolean {
    if (!captureWorkspace) return false
    return saveCaptureWorkspace({ ...captureWorkspace, captures: captureWorkspace.captures.filter((capture) => capture.id !== captureId) })
  }

  function promoteCapture(captureId: string, unitId: string, plannedDate: ISODate | null): boolean {
    if (!captureWorkspace || !unitWorkspace || !shiftState || !calendar || !planningWorkspace) {
      setStorageNotice('Create a Course and Unit before turning this Capture into a Lesson. The Capture is still safe in Workspace.')
      return false
    }
    const capture = captureWorkspace.captures.find((candidate) => candidate.id === captureId)
    if (!capture) return false
    try {
      const previousLessons = lessonWorkspace ?? { calendarId: calendar.id, lessons: [], deliveryStates: [] }
      const promoted = promoteCaptureToLesson({ capture, captures: captureWorkspace, lessons: previousLessons, units: unitWorkspace, unitId, plannedDate })
      const lessonSaved = useLessons(promoted.lessons, promoted.lessons, shiftState)
      if (!lessonSaved) return false
      if (!saveCapturesToBrowser(promoted.captures)) {
        useLessons(previousLessons, previousLessons, shiftState)
        setStorageNotice('Arc could not save the Capture conversion atomically, so the original Capture was preserved. Nothing changed.')
        return false
      }
      setCaptureWorkspace(promoted.captures)
      setStorageNotice(plannedDate
        ? 'Capture placed as a Lesson. Its identity and text were preserved.'
        : 'Capture organized as an unscheduled Lesson. Its identity and text were preserved.')
      return true
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : String(error))
      return false
    }
  }

  function addCalendarNote(date: ISODate, text: string): boolean {
    if (!calendar) return false
    const current = planningWorkspace ?? { calendarId: calendar.id, courses: [], sections: [], notes: [] }
    try {
      const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const note = createPlanningNote({ id: `note-${token}`, calendarId: calendar.id, date, text, placement: 'calendar', important: false, sourceLabel: null, sourceLocator: null })
      const next = { ...current, notes: [...(current.notes ?? []), note] }
      useClasses(next, next)
      return true
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : String(error))
      return false
    }
  }

  function deleteCalendarNote(noteId: string) {
    if (!planningWorkspace) return
    const next = { ...planningWorkspace, notes: (planningWorkspace.notes ?? []).filter((note) => note.id !== noteId) }
    useClasses(next, next)
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
    if (!next) return
    commitPlan({
      ...(planContext ?? createPlanNavigationContext({ calendarId: calendar.id, anchorDate: next, view: activeView })),
      anchorDate: next,
    })
  }

  function goToday() {
    if (!calendar) return
    const today = todayAnchor(calendar, currentLocalISODate())
    if (!today) return
    commitPlan({
      ...(planContext ?? createPlanNavigationContext({ calendarId: calendar.id, anchorDate: today, view: activeView })),
      anchorDate: today,
    })
  }

  function selectDate(date: ISODate) {
    if (!calendar || compareISODate(date, calendar.firstDay) < 0 || compareISODate(date, calendar.lastDay) > 0) return
    commitPlan({
      ...(planContext ?? createPlanNavigationContext({ calendarId: calendar.id, anchorDate: date, view: activeView })),
      anchorDate: date,
    })
  }

  function selectTeachingBlock(block: TeachingDayRailItem) {
    if (!calendar || !planContext) return
    commitPlan(focusTeachingBlock(planContext, { id: block.id, courseId: block.courseId, sectionId: block.sectionId }))
  }

  function selectLesson(lesson: { lessonId: string; unitId: string; courseId: string }) {
    if (!calendar || !planContext) return
    commitPlan(focusLesson(planContext, lesson))
  }

  function retreatFocus() {
    if (!calendar || !planContext) return
    commitPlan(retreatPlanFocus(planContext))
  }

  function goHome() {
    if (!calendar) return
    const current = planContext ?? createPlanNavigationContext({
      calendarId: calendar.id,
      anchorDate: anchorDate ?? calendar.firstDay,
      view: activeView,
    })
    commitPlan(goPlanHome(current))
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
    planContext,
    viewWasPersisted,
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
    captureWorkspace,
    storageNotice,
    setStorageNotice,
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
    addCapture,
    removeCapture,
    promoteCapture,
    useCurriculumImport,
    addCalendarNote,
    deleteCalendarNote,
    applyRecoveryShift,
    undoLastShift,
    movePeriod,
    goToday,
    selectDate,
    selectTeachingBlock,
    selectLesson,
    retreatFocus,
    goHome,
  }
}

function initialPlanContext(input: {
  calendar: SchoolCalendar | null
  restoredPlan: ReturnType<typeof loadWorkspaceSnapshot>['restoredPlan']
  restoredAnchor: ISODate | null
  planning: PlanningWorkspace | null
  units: UnitWorkspace | null
  lessons: LessonWorkspace | null
  overrides: NonNullable<ShiftPersistenceInput['overrides']>
}): { context: PlanNavigationContext | null; viewWasPersisted: boolean } {
  if (!input.calendar) return { context: null, viewWasPersisted: false }
  const seed = input.restoredPlan?.context ?? createPlanNavigationContext({
    calendarId: input.calendar.id,
    anchorDate: input.restoredAnchor ?? input.calendar.firstDay,
  })
  return {
    context: resolvePlanContext(seed, {
      calendar: input.calendar,
      planning: input.planning,
      units: input.units,
      lessons: input.lessons,
      overrides: input.overrides,
    }),
    viewWasPersisted: input.restoredPlan?.viewWasPersisted ?? false,
  }
}
