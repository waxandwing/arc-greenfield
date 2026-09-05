import { useEffect, useRef, useState } from 'react'
import { currentLocalISODate } from '../calendar'
import { projectDayContinuity } from '../planning/dayContinuityProjection'
import { applyLiveTeachingOutcome, type LiveTeachingOutcome } from '../planning/liveTeachingOutcome'
import { projectLiveClassroomSession, type LiveClassroomSession } from '../planning/liveSessionProjection'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewTabs } from './CalendarViewTabs'
import { LiveClassroomStage } from './LiveClassroomStage'
import { SettingsEdgeDrawer } from './SettingsEdgeDrawer'
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

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [liveSession, setLiveSession] = useState<LiveClassroomSession | null>(null)
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null)
  const settingsTabRef = useRef<HTMLButtonElement | null>(null)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)

  useEffect(() => {
    if (!workspace.calendar || !workspace.anchorDate) return
    const preferred = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
    workspace.setActiveView(preferred)
    // Home preference is intentionally applied only when the restored workspace becomes available.
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

  function returnHome() {
    if (workspaceBusy) return
    selectView(resolveAvailableHomeView(viewPreferences, workspace.viewAvailability))
  }

  function closeSettings() {
    setSettingsOpen(false)
    window.requestAnimationFrame(() => settingsTabRef.current?.focus())
  }

  function openSetup(mode: Parameters<typeof workspaceMode.open>[0]) {
    closeSettings()
    workspaceMode.open(mode)
  }

  function launchLive(sectionId: string, lessonId: string) {
    if (!workspace.calendar || !workspace.anchorDate || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const day = projectDayContinuity({
        date: workspace.anchorDate,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState?.overrides ?? [],
      })
      const session = projectLiveClassroomSession({
        day,
        sectionId,
        lessonId,
        calendar: workspace.calendar,
        liveDate: currentLocalISODate(),
      })
      setInteractionNotice(null)
      setLiveSession(session)
    } catch (error) {
      setInteractionNotice(error instanceof Error ? error.message : String(error))
    }
  }

  function recordLiveOutcome(outcome: LiveTeachingOutcome) {
    if (!liveSession || !workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace || !workspace.shiftState) return
    try {
      const nextState = applyLiveTeachingOutcome({
        session: liveSession,
        liveDate: currentLocalISODate(),
        calendar: workspace.calendar,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState.overrides,
        outcome,
      })
      const nextLessons = {
        ...workspace.lessonWorkspace,
        deliveryStates: [
          ...workspace.lessonWorkspace.deliveryStates.filter((state) => !(state.lessonId === nextState.lessonId && state.sectionId === nextState.sectionId)),
          nextState,
        ],
      }
      workspace.useLessons(nextLessons, nextLessons, workspace.shiftState)
      setLiveSession(null)
      selectView('Day')
    } catch (error) {
      setInteractionNotice(error instanceof Error ? error.message : String(error))
      setLiveSession(null)
      selectView('Day')
    }
  }

  const homeView = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)
  const liveAvailable = workspace.activeView === 'Day'
    && workspace.anchorDate === currentLocalISODate()
    && workspaceMode.mode === 'calendar'

  return (
    <div className="arc-shell arc-shell--founder-reconciled">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button
          className="arc-wordmark"
          type="button"
          aria-label={`Return to ${homeView} view`}
          onClick={returnHome}
        >
          arc
        </button>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <div className="arc-planner-wall">
        <button
          ref={settingsTabRef}
          type="button"
          className="settings-edge-tab"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </button>

        <SettingsEdgeDrawer
          open={settingsOpen}
          preferences={viewPreferences}
          hasTerms={workspace.hasTerms}
          hasClasses={workspace.hasClasses}
          hasUnits={workspace.hasUnits}
          hasLessons={workspace.hasLessons}
          recoveryCount={workspace.recoveryCount}
          undoAvailable={Boolean(workspace.shiftState?.undo)}
          onChangePreferences={updateViewPreferences}
          onClose={closeSettings}
          onOpenCalendarSetup={() => openSetup('calendar-setup')}
          onOpenTerms={() => openSetup('terms')}
          onOpenCoursesSections={() => openSetup('classes')}
          onOpenUnits={() => openSetup('units')}
          onOpenLessons={() => openSetup('lessons')}
          onOpenRecovery={() => openSetup('recovery')}
          onUndoShift={() => {
            workspace.undoLastShift()
            closeSettings()
          }}
        />

        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          {liveSession ? (
            <LiveClassroomStage
              session={liveSession}
              onOutcome={recordLiveOutcome}
              onLeave={() => {
                setLiveSession(null)
                selectView('Day')
              }}
            />
          ) : (
            <>
              <CalendarStageHeader
                activeView={workspace.activeView}
                mode={workspaceMode.mode}
                calendar={workspace.calendar}
                anchorDate={workspace.anchorDate}
                previousTarget={workspace.previousTarget}
                nextTarget={workspace.nextTarget}
                todayTarget={workspace.todayTarget}
                stageTitle={stageTitle}
                onMovePrevious={() => workspace.movePeriod('previous')}
                onMoveNext={() => workspace.movePeriod('next')}
                onToday={workspace.goToday}
              />

              {workspaceMode.mode === 'calendar' && (
                <CalendarViewTabs
                  activeView={workspace.activeView}
                  disabled={workspaceBusy}
                  availabilityFor={workspace.viewAvailability}
                  onSelect={selectView}
                />
              )}

              {interactionNotice && (
                <div className="storage-notice" role="alert">
                  <span>{interactionNotice}</span>
                  <button type="button" className="text-button" onClick={() => setInteractionNotice(null)}>Dismiss</button>
                </div>
              )}
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
                  onLaunchLive={liveAvailable ? launchLive : undefined}
                />
              </section>
            </>
          )}
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
  if (mode === 'classes') return 'Courses & Sections'
  if (mode === 'units') return 'Units'
  if (mode === 'lessons') return 'Lessons'
  if (mode === 'calendar-setup') return 'Calendar'
  return activeView
}
