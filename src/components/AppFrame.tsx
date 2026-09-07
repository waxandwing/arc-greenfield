import { useEffect, useState } from 'react'
import { B01Furniture } from './B01Furniture'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewPreferences } from './CalendarViewPreferences'
import { WorkspaceStage } from './WorkspaceStage'
import type { PlanningWeekObjectActions } from './PlanningWeekDayView'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import { DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import {
  loadViewPreferences,
  recordLastUsedView,
  resolveHomeView,
  saveViewPreferences,
  type ViewPreferences,
} from '../navigation/viewPreferences'
import {
  copyLessonForLater,
  copyPlanningNote,
  copyUnitForLater,
  createLessonOnWeek,
  createPlanningNoteOnWeek,
  createShiftOperation,
  createUnitOnWeek,
  deleteLesson,
  deletePlanningNote,
  deleteUnit,
  moveLesson,
  moveLessonFromFridge,
  moveLessonToFridge,
  movePlanningNote,
  moveUnit,
  undoFridgeRoundTrip,
  unplaceLessonFromCalendar,
  unplaceUnitFromCalendar,
  validateShiftOperation,
  type FridgeRoundTripReceipt,
  type PlanningNotePlacement,
  type ShiftPersistenceInput,
} from '../planning'
import type { ISODate } from '../calendar'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)
  const [fridgeDate, setFridgeDate] = useState('')
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)
  const [contextNotice, setContextNotice] = useState<string | null>(null)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)
  const unscheduledLessons = workspace.lessonWorkspace?.lessons.filter((lesson) => lesson.plannedDate === null) ?? []
  const scheduledLessons = workspace.lessonWorkspace?.lessons.filter((lesson) => lesson.plannedDate !== null) ?? []
  const unscheduledUnits = workspace.unitWorkspace?.units.filter((unit) => unit.placement === null) ?? []

  useEffect(() => {
    if (!workspace.calendar || !workspace.anchorDate) return
    const preferred = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
    workspace.setActiveView(preferred)
    // Home preference is intentionally applied only when the restored workspace becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(workspace.calendar && workspace.anchorDate)])

  useEffect(() => {
    if (!fridgeDate && workspace.anchorDate) setFridgeDate(workspace.anchorDate)
  }, [fridgeDate, workspace.anchorDate])

  function updateViewPreferences(next: ViewPreferences) {
    setViewPreferences(next)
    saveViewPreferences(next)
  }

  function selectView(view: CalendarView) {
    workspace.setActiveView(view)
    updateViewPreferences(recordLastUsedView(viewPreferences, view))
  }

  function returnHome() {
    if (workspaceBusy) return
    workspace.setActiveView(resolveAvailableHomeView(viewPreferences, workspace.viewAvailability))
  }

  function shiftWithOverrides(overrides: ShiftPersistenceInput['overrides']): ShiftPersistenceInput | null {
    if (!workspace.calendar) return null
    return { calendarId: workspace.calendar.id, overrides, undo: workspace.shiftState?.undo ?? null }
  }

  function reportContextError(error: unknown) {
    setContextNotice(error instanceof Error ? error.message : String(error))
  }

  function moveUnitOnWeek(unitId: string, startDate: ISODate, endDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = moveUnit({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId, placement: { startDate, endDate } })
      workspace.useUnits(next, next)
      setContextNotice('Unit range updated. Identity, Lessons, and teaching history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function copyUnit(unitId: string) {
    if (!workspace.unitWorkspace) return
    try {
      const next = copyUnitForLater(workspace.unitWorkspace, unitId)
      workspace.useUnits(next, next)
      setContextNotice('Unit copied for later with a new identity. Lessons and placement were not duplicated.')
    } catch (error) { reportContextError(error) }
  }

  function unplaceUnit(unitId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = unplaceUnitFromCalendar({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId })
      workspace.useUnits(next, next)
      setContextNotice('Unit unplaced. Its identity and history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function destroyUnit(unitId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = deleteUnit({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId })
      workspace.useUnits(next, next)
      setContextNotice('Unit deleted after dependency checks passed.')
    } catch (error) { reportContextError(error) }
  }

  function moveLessonOnWeek(lessonId: string, plannedDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = moveLesson({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId, plannedDate })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      workspace.useLessons(next, next, shift)
      setContextNotice('Lesson moved in the shared Course plan. Identity and teaching history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function previewLessonShift(sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) {
      return { allowed: false, message: 'Arc cannot preview this Shift because the planning context is incomplete.' }
    }
    const section = workspace.planningWorkspace.sections.find((candidate) => candidate.id === sectionId)
    if (!section) return { allowed: false, message: 'Arc cannot preview this Shift because the Section no longer exists.' }
    try {
      const operation = createShiftOperation({ sectionId, changes: [{ lessonId, fromDate, toDate }] })
      const errors = validateShiftOperation({ operation, section, lessons: workspace.lessonWorkspace.lessons, deliveryStates: workspace.lessonWorkspace.deliveryStates, units: workspace.unitWorkspace.units, calendar: workspace.calendar, overrides: workspace.shiftState?.overrides ?? [] })
      if (errors.length > 0) return { allowed: false, message: errors.join(' ') }
      return { allowed: true, message: `Preview: move only ${section.name} from ${fromDate} to ${toDate}. The shared Course plan stays unchanged. Applying creates a reload-safe Undo.` }
    } catch (error) {
      return { allowed: false, message: error instanceof Error ? error.message : String(error) }
    }
  }

  function applyLessonShift(sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) {
    try {
      const operation = createShiftOperation({ sectionId, changes: [{ lessonId, fromDate, toDate }] })
      const error = workspace.applyRecoveryShift(operation)
      if (error) setContextNotice(error)
      else setContextNotice('Section Shift applied. Shared Course plan unchanged; Undo is available.')
    } catch (error) { reportContextError(error) }
  }

  function copyLesson(lessonId: string) {
    if (!workspace.lessonWorkspace) return
    try {
      const next = copyLessonForLater(workspace.lessonWorkspace, lessonId)
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      workspace.useLessons(next, next, shift)
      setContextNotice('Lesson copied for later with a new identity. Dates and teaching history were not duplicated.')
    } catch (error) { reportContextError(error) }
  }

  function unplaceLesson(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const result = unplaceLessonFromCalendar({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const shift: ShiftPersistenceInput = { calendarId: workspace.calendar.id, overrides: result.overrides, undo: null }
      workspace.useLessons(result.lessons, result.lessons, shift)
      setContextNotice(result.removedOverrides.length > 0 ? 'Lesson unplaced. Section-specific dates were cleared; teaching history was preserved.' : 'Lesson unplaced. Identity and teaching history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function destroyLesson(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = deleteLesson({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      workspace.useLessons(next, next, shift)
      setContextNotice('Lesson deleted after history and Section-schedule guards passed.')
    } catch (error) { reportContextError(error) }
  }

  function moveNoteOnWeek(noteId: string, date: ISODate, placement: PlanningNotePlacement) {
    if (!workspace.planningWorkspace) return
    try {
      const next = movePlanningNote(workspace.planningWorkspace, noteId, date, placement)
      workspace.useClasses(next, next)
      setContextNotice('Note moved. Identity, source, and Important state were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function copyNote(noteId: string) {
    if (!workspace.planningWorkspace) return
    try {
      const next = copyPlanningNote(workspace.planningWorkspace, noteId)
      workspace.useClasses(next, next)
      setContextNotice('Note copied with a new identity. Source and Important state were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function destroyNote(noteId: string) {
    if (!workspace.planningWorkspace) return
    try {
      const next = deletePlanningNote(workspace.planningWorkspace, noteId)
      workspace.useClasses(next, next)
      setContextNotice('Note deleted.')
    } catch (error) { reportContextError(error) }
  }

  function createUnitFromWeek(courseId: string, title: string, startDate: ISODate, endDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace) return
    try {
      const next = createUnitOnWeek({ calendar: workspace.calendar, workspace: workspace.unitWorkspace, courseId, title, startDate, endDate })
      workspace.useUnits(next, next)
      setContextNotice('Unit added from the Week calendar.')
    } catch (error) { reportContextError(error) }
  }

  function createLessonFromWeek(unitId: string, title: string, plannedDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = createLessonOnWeek({ calendar: workspace.calendar, units: workspace.unitWorkspace, workspace: workspace.lessonWorkspace, unitId, title, plannedDate })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      workspace.useLessons(next, next, shift)
      setContextNotice('Lesson added from the Week calendar.')
    } catch (error) { reportContextError(error) }
  }

  function createNoteFromWeek(date: ISODate, text: string, placement: PlanningNotePlacement, important: boolean) {
    if (!workspace.calendar || !workspace.planningWorkspace) return
    try {
      const next = createPlanningNoteOnWeek({ workspace: workspace.planningWorkspace, calendarId: workspace.calendar.id, date, text, placement, important })
      workspace.useClasses(next, next)
      setContextNotice(placement === 'after-school' ? 'After School note added from the Week calendar.' : 'Note added from the Week calendar.')
    } catch (error) { reportContextError(error) }
  }

  function sendLessonBackToFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const result = moveLessonToFridge({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const nextShift = shiftWithOverrides(result.overrides)
      if (!nextShift) return
      workspace.useLessons(result.lessons, result.lessons, nextShift)
      setFridgeUndo(result.undo)
    } catch (error) { reportContextError(error) }
  }

  function scheduleLessonFromFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace || !fridgeDate) return
    try {
      const result = moveLessonFromFridge({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId, plannedDate: fridgeDate as ISODate })
      const nextShift = shiftWithOverrides(result.overrides)
      if (!nextShift) return
      workspace.useLessons(result.lessons, result.lessons, nextShift)
      setFridgeUndo(result.undo)
    } catch (error) { reportContextError(error) }
  }

  function undoLastFridgeMove() {
    if (!fridgeUndo) return
    const restored = undoFridgeRoundTrip(fridgeUndo)
    const nextShift = shiftWithOverrides(restored.overrides)
    if (!nextShift) return
    workspace.useLessons(restored.lessons, restored.lessons, nextShift)
    setFridgeUndo(null)
  }

  const homeView = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
  const fridgeContent = workspace.calendar && workspaceMode.mode === 'calendar' ? (
    <div className="b01-fridge-content">
      <p className="b01-furniture-empty">Unscheduled Lessons and Units stay here until you place them.</p>
      <label className="b01-fridge-date"><span>Send Lesson to date</span><input type="date" value={fridgeDate} onChange={(event) => setFridgeDate(event.target.value)} /></label>
      {fridgeUndo && <button type="button" className="quiet-button" onClick={undoLastFridgeMove}>Undo last Fridge move</button>}
      <section aria-labelledby="b01-fridge-lessons"><h2 id="b01-fridge-lessons">Lessons</h2>{unscheduledLessons.length === 0 ? <p className="b01-furniture-empty">No loose Lessons.</p> : unscheduledLessons.map((lesson) => <article className="b01-fridge-card" key={lesson.id}><strong>{lesson.title}</strong><button type="button" className="quiet-button" onClick={() => scheduleLessonFromFridge(lesson.id)}>Send to week</button></article>)}</section>
      <section aria-labelledby="b01-fridge-units"><h2 id="b01-fridge-units">Units</h2>{unscheduledUnits.length === 0 ? <p className="b01-furniture-empty">No loose Units.</p> : unscheduledUnits.map((unit) => <article className="b01-fridge-card b01-fridge-card--unit" key={unit.id}><strong>{unit.title}</strong><button type="button" className="quiet-button" onClick={() => workspaceMode.open('units')}>Place Unit</button></article>)}</section>
      {scheduledLessons.length > 0 && <details className="b01-fridge-return"><summary>Return a scheduled Lesson to Fridge</summary>{scheduledLessons.map((lesson) => <button key={lesson.id} type="button" className="quiet-button" onClick={() => sendLessonBackToFridge(lesson.id)}>{lesson.title}</button>)}</details>}
    </div>
  ) : <p className="b01-furniture-empty">Fridge is available in calendar mode.</p>

  const weekObjectActions: PlanningWeekObjectActions = {
    courses: workspace.planningWorkspace?.courses.map((course) => ({ id: course.id, title: course.title })) ?? [],
    units: workspace.unitWorkspace?.units.flatMap((unit) => unit.placement ? [{ id: unit.id, title: unit.title, courseId: unit.courseId, startDate: unit.placement.startDate, endDate: unit.placement.endDate }] : []) ?? [],
    moveUnit: moveUnitOnWeek,
    fullEditUnit: () => workspaceMode.open('units'),
    copyUnit,
    unplaceUnit,
    deleteUnit: destroyUnit,
    moveLesson: moveLessonOnWeek,
    previewShift: previewLessonShift,
    applyShift: applyLessonShift,
    fullEditLesson: () => workspaceMode.open('lessons'),
    copyLesson,
    unplaceLesson,
    deleteLesson: destroyLesson,
    moveNote: moveNoteOnWeek,
    copyNote,
    deleteNote: destroyNote,
    createUnit: createUnitFromWeek,
    createLesson: createLessonFromWeek,
    createNote: createNoteFromWeek,
  }

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>
      <header className="arc-header" aria-label="Arc application header"><button className="arc-wordmark" type="button" aria-label={`Return to ${homeView} view`} onClick={returnHome}>arc</button><div className="arc-header-space" aria-hidden="true" /></header>
      <div className="arc-layout">
        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <CalendarStageHeader activeView={workspace.activeView} mode={workspaceMode.mode} calendar={workspace.calendar} anchorDate={workspace.anchorDate} previousTarget={workspace.previousTarget} nextTarget={workspace.nextTarget} todayTarget={workspace.todayTarget} hasTerms={workspace.hasTerms} hasClasses={workspace.hasClasses} hasUnits={workspace.hasUnits} hasLessons={workspace.hasLessons} recoveryCount={workspace.recoveryCount} undoAvailable={Boolean(workspace.shiftState?.undo)} stageTitle={stageTitle} viewSelectionDisabled={workspaceBusy} availabilityFor={workspace.viewAvailability} onSelectView={selectView} onMovePrevious={() => workspace.movePeriod('previous')} onMoveNext={() => workspace.movePeriod('next')} onToday={workspace.goToday} onOpenCalendarSetup={() => workspaceMode.open('calendar-setup')} onOpenTerms={() => workspaceMode.open('terms')} onOpenClasses={() => workspaceMode.open('classes')} onOpenUnits={() => workspaceMode.open('units')} onOpenLessons={() => workspaceMode.open('lessons')} onOpenRecovery={() => workspaceMode.open('recovery')} onUndoShift={workspace.undoLastShift} />
          {workspace.storageNotice && <p className="storage-notice" role="status">{workspace.storageNotice}</p>}
          {contextNotice && <p className="storage-notice b03-context-notice" role="status">{contextNotice}</p>}
          <B01Furniture settings={workspace.calendar && workspaceMode.mode === 'calendar' ? <CalendarViewPreferences preferences={viewPreferences} onChange={updateViewPreferences} /> : <p className="b01-furniture-empty">Calendar settings are available in calendar mode.</p>} fridge={fridgeContent}>
            <section className="calendar-canvas" aria-label={`${stageTitle} workspace`}>
              <WorkspaceStage mode={workspaceMode.mode} activeView={workspace.activeView} showWeekends={viewPreferences.showWeekends} calendar={workspace.calendar} calendarInput={workspace.calendarInput} anchorDate={workspace.anchorDate} planningWorkspace={workspace.planningWorkspace} planningInput={workspace.planningInput} unitWorkspace={workspace.unitWorkspace} unitInput={workspace.unitInput} lessonWorkspace={workspace.lessonWorkspace} lessonInput={workspace.lessonInput} shiftState={workspace.shiftState} protectedCourseIds={workspace.protectedCourseIds} protectedUnitIds={workspace.protectedUnitIds} protectedSectionIds={workspace.protectedSectionIds} weekObjectActions={weekObjectActions} onUseCalendar={workspace.useCalendar} onUseTerms={workspace.useTerms} onUseClasses={workspace.useClasses} onUseUnits={workspace.useUnits} onUseLessons={workspace.useLessons} onApplyRecoveryShift={workspace.applyRecoveryShift} onCloseMode={workspaceMode.close} />
            </section>
          </B01Furniture>
        </main>
      </div>
    </div>
  )
}

function resolveAvailableHomeView(preferences: ViewPreferences, availabilityFor: (view: CalendarView) => { available: boolean }): CalendarView {
  const preferred = resolveHomeView(preferences)
  return availabilityFor(preferred).available ? preferred : DEFAULT_HOME_VIEW
}

function stageTitleFor(mode: ReturnType<typeof useWorkspaceMode>['mode'], activeView: string) {
  if (mode === 'recovery') return 'Recovery review'
  if (mode === 'terms') return 'Terms'
  if (mode === 'classes') return 'Classes'
  if (mode === 'units') return 'Units'
  if (mode === 'lessons') return 'Lessons'
  if (mode === 'calendar-setup') return 'Calendar'
  return activeView
}
