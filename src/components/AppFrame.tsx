import { useState } from 'react'
import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { ClassSetup } from './ClassSetup'
import { LessonSetup } from './LessonSetup'
import { RecoveryReview } from './RecoveryReview'
import { TermBoundarySetup } from './TermBoundarySetup'
import { UnitSetup } from './UnitSetup'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import {
  currentLocalISODate,
  findContainingBoundary,
  hydrateSchoolCalendar,
  loadCalendarFromBrowser,
  moveAnchor,
  saveCalendarToBrowser,
  todayAnchor,
  type CalendarHydrationInput,
  type ISODate,
  type PeriodDirection,
  type SchoolCalendar,
} from '../calendar'
import {
  applyShiftOperation,
  courseIdsProtectedByUnits,
  loadLessonsFromBrowser,
  loadPlanningWorkspaceFromBrowser,
  loadShiftStateFromBrowser,
  loadUnitsFromBrowser,
  saveLessonsToBrowser,
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

export function AppFrame() {
  const [initialLoad] = useState(() => loadCalendarFromBrowser())
  const restored = initialLoad.status === 'restored' ? initialLoad.restored : null
  const [initialPlanningLoad] = useState(() => restored ? loadPlanningWorkspaceFromBrowser(restored.calendar.id) : { status: 'empty' as const })
  const restoredPlanning = initialPlanningLoad.status === 'restored' ? initialPlanningLoad : null
  const [initialUnitLoad] = useState(() => restored && restoredPlanning ? loadUnitsFromBrowser(restored.calendar, restoredPlanning.workspace) : { status: 'empty' as const })
  const restoredUnits = initialUnitLoad.status === 'restored' ? initialUnitLoad : null
  const [initialLessonLoad] = useState(() => restored && restoredPlanning && restoredUnits ? loadLessonsFromBrowser(restored.calendar, restoredPlanning.workspace, restoredUnits.workspace) : { status: 'empty' as const })
  const restoredLessons = initialLessonLoad.status === 'restored' ? initialLessonLoad : null
  const [initialShiftLoad] = useState(() => restored && restoredPlanning && restoredUnits && restoredLessons
    ? loadShiftStateFromBrowser(restored.calendar, restoredPlanning.workspace, restoredUnits.workspace, restoredLessons.workspace)
    : { status: 'empty' as const })
  const restoredShift = initialShiftLoad.status === 'restored' ? initialShiftLoad : null

  const [activeView, setActiveView] = useState<CalendarView>(DEFAULT_HOME_VIEW)
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(restored?.calendar ?? null)
  const [calendarInput, setCalendarInput] = useState<CalendarHydrationInput | null>(restored?.input ?? null)
  const [anchorDate, setAnchorDate] = useState<ISODate | null>(restored?.calendar.firstDay ?? null)
  const [planningWorkspace, setPlanningWorkspace] = useState<PlanningWorkspace | null>(restoredPlanning?.workspace ?? null)
  const [planningInput, setPlanningInput] = useState<PlanningWorkspaceInput | null>(restoredPlanning?.input ?? null)
  const [unitWorkspace, setUnitWorkspace] = useState<UnitWorkspace | null>(restoredUnits?.workspace ?? null)
  const [unitInput, setUnitInput] = useState<UnitWorkspaceInput | null>(restoredUnits?.input ?? null)
  const [lessonWorkspace, setLessonWorkspace] = useState<LessonWorkspace | null>(restoredLessons?.workspace ?? null)
  const [lessonInput, setLessonInput] = useState<LessonWorkspaceInput | null>(restoredLessons?.input ?? null)
  const [shiftState, setShiftState] = useState<ShiftPersistenceInput | null>(restoredShift?.input ?? (restored ? { calendarId: restored.calendar.id, overrides: [], sameDayApprovals: [], undo: null } : null))
  const [editingCalendar, setEditingCalendar] = useState(false)
  const [editingTerms, setEditingTerms] = useState(false)
  const [editingClasses, setEditingClasses] = useState(false)
  const [editingUnits, setEditingUnits] = useState(false)
  const [editingLessons, setEditingLessons] = useState(false)
  const [reviewingRecovery, setReviewingRecovery] = useState(false)
  const [storageNotice, setStorageNotice] = useState<string | null>(() => {
    if (initialLoad.status === 'invalid') return 'Arc found saved calendar data it could not verify. Nothing was restored; please confirm the calendar again.'
    if (initialLoad.status === 'unavailable') return 'Calendar storage is unavailable in this browser. Changes may last only for this session.'
    if (initialPlanningLoad.status === 'invalid') return 'Arc found saved class data it could not verify. The calendar is safe; please confirm the classes again.'
    if (initialPlanningLoad.status === 'unavailable') return 'Class storage is unavailable in this browser. Class changes may last only for this session.'
    if (initialUnitLoad.status === 'invalid') return 'Arc found saved Unit data it could not verify. Your calendar and classes are safe; please confirm the Units again.'
    if (initialUnitLoad.status === 'unavailable') return 'Unit storage is unavailable in this browser. Unit changes may last only for this session.'
    if (initialLessonLoad.status === 'invalid') return 'Arc found saved Lesson progress it could not verify. Calendar, Classes, and Units are safe; please confirm the Lessons again.'
    if (initialLessonLoad.status === 'unavailable') return 'Lesson storage is unavailable in this browser. Lesson progress may last only for this session.'
    if (initialShiftLoad.status === 'invalid') return 'Arc found saved Section schedule changes it could not verify. Earlier planning data is safe; the Section schedule was not restored.'
    if (initialShiftLoad.status === 'unavailable') return 'Section schedule storage is unavailable in this browser. Shift changes may last only for this session.'
    if (restoredShift?.undoStatus === 'discarded') return 'Arc restored the Section schedule, but its previous Undo was no longer safe and was discarded.'
    return null
  })

  function closeSecondaryStates() {
    setEditingCalendar(false)
    setEditingTerms(false)
    setEditingClasses(false)
    setEditingUnits(false)
    setEditingLessons(false)
    setReviewingRecovery(false)
  }

  function reconcileShiftState(
    nextCalendar: SchoolCalendar,
    nextPlanning: PlanningWorkspace | null,
    nextUnits: UnitWorkspace | null,
    nextLessons: LessonWorkspace | null,
  ): { allowed: boolean; next: ShiftPersistenceInput | null; undoDropped: boolean } {
    if (!shiftState) return { allowed: true, next: { calendarId: nextCalendar.id, overrides: [], sameDayApprovals: [], undo: null }, undoDropped: false }
    if (!nextPlanning || !nextUnits || !nextLessons) {
      if (shiftState.overrides.length > 0 || shiftState.sameDayApprovals.length > 0) return { allowed: false, next: shiftState, undoDropped: false }
      return { allowed: true, next: { calendarId: nextCalendar.id, overrides: [], sameDayApprovals: [], undo: null }, undoDropped: Boolean(shiftState.undo) }
    }

    const candidate: ShiftPersistenceInput = { ...shiftState, calendarId: nextCalendar.id }
    const validation = validateShiftPersistenceInput(candidate, nextCalendar, nextPlanning, nextUnits, nextLessons)
    if (validation.scheduleErrors.length > 0) return { allowed: false, next: shiftState, undoDropped: false }
    if (!validation.undoValid && candidate.undo) return { allowed: true, next: { ...candidate, undo: null }, undoDropped: true }
    return { allowed: true, next: candidate, undoDropped: false }
  }

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

    const shift = reconcileShiftState(nextCalendar, planningWorkspace, unitWorkspace, lessonWorkspace)
    if (!shift.allowed) {
      setStorageNotice('That calendar change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the calendar.')
      return
    }

    const calendarPersisted = saveCalendarToBrowser(input)
    const shiftPersisted = persistReconciledShift(shift.next)
    setCalendar(nextCalendar)
    setCalendarInput(input)
    setAnchorDate(nextCalendar.firstDay)
    setActiveView(DEFAULT_HOME_VIEW)
    closeSecondaryStates()
    if (!calendarPersisted || !shiftPersisted) setStorageNotice('This change is active for this session, but Arc could not save all related planning state in this browser.')
    else if (shift.undoDropped) setStorageNotice('Calendar updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
    else setStorageNotice(null)
  }

  function useTerms(input: CalendarHydrationInput) {
    const nextCalendar = hydrateSchoolCalendar(input)
    const shift = reconcileShiftState(nextCalendar, planningWorkspace, unitWorkspace, lessonWorkspace)
    if (!shift.allowed) {
      setStorageNotice('Those term changes would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the terms.')
      return
    }

    const calendarPersisted = saveCalendarToBrowser(input)
    const shiftPersisted = persistReconciledShift(shift.next)
    setCalendar(nextCalendar)
    setCalendarInput(input)
    setEditingTerms(false)
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
      const shift = reconcileShiftState(calendar, workspace, unitWorkspace, lessonWorkspace)
      if (!shift.allowed) {
        setStorageNotice('That class change would orphan an existing Section schedule. Resolve the affected Shift history first; Arc has not changed the classes.')
        return
      }
      const classesPersisted = savePlanningWorkspaceToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setPlanningWorkspace(workspace)
      setPlanningInput(input)
      setEditingClasses(false)
      if (!classesPersisted || !shiftPersisted) setStorageNotice('These classes are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Classes updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = savePlanningWorkspaceToBrowser(input)
    setPlanningWorkspace(workspace)
    setPlanningInput(input)
    setEditingClasses(false)
    setStorageNotice(persisted ? null : 'These classes are active for this session, but Arc could not save them in this browser.')
  }

  function useUnits(input: UnitWorkspaceInput, workspace: UnitWorkspace) {
    if (calendar && planningWorkspace && lessonWorkspace) {
      const lessonErrors = validateLessonWorkspace(lessonWorkspace, calendar, planningWorkspace, workspace)
      if (lessonErrors.length > 0) {
        setStorageNotice('That Unit change would invalidate one or more Lessons. Move or update those Lessons first; Arc has not changed the Units.')
        return
      }
      const shift = reconcileShiftState(calendar, planningWorkspace, workspace, lessonWorkspace)
      if (!shift.allowed) {
        setStorageNotice('That Unit change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the Units.')
        return
      }
      const unitsPersisted = saveUnitsToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setUnitWorkspace(workspace)
      setUnitInput(input)
      setEditingUnits(false)
      if (!unitsPersisted || !shiftPersisted) setStorageNotice('These Units are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Units updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = saveUnitsToBrowser(input)
    setUnitWorkspace(workspace)
    setUnitInput(input)
    setEditingUnits(false)
    setStorageNotice(persisted ? null : 'These Units are active for this session, but Arc could not save them in this browser.')
  }

  function useLessons(input: LessonWorkspaceInput, workspace: LessonWorkspace) {
    if (calendar && planningWorkspace && unitWorkspace) {
      const shift = reconcileShiftState(calendar, planningWorkspace, unitWorkspace, workspace)
      if (!shift.allowed) {
        setStorageNotice('That Lesson change would invalidate an existing Section schedule. Resolve the affected Shift dates first; Arc has not changed the Lessons.')
        return
      }
      const lessonsPersisted = saveLessonsToBrowser(input)
      const shiftPersisted = persistReconciledShift(shift.next)
      setLessonWorkspace(workspace)
      setLessonInput(input)
      setEditingLessons(false)
      if (!lessonsPersisted || !shiftPersisted) setStorageNotice('These Lessons are active for this session, but Arc could not save all related planning state in this browser.')
      else if (shift.undoDropped) setStorageNotice('Lessons updated. The Section schedule remains valid, but the previous Undo was no longer safe and was discarded.')
      else setStorageNotice(null)
      return
    }
    const persisted = saveLessonsToBrowser(input)
    setLessonWorkspace(workspace)
    setLessonInput(input)
    setEditingLessons(false)
    setStorageNotice(persisted ? null : 'These Lessons are active for this session, but Arc could not save them in this browser.')
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
        sameDayApprovals: shiftState.sameDayApprovals,
      })
      const candidate: ShiftPersistenceInput = {
        calendarId: calendar.id,
        overrides: applied.overrides,
        sameDayApprovals: shiftState.sameDayApprovals,
        undo: applied.undo,
      }
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
      const candidate: ShiftPersistenceInput = {
        calendarId: calendar.id,
        overrides,
        sameDayApprovals: shiftState.sameDayApprovals,
        undo: null,
      }
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

  function viewAvailability(view: CalendarView): { available: boolean; reason?: string } {
    if (!calendar) return { available: false, reason: 'Set up the school calendar first.' }
    if (view === 'Quarter' && calendar.quarters.length === 0) return { available: false, reason: 'Quarter dates are not configured yet.' }
    if (view === 'Semester' && calendar.semesters.length === 0) return { available: false, reason: 'Semester dates are not configured yet.' }
    return { available: true }
  }

  const showCalendarSetup = !calendar || !anchorDate || editingCalendar
  const showEditor = showCalendarSetup || editingTerms || editingClasses || editingUnits || editingLessons || reviewingRecovery
  const previousTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'previous') : null
  const nextTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'next') : null
  const todayTarget = calendar ? todayAnchor(calendar, currentLocalISODate()) : null
  const hasTerms = Boolean(calendar && (calendar.quarters.length > 0 || calendar.semesters.length > 0))
  const hasClasses = Boolean(planningWorkspace && planningWorkspace.courses.length > 0)
  const hasUnits = Boolean(unitWorkspace && unitWorkspace.units.length > 0)
  const hasLessons = Boolean(lessonWorkspace && lessonWorkspace.lessons.length > 0)
  const recoveryCount = lessonWorkspace?.deliveryStates.filter((state) => state.status === 'in-progress').length ?? 0
  const protectedCourseIds = courseIdsProtectedByUnits(unitWorkspace)
  const protectedUnitIds = unitIdsProtectedByLessons(lessonWorkspace)
  const protectedSectionIds = sectionIdsProtectedByDelivery(lessonWorkspace)
  const stageTitle = reviewingRecovery ? 'Recovery review' : editingTerms ? 'Terms' : editingClasses ? 'Classes' : editingUnits ? 'Units' : editingLessons ? 'Lessons' : activeView

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>
      <header className="arc-header" aria-label="Arc application header"><button className="arc-wordmark" type="button" aria-label={`Return to ${DEFAULT_HOME_VIEW} view`} onClick={() => { if (!showEditor) setActiveView(DEFAULT_HOME_VIEW) }}>arc</button><div className="arc-header-space" aria-hidden="true" /></header>
      <div className="arc-layout">
        <nav className="arc-view-rail" aria-label="Calendar views">
          {CALENDAR_VIEWS.map((view) => {
            const isCurrent = activeView === view
            const availability = viewAvailability(view)
            const unavailable = !availability.available
            return <button key={view} type="button" className="view-nav-item" aria-current={isCurrent ? 'page' : undefined} aria-disabled={!showEditor && unavailable ? 'true' : undefined} aria-label={!showEditor && unavailable ? `${view}. ${availability.reason}` : view} title={!showEditor && unavailable ? availability.reason : undefined} disabled={showEditor} onClick={() => { if (!unavailable) setActiveView(view) }}>{view}</button>
          })}
        </nav>
        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <header className="calendar-stage-header">
            <div><p className="section-label">Calendar</p><h1 className="view-title" aria-live="polite">{stageTitle}</h1></div>
            {calendar && !showEditor && anchorDate && <div className="calendar-header-tools">
              <div className="period-controls" aria-label={`${activeView} date navigation`}><button type="button" className="quiet-button period-button" disabled={!previousTarget} onClick={() => movePeriod('previous')} aria-label={`Previous ${activeView}`}>←</button><button type="button" className="quiet-button today-button" disabled={!todayTarget} onClick={goToday}>Today</button><button type="button" className="quiet-button period-button" disabled={!nextTarget} onClick={() => movePeriod('next')} aria-label={`Next ${activeView}`}>→</button></div>
              <div className="calendar-context-group"><p className="calendar-context" aria-label="Current school calendar">{calendar.schoolYearLabel}</p><div className="calendar-context-actions">
                <button type="button" className="text-button" onClick={() => setEditingCalendar(true)}>Edit dates</button>
                <button type="button" className="text-button" onClick={() => setEditingTerms(true)}>{hasTerms ? 'Edit terms' : 'Set terms'}</button>
                <button type="button" className="text-button" onClick={() => setEditingClasses(true)}>{hasClasses ? 'Edit classes' : 'Set classes'}</button>
                {hasClasses && <button type="button" className="text-button" onClick={() => setEditingUnits(true)}>{hasUnits ? 'Edit Units' : 'Add Units'}</button>}
                {hasUnits && <button type="button" className="text-button" onClick={() => setEditingLessons(true)}>{hasLessons ? 'Edit Lessons' : 'Add Lessons'}</button>}
                {recoveryCount > 0 && <button type="button" className="text-button recovery-review-trigger" onClick={() => setReviewingRecovery(true)}>Review recovery ({recoveryCount})</button>}
                {shiftState?.undo && <button type="button" className="text-button" onClick={undoLastShift}>Undo last Shift</button>}
              </div></div>
            </div>}
          </header>
          {storageNotice && <p className="storage-notice" role="status">{storageNotice}</p>}
          <section className="calendar-canvas" aria-label={`${stageTitle} workspace`}>
            {showCalendarSetup ? <CalendarSetup initialValue={calendarInput} onSave={useCalendar} onCancel={calendar ? () => setEditingCalendar(false) : undefined} />
              : editingTerms && calendarInput ? <TermBoundarySetup input={calendarInput} onSave={useTerms} onCancel={() => setEditingTerms(false)} />
              : editingClasses && calendar ? <ClassSetup calendarId={calendar.id} initialValue={planningInput} protectedCourseIds={protectedCourseIds} protectedSectionIds={protectedSectionIds} onSave={useClasses} onCancel={() => setEditingClasses(false)} />
              : editingUnits && calendar && planningWorkspace ? <UnitSetup calendar={calendar} planning={planningWorkspace} initialValue={unitInput} protectedUnitIds={protectedUnitIds} onSave={useUnits} onCancel={() => setEditingUnits(false)} />
              : editingLessons && calendar && planningWorkspace && unitWorkspace ? <LessonSetup calendar={calendar} planning={planningWorkspace} units={unitWorkspace} initialValue={lessonInput} onSave={useLessons} onCancel={() => setEditingLessons(false)} />
              : reviewingRecovery && calendar && planningWorkspace && unitWorkspace && lessonWorkspace ? <RecoveryReview calendar={calendar} planning={planningWorkspace} units={unitWorkspace} lessons={lessonWorkspace} overrides={shiftState?.overrides ?? []} onApply={applyRecoveryShift} onClose={() => setReviewingRecovery(false)} />
              : <CalendarProjectionView view={activeView} calendar={calendar} anchorDate={anchorDate} />}
          </section>
        </main>
        <div className="arc-overlay-layer" aria-hidden="true" />
      </div>
    </div>
  )
}
