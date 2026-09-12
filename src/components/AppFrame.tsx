import { useEffect, useState } from 'react'
import { B01Furniture } from './B01Furniture'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewPreferences } from './CalendarViewPreferences'
import { WorkspaceStage } from './WorkspaceStage'
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
  moveLessonFromFridge,
  moveLessonToFridge,
  undoFridgeRoundTrip,
  type FridgeRoundTripReceipt,
  type ShiftPersistenceInput,
} from '../planning'
import type { ISODate } from '../calendar'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)
  const [fridgeDate, setFridgeDate] = useState('')
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)

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
    return {
      calendarId: workspace.calendar.id,
      overrides,
      undo: workspace.shiftState?.undo ?? null,
    }
  }

  function sendLessonBackToFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    const result = moveLessonToFridge({
      calendar: workspace.calendar,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
      lessonId,
    })
    const nextShift = shiftWithOverrides(result.overrides)
    if (!nextShift) return
    workspace.useLessons(result.lessons, result.lessons, nextShift)
    setFridgeUndo(result.undo)
  }

  function scheduleLessonFromFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace || !fridgeDate) return
    const result = moveLessonFromFridge({
      calendar: workspace.calendar,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
      lessonId,
      plannedDate: fridgeDate as ISODate,
    })
    const nextShift = shiftWithOverrides(result.overrides)
    if (!nextShift) return
    workspace.useLessons(result.lessons, result.lessons, nextShift)
    setFridgeUndo(result.undo)
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

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button className="arc-wordmark" type="button" aria-label={`Return to ${homeView} view`} onClick={returnHome}>arc</button>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <div className="arc-layout">
        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <CalendarStageHeader
            activeView={workspace.activeView}
            mode={workspaceMode.mode}
            calendar={workspace.calendar}
            anchorDate={workspace.anchorDate}
            previousTarget={workspace.previousTarget}
            nextTarget={workspace.nextTarget}
            todayTarget={workspace.todayTarget}
            recoveryCount={workspace.recoveryCount}
            undoAvailable={Boolean(workspace.shiftState?.undo)}
            stageTitle={stageTitle}
            viewSelectionDisabled={workspaceBusy}
            availabilityFor={workspace.viewAvailability}
            onSelectView={selectView}
            onMovePrevious={() => workspace.movePeriod('previous')}
            onMoveNext={() => workspace.movePeriod('next')}
            onToday={workspace.goToday}
            onOpenRecovery={() => workspaceMode.open('recovery')}
            onUndoShift={workspace.undoLastShift}
          />

          {workspace.storageNotice && <p className="storage-notice" role="status">{workspace.storageNotice}</p>}

          <B01Furniture
            settings={workspace.calendar && workspaceMode.mode === 'calendar'
              ? <CalendarViewPreferences preferences={viewPreferences} onChange={updateViewPreferences} />
              : <p className="b01-furniture-empty">Calendar settings are available in calendar mode.</p>}
            fridge={fridgeContent}
          >
            <section className="calendar-canvas" aria-label={`${stageTitle} workspace`}>
              <WorkspaceStage
                mode={workspaceMode.mode}
                activeView={workspace.activeView}
                showWeekends={viewPreferences.showWeekends}
                calendar={workspace.calendar}
                calendarInput={workspace.calendarInput}
                anchorDate={workspace.anchorDate}
                planningWorkspace={workspace.planningWorkspace}
                planningInput={workspace.planningInput}
                unitWorkspace={workspace.unitWorkspace}
                unitInput={workspace.unitInput}
                lessonWorkspace={workspace.lessonWorkspace}
                lessonInput={workspace.lessonInput}
                shiftState={workspace.shiftState}
                protectedCourseIds={workspace.protectedCourseIds}
                protectedUnitIds={workspace.protectedUnitIds}
                protectedSectionIds={workspace.protectedSectionIds}
                onUseCalendar={workspace.useCalendar}
                onUseTerms={workspace.useTerms}
                onUseClasses={workspace.useClasses}
                onUseUnits={workspace.useUnits}
                onUseLessons={workspace.useLessons}
                onApplyRecoveryShift={workspace.applyRecoveryShift}
                onCloseMode={workspaceMode.close}
              />
            </section>
          </B01Furniture>
        </main>
      </div>
    </div>
  )
}

function resolveAvailableHomeView(
  preferences: ViewPreferences,
  availabilityFor: (view: CalendarView) => { available: boolean },
): CalendarView {
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
