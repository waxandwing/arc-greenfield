import { useEffect, useState } from 'react'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewPreferences } from './CalendarViewPreferences'
import { WorkspaceStage } from './WorkspaceStage'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
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

type TaskNote = { id: string; text: string; done: boolean }
const TASK_STORAGE_KEY = 'arc.task-bar.notes.v1'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [fridgeDate, setFridgeDate] = useState('')
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [taskNotes, setTaskNotes] = useState<TaskNote[]>(loadTaskNotes)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)
  const unscheduledLessons = workspace.lessonWorkspace?.lessons.filter((lesson) => lesson.plannedDate === null) ?? []
  const scheduledLessons = workspace.lessonWorkspace?.lessons.filter((lesson) => lesson.plannedDate !== null) ?? []
  const unscheduledUnits = workspace.unitWorkspace?.units.filter((unit) => unit.placement === null) ?? []

  useEffect(() => {
    if (!workspace.calendar || !workspace.anchorDate) return
    const preferred = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
    workspace.setActiveView(preferred)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(workspace.calendar && workspace.anchorDate)])

  useEffect(() => {
    if (!fridgeDate && workspace.anchorDate) setFridgeDate(workspace.anchorDate)
  }, [fridgeDate, workspace.anchorDate])

  useEffect(() => {
    saveTaskNotes(taskNotes)
  }, [taskNotes])

  function updateViewPreferences(next: ViewPreferences) {
    setViewPreferences(next)
    saveViewPreferences(next)
  }

  function selectView(view: CalendarView) {
    if (!workspace.viewAvailability(view).available) return
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

  function addTaskNote() {
    const text = taskDraft.trim()
    if (!text) return
    setTaskNotes((notes) => [...notes, { id: createId(), text, done: false }])
    setTaskDraft('')
  }

  const homeView = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)

  return (
    <div className="arc-shell b01-furniture-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button className="arc-wordmark" type="button" aria-label={`Return to ${homeView} view`} onClick={returnHome}>arc</button>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <button className="furniture-tab furniture-tab-settings" type="button" aria-expanded={settingsOpen} aria-controls="settings-furniture" onClick={() => setSettingsOpen((open) => !open)}>Settings</button>
      <button className="furniture-tab furniture-tab-fridge" type="button" aria-expanded={fridgeOpen} aria-controls="fridge-furniture" onClick={() => setFridgeOpen((open) => !open)}>Fridge</button>
      <button className="furniture-tab furniture-tab-task" type="button" aria-expanded={taskOpen} aria-controls="task-furniture" onClick={() => setTaskOpen((open) => !open)}>Task Bar</button>

      <aside id="settings-furniture" className={`furniture-surface furniture-settings ${settingsOpen ? 'is-open' : ''}`} aria-hidden={!settingsOpen}>
        <div className="furniture-heading"><strong>Settings</strong><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close Settings">×</button></div>
        <nav className="furniture-view-grid" aria-label="Calendar views">
          {CALENDAR_VIEWS.map((view) => {
            const availability = workspace.viewAvailability(view)
            return <button key={view} type="button" disabled={workspaceBusy || !availability.available} aria-pressed={workspace.activeView === view} onClick={() => selectView(view)}>{view}</button>
          })}
        </nav>
        <CalendarViewPreferences preferences={viewPreferences} onChange={updateViewPreferences} />
        <div className="furniture-action-grid">
          <button type="button" onClick={() => workspaceMode.open('calendar-setup')}>Calendar setup</button>
          <button type="button" onClick={() => workspaceMode.open('terms')}>Terms</button>
          <button type="button" onClick={() => workspaceMode.open('classes')}>Classes</button>
          <button type="button" onClick={() => workspaceMode.open('units')}>Units</button>
          <button type="button" onClick={() => workspaceMode.open('lessons')}>Lessons</button>
          <button type="button" onClick={() => workspaceMode.open('recovery')}>Recovery</button>
        </div>
      </aside>

      <aside id="fridge-furniture" className={`furniture-surface furniture-fridge ${fridgeOpen ? 'is-open' : ''}`} aria-hidden={!fridgeOpen}>
        <div className="furniture-heading"><strong>Fridge</strong><button type="button" onClick={() => setFridgeOpen(false)} aria-label="Close Fridge">×</button></div>
        <p className="furniture-help">Ideas live here until they have a date. Moving a Lesson is reversible.</p>
        <label className="fridge-date"><span>Send to date</span><input type="date" value={fridgeDate} onChange={(event) => setFridgeDate(event.target.value)} /></label>
        {fridgeUndo && <button className="furniture-undo" type="button" onClick={undoLastFridgeMove}>Undo last Fridge move</button>}
        <section className="fridge-group" aria-labelledby="fridge-lessons-title">
          <h2 id="fridge-lessons-title">Lessons</h2>
          {unscheduledLessons.length === 0 ? <p className="furniture-empty">No loose Lessons.</p> : unscheduledLessons.map((lesson) => (
            <article className="fridge-card" key={lesson.id}><strong>{lesson.title}</strong><button type="button" onClick={() => scheduleLessonFromFridge(lesson.id)}>Send to week</button></article>
          ))}
        </section>
        <section className="fridge-group" aria-labelledby="fridge-units-title">
          <h2 id="fridge-units-title">Units</h2>
          {unscheduledUnits.length === 0 ? <p className="furniture-empty">No loose Units.</p> : unscheduledUnits.map((unit) => <article className="fridge-card fridge-card-unit" key={unit.id}><strong>{unit.title}</strong><button type="button" onClick={() => workspaceMode.open('units')}>Place Unit</button></article>)}
        </section>
        {scheduledLessons.length > 0 && <details className="fridge-return-list"><summary>Return a scheduled Lesson to Fridge</summary>{scheduledLessons.map((lesson) => <button key={lesson.id} type="button" onClick={() => sendLessonBackToFridge(lesson.id)}>{lesson.title}</button>)}</details>}
      </aside>

      <aside id="task-furniture" className={`furniture-surface furniture-task ${taskOpen ? 'is-open' : ''}`} aria-hidden={!taskOpen}>
        <div className="furniture-heading"><strong>Task Bar</strong><button type="button" onClick={() => setTaskOpen(false)} aria-label="Close Task Bar">×</button></div>
        <form className="task-note-composer" onSubmit={(event) => { event.preventDefault(); addTaskNote() }}>
          <input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Add a note" aria-label="Add Task Bar note" />
          <button type="submit">Add</button>
        </form>
        <div className="task-note-list">
          {taskNotes.length === 0 ? <p className="furniture-empty">No notes yet.</p> : taskNotes.map((note) => (
            <article className={`task-note ${note.done ? 'is-done' : ''}`} key={note.id}>
              <label><input type="checkbox" checked={note.done} onChange={() => setTaskNotes((notes) => notes.map((item) => item.id === note.id ? { ...item, done: !item.done } : item))} /><span>{note.text}</span></label>
              <button type="button" onClick={() => setTaskNotes((notes) => notes.filter((item) => item.id !== note.id))} aria-label={`Delete ${note.text}`}>×</button>
            </article>
          ))}
        </div>
      </aside>

      <div className="arc-layout b01-fixed-calendar-layout">
        <main id="calendar-stage" className="arc-calendar-stage b01-fixed-calendar" tabIndex={-1}>
          <CalendarStageHeader
            activeView={workspace.activeView}
            mode={workspaceMode.mode}
            calendar={workspace.calendar}
            anchorDate={workspace.anchorDate}
            previousTarget={workspace.previousTarget}
            nextTarget={workspace.nextTarget}
            todayTarget={workspace.todayTarget}
            hasTerms={workspace.hasTerms}
            hasClasses={workspace.hasClasses}
            hasUnits={workspace.hasUnits}
            hasLessons={workspace.hasLessons}
            recoveryCount={workspace.recoveryCount}
            undoAvailable={Boolean(workspace.shiftState?.undo)}
            stageTitle={stageTitle}
            onMovePrevious={() => workspace.movePeriod('previous')}
            onMoveNext={() => workspace.movePeriod('next')}
            onToday={workspace.goToday}
            onOpenCalendarSetup={() => workspaceMode.open('calendar-setup')}
            onOpenTerms={() => workspaceMode.open('terms')}
            onOpenClasses={() => workspaceMode.open('classes')}
            onOpenUnits={() => workspaceMode.open('units')}
            onOpenLessons={() => workspaceMode.open('lessons')}
            onOpenRecovery={() => workspaceMode.open('recovery')}
            onUndoShift={workspace.undoLastShift}
          />
          {workspace.storageNotice && <p className="storage-notice" role="status">{workspace.storageNotice}</p>}
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

function createId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function loadTaskNotes(): TaskNote[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TASK_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is TaskNote => Boolean(item && typeof item.id === 'string' && typeof item.text === 'string' && typeof item.done === 'boolean')) : []
  } catch {
    return []
  }
}

function saveTaskNotes(notes: TaskNote[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(notes)) } catch { /* session remains usable */ }
}
