import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewRail } from './CalendarViewRail'
import { WorkspaceStage } from './WorkspaceStage'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import { DEFAULT_HOME_VIEW } from '../navigation/calendarViews'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button
          className="arc-wordmark"
          type="button"
          aria-label={`Return to ${DEFAULT_HOME_VIEW} view`}
          onClick={() => {
            if (!workspaceBusy) workspace.setActiveView(DEFAULT_HOME_VIEW)
          }}
        >
          arc
        </button>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <div className="arc-layout">
        <CalendarViewRail
          activeView={workspace.activeView}
          disabled={workspaceBusy}
          availabilityFor={workspace.viewAvailability}
          onSelect={workspace.setActiveView}
        />

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

        <div className="arc-overlay-layer" aria-hidden="true" />
      </div>
    </div>
  )
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
