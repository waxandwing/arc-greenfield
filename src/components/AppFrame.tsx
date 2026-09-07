import { useEffect, useState } from 'react'
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

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(loadViewPreferences)

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
    if (!saveViewPreferences(next)) {
      // The workspace remains usable if browser storage is unavailable; the preference simply stays session-local.
    }
  }

  function selectView(view: CalendarView) {
    workspace.setActiveView(view)
    updateViewPreferences(recordLastUsedView(viewPreferences, view))
  }

  function returnHome() {
    if (workspaceBusy) return
    workspace.setActiveView(resolveAvailableHomeView(viewPreferences, workspace.viewAvailability))
  }

  const homeView = resolveAvailableHomeView(viewPreferences, workspace.viewAvailability)

  return (
    <div className="arc-shell">
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
            hasTerms={workspace.hasTerms}
            hasClasses={workspace.hasClasses}
            hasUnits={workspace.hasUnits}
            hasLessons={workspace.hasLessons}
            recoveryCount={workspace.recoveryCount}
            undoAvailable={Boolean(workspace.shiftState?.undo)}
            stageTitle={stageTitle}
            viewSelectionDisabled={workspaceBusy}
            availabilityFor={workspace.viewAvailability}
            onSelectView={selectView}
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

          {workspace.calendar && workspaceMode.mode === 'calendar' && (
            <CalendarViewPreferences preferences={viewPreferences} onChange={updateViewPreferences} />
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
            />
          </section>
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
