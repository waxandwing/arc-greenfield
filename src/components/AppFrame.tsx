import { useEffect, useState } from 'react'
import { B01Furniture } from './B01Furniture'
import { CalendarStageHeader } from './CalendarStageHeader'
import { PlanStateHeader } from './PlanStateHeader'
import { SettingsFurnitureContent } from './SettingsFurnitureContent'
import { TaskBarPanel } from './TaskBarPanel'
import { WorkspaceStage } from './WorkspaceStage'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useTaskBar } from '../app/useTaskBar'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import { useArcTableSession } from '../app/useArcTableSession'
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
  applyArcTableTeachingOutcome,
  elapsedLiveMinutes,
  projectArcTableSession,
  projectDayContinuity,
  type ArcTableTeachingOutcome,
  undoFridgeRoundTrip,
  type FridgeRoundTripReceipt,
  type ShiftPersistenceInput,
} from '../planning'
import { projectWeek, type ISODate } from '../calendar'
import { formatMonth, formatPlanHeaderWeekRange } from './dateLabels'
import { ArcTableStudentSurface, ArcTableTeacherMonitor } from './ArcTableSurfaces'
import { WorkspacePanel } from './WorkspacePanel'
import { ArcOnboarding } from './ArcOnboarding'
import { FirstCapturePrompt } from './FirstCapturePrompt'
import { ProgressiveSetupPrompt } from './ProgressiveSetupPrompt'
import { assessSetupCapabilities, loadOnboardingDraft, minimumPlanningSetupEstablished, saveOnboardingDraft, type OnboardingDraft } from '../planning'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const taskBar = useTaskBar(workspace)
  const arcTable = useArcTableSession()
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)
  const [onboardingDraft, setOnboardingDraft] = useState(loadOnboardingDraft)
  const [showFirstCapturePrompt, setShowFirstCapturePrompt] = useState(() => !onboardingDraft.firstCapturePromptDismissed)
  const [workspaceOpenToken, setWorkspaceOpenToken] = useState(0)
  const [workspaceOverlayOpen, setWorkspaceOverlayOpen] = useState(false)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)
  const unscheduledUnits = workspace.unitWorkspace?.units.filter((unit) => unit.placement === null) ?? []
  const setupCapabilities = assessSetupCapabilities({ calendar: workspace.calendar, planning: workspace.planningWorkspace, lessons: workspace.lessonWorkspace })
  const returningTeacher = Boolean(workspace.calendar && workspace.planningWorkspace?.courses.length && workspace.planningWorkspace.sections.length && onboardingDraft.stage === 'welcome')
  const showOnboarding = !returningTeacher && !onboardingDraft.dismissed && !minimumPlanningSetupEstablished(setupCapabilities)

  function updateOnboarding(next: OnboardingDraft) {
    setOnboardingDraft(next)
    saveOnboardingDraft(next)
  }

  useEffect(() => {
    if (!workspace.calendar || !workspace.anchorDate) return
    if (workspace.viewWasPersisted) return
    const preferred = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
    workspace.setActiveView(preferred)
    // Home preference is intentionally applied only when the restored workspace becomes available
    // and the teacher did not already persist an explicit Plan view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(workspace.calendar && workspace.anchorDate)])

  function updateViewPreferences(next: ViewPreferences) {
    setViewPreferences(next)
    saveViewPreferences(next)
  }

  function selectView(view: CalendarView) {
    workspace.setActiveView(view)
    updateViewPreferences(recordLastUsedView(viewPreferences, view))
  }

  function deepenTo(date: ISODate, view: CalendarView) {
    workspace.setActiveView(view, date)
    updateViewPreferences(recordLastUsedView(viewPreferences, view))
  }

  function returnHome() {
    if (workspaceBusy) return
    setWorkspaceOverlayOpen(false)
    workspace.goHome()
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

  function scheduleLessonFromFridge(lessonId: string, plannedDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    const result = moveLessonFromFridge({
      calendar: workspace.calendar,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
      lessonId,
      plannedDate,
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

  function startClass(sectionId: string, lessonId: string) {
    if (!workspace.calendar || !workspace.anchorDate || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const day = projectDayContinuity({
        date: workspace.anchorDate,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState?.overrides ?? [],
      })
      arcTable.start(projectArcTableSession({ day, sectionId, lessonId, calendar: workspace.calendar, liveDate: workspace.anchorDate }))
    } catch (error) {
      workspace.setStorageNotice(error instanceof Error ? error.message : String(error))
    }
  }

  function endClass(outcome: ArcTableTeachingOutcome): string | null {
    if (!arcTable.live || !workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace || !workspace.shiftState) {
      return 'ArcTable cannot end this class because its Arc planning context is unavailable.'
    }
    try {
      const result = applyArcTableTeachingOutcome({
        session: arcTable.live.session,
        liveDate: arcTable.live.session.date,
        calendar: workspace.calendar,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState.overrides,
        outcome,
      })
      const deliveryStates = workspace.lessonWorkspace.deliveryStates.filter((state) => state.lessonId !== result.lessonId || state.sectionId !== result.sectionId)
      const lessons = { ...workspace.lessonWorkspace, deliveryStates: [...deliveryStates, result] }
      workspace.useLessons(lessons, lessons, workspace.shiftState)
      arcTable.finish()
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  if (arcTable.live && arcTable.surface === 'teacher') {
    return <ArcTableTeacherMonitor live={arcTable.live} onOpenPlan={arcTable.showPlan} onShowTeacher={arcTable.showTeacher} onShowStudent={arcTable.showStudent} onUpdate={arcTable.update} onEnd={endClass} />
  }

  if (arcTable.live && arcTable.surface === 'student') {
    return <ArcTableStudentSurface live={arcTable.live} onOpenPlan={arcTable.showPlan} onShowTeacher={arcTable.showTeacher} onShowStudent={arcTable.showStudent} onUpdate={arcTable.update} onEnd={endClass} />
  }

  if (showOnboarding) {
    return <div className="arc-shell onboarding-shell"><a className="skip-link" href="#onboarding-stage">Skip to setup</a><header className="arc-header" aria-label="Arc application header"><div className="arc-wordmark"><img src="/assets/arc/arc-mark.png" alt="Arc" /></div></header><main id="onboarding-stage" className="onboarding-main" tabIndex={-1}><ArcOnboarding draft={onboardingDraft} capabilities={setupCapabilities} calendar={workspace.calendar} calendarInput={workspace.calendarInput} planningInput={workspace.planningInput} onChangeDraft={updateOnboarding} onUseCalendar={workspace.useCalendar} onUseClasses={workspace.useClasses} onLandInDay={() => workspace.setActiveView('Day')} onOpenImport={() => workspaceMode.open('import')} /></main></div>
  }

  const fridgeContent = workspace.calendar && workspaceMode.mode === 'calendar' ? (
    <WorkspacePanel
      captures={workspace.captureWorkspace}
      lessons={workspace.lessonWorkspace?.lessons ?? []}
      units={workspace.unitWorkspace}
      unscheduledUnitTitles={unscheduledUnits.map((unit) => ({ id: unit.id, title: unit.title }))}
      defaultDate={workspace.anchorDate}
      undoAvailable={Boolean(fridgeUndo)}
      onAddCapture={workspace.addCapture}
      onDeleteCapture={workspace.removeCapture}
      onPromoteCapture={workspace.promoteCapture}
      onScheduleLesson={scheduleLessonFromFridge}
      onUnplaceLesson={sendLessonBackToFridge}
      onUndo={undoLastFridgeMove}
      onOpenUnits={() => workspaceMode.open('units')}
      onOpenImport={() => workspaceMode.open('import')}
    />
  ) : <p className="b01-furniture-empty">Workspace is available in Plan View.</p>

  const settingsContent = workspace.calendar && workspaceMode.mode === 'calendar' ? (
    <SettingsFurnitureContent
      preferences={viewPreferences}
      hasTerms={workspace.hasTerms}
      hasClasses={workspace.hasClasses}
      hasUnits={workspace.hasUnits}
      hasLessons={workspace.hasLessons}
      onChangePreferences={updateViewPreferences}
      onOpenCalendarSetup={() => workspaceMode.open('calendar-setup')}
      onOpenTerms={() => workspaceMode.open('terms')}
      onOpenClasses={() => workspaceMode.open('classes')}
      onOpenTeachingDay={() => workspaceMode.open('teaching-day')}
      onOpenImport={() => workspaceMode.open('import')}
      onOpenUnits={() => workspaceMode.open('units')}
      onOpenLessons={() => workspaceMode.open('lessons')}
    />
  ) : <p className="b01-furniture-empty">Settings are available from the planner.</p>

  const taskContent = taskBar.workspace ? (
    <TaskBarPanel
      workspace={taskBar.workspace}
      onAdd={taskBar.add}
      onRename={taskBar.rename}
      onMove={taskBar.move}
      onSetImportant={taskBar.setImportant}
      onSetCompleted={taskBar.setCompleted}
      onDelete={taskBar.delete}
    />
  ) : <p className="b01-furniture-empty">Tasks become available after the school calendar is set.</p>

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button className="arc-wordmark" type="button" aria-label="Return to Teaching Day" onClick={returnHome}><img src="/assets/arc/arc-mark.png" alt="Arc" /></button>
        <div className="arc-header-space" aria-hidden="true" />
        {arcTable.live ? <button type="button" className="arc-live-return" onClick={arcTable.showTeacher}><span>{arcTable.live.session.sectionName} live · {elapsedLiveMinutes(arcTable.live)} min</span><strong>Return to ArcTable</strong></button> : null}
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
            settings={settingsContent}
            workspace={fridgeContent}
            tasks={taskContent}
            dismissSideDrawers={workspaceMode.mode !== 'calendar'}
            openRequest={workspaceOpenToken ? { name: 'workspace', token: workspaceOpenToken } : null}
            workspaceOpen={workspaceOverlayOpen}
            onWorkspaceOpenChange={setWorkspaceOverlayOpen}
          >
            <section className="calendar-canvas" aria-label={`${stageTitle} workspace`}>
              {workspaceMode.mode === 'calendar' ? <ProgressiveSetupPrompt capabilities={setupCapabilities} onOpenTeachingDay={() => workspaceMode.open('teaching-day')} onOpenImport={() => workspaceMode.open('import')} /> : null}
              {workspaceMode.mode === 'calendar' && minimumPlanningSetupEstablished(setupCapabilities) && showFirstCapturePrompt && !onboardingDraft.firstCapturePromptDismissed ? <FirstCapturePrompt onSave={workspace.addCapture} onPlace={() => { setShowFirstCapturePrompt(false); updateOnboarding({ ...onboardingDraft, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }); setWorkspaceOpenToken((token) => token + 1) }} onDismiss={() => { setShowFirstCapturePrompt(false); updateOnboarding({ ...onboardingDraft, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }) }} /> : null}
              {workspaceMode.mode === 'calendar' && workspace.calendar && workspace.anchorDate ? (
                <PlanStateHeader
                  view={workspace.activeView}
                  viewLabel={workspace.activeView === 'Day' ? 'Teaching Day' : workspace.activeView}
                  focus={workspace.planContext?.focus ?? 'day'}
                  date={workspace.anchorDate}
                  weekRange={weekRangeLabel(workspace, viewPreferences.showWeekends)}
                  monthLabel={monthLabel(workspace)}
                  courseId={workspace.planContext?.courseId}
                  sectionId={workspace.planContext?.sectionId}
                  lessonId={workspace.planContext?.lessonId}
                  courseTitle={headerCourseTitle(workspace)}
                  sectionName={headerSectionName(workspace)}
                  unitTitle={headerUnitTitle(workspace)}
                  lessonTitle={headerLessonTitle(workspace)}
                  blockLabel={headerBlock(workspace)?.label}
                  blockType={headerBlock(workspace)?.type ?? null}
                  overlay={workspaceOverlayOpen ? 'workspace' : null}
                />
              ) : null}
              <WorkspaceStage
                mode={workspaceMode.mode}
                activeView={workspace.activeView}
                showWeekends={viewPreferences.showWeekends}
                calendar={workspace.calendar}
                calendarInput={workspace.calendarInput}
                anchorDate={workspace.anchorDate}
                planContext={workspace.planContext}
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
                onUseCurriculumImport={workspace.useCurriculumImport}
                onApplyRecoveryShift={workspace.applyRecoveryShift}
                onStartClass={startClass}
                onSelectDate={deepenTo}
                onSelectTeachingBlock={workspace.selectTeachingBlock}
                onSelectLesson={workspace.selectLesson}
                onRetreatPlanFocus={workspace.retreatFocus}
                onOpenWorkspace={() => setWorkspaceOverlayOpen(true)}
                onAddNote={workspace.addCalendarNote}
                onDeleteNote={workspace.deleteCalendarNote}
                onCloseMode={workspaceMode.close}
                onOpenMode={workspaceMode.open}
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
  if (mode === 'classes') return 'Courses & sections'
  if (mode === 'teaching-day') return 'Teaching day'
  if (mode === 'import') return 'Import curriculum'
  if (mode === 'units') return 'Units'
  if (mode === 'lessons') return 'Lessons'
  if (mode === 'calendar-setup') return 'Calendar'
  return activeView
}

function headerCourseTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.courseId
  return id ? workspace.planningWorkspace?.courses.find((course) => course.id === id)?.title ?? null : null
}

function headerSectionName(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.sectionId
  return id ? workspace.planningWorkspace?.sections.find((section) => section.id === id)?.name ?? null : null
}

function headerUnitTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.unitId
  return id ? workspace.unitWorkspace?.units.find((unit) => unit.id === id)?.title ?? null : null
}

function headerLessonTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.lessonId
  return id ? workspace.lessonWorkspace?.lessons.find((lesson) => lesson.id === id)?.title ?? null : null
}

function headerBlock(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.teachingBlockId
  if (!id) return null
  return workspace.planningWorkspace?.teachingDay?.blocks.find((block) => block.id === id) ?? null
}

function weekRangeLabel(workspace: ReturnType<typeof useArcWorkspace>, showWeekends: boolean) {
  if (workspace.activeView !== 'Week' || !workspace.calendar || !workspace.anchorDate) return null
  const projection = projectWeek(workspace.calendar, workspace.anchorDate)
  const days = showWeekends ? projection.days : projection.days.filter((day) => !day.isWeekend)
  const start = days[0]?.date ?? projection.startDate
  const end = days[days.length - 1]?.date ?? projection.endDate
  return formatPlanHeaderWeekRange(start, end)
}

function monthLabel(workspace: ReturnType<typeof useArcWorkspace>) {
  if (workspace.activeView !== 'Month' || !workspace.anchorDate) return null
  return formatMonth(workspace.anchorDate)
}
