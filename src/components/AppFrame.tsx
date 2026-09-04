import { useState } from 'react'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewRail } from './CalendarViewRail'
import { FridgeDoorPanel } from './FridgeDoorPanel'
import { ObjectFocusLayer, type ObjectFocusState } from './ObjectFocusLayer'
import { WorkspaceStage } from './WorkspaceStage'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useFridgeDoorWorkspace } from '../app/useFridgeDoorWorkspace'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import { DEFAULT_HOME_VIEW } from '../navigation/calendarViews'
import { hydrateLessonWorkspace, hydrateUnitWorkspace, type LessonWorkspaceInput, type UnitWorkspaceInput } from '../planning'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const fridge = useFridgeDoorWorkspace({
    calendarId: workspace.calendar?.id ?? null,
    units: workspace.unitWorkspace,
    lessons: workspace.lessonWorkspace,
    overrides: workspace.shiftState?.overrides ?? [],
  })
  const [focus, setFocus] = useState<ObjectFocusState | null>(null)

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)
  const canUseObjectFocus = Boolean(workspace.calendar && workspace.planningWorkspace && workspace.unitWorkspace && workspace.lessonWorkspace)

  function openWorkspaceMode(mode: Parameters<typeof workspaceMode.open>[0]) {
    setFocus(null)
    workspaceMode.open(mode)
  }

  function editUnitTitle(unitId: string, title: string): string | null {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace) return 'Arc cannot edit this Unit because the planning state is incomplete. Nothing changed.'
    try {
      const input: UnitWorkspaceInput = {
        calendarId: workspace.unitWorkspace.calendarId,
        units: workspace.unitWorkspace.units.map((unit) => unit.id === unitId ? { ...unit, title: title.trim() } : unit),
      }
      const next = hydrateUnitWorkspace(input, workspace.calendar, workspace.planningWorkspace)
      workspace.useUnits(input, next)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function editLessonTitle(lessonId: string, title: string): string | null {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return 'Arc cannot edit this Lesson because the planning state is incomplete. Nothing changed.'
    try {
      const input: LessonWorkspaceInput = {
        calendarId: workspace.lessonWorkspace.calendarId,
        lessons: workspace.lessonWorkspace.lessons.map((lesson) => lesson.id === lessonId ? { ...lesson, title: title.trim() } : lesson),
        deliveryStates: workspace.lessonWorkspace.deliveryStates,
      }
      const next = hydrateLessonWorkspace(input, workspace.calendar, workspace.planningWorkspace, workspace.unitWorkspace)
      workspace.useLessons(input, next)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

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
          onSelect={(view) => {
            setFocus(null)
            workspace.setActiveView(view)
          }}
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
            recoveryCount={workspace.recoveryCount}
            undoAvailable={Boolean(workspace.shiftState?.undo)}
            stageTitle={stageTitle}
            onMovePrevious={() => workspace.movePeriod('previous')}
            onMoveNext={() => workspace.movePeriod('next')}
            onToday={workspace.goToday}
            onOpenCalendarSetup={() => openWorkspaceMode('calendar-setup')}
            onOpenTerms={() => openWorkspaceMode('terms')}
            onOpenClasses={() => openWorkspaceMode('classes')}
            onOpenUnits={() => openWorkspaceMode('units')}
            onOpenLessons={() => openWorkspaceMode('lessons')}
            onOpenRecovery={() => openWorkspaceMode('recovery')}
            onUndoShift={workspace.undoLastShift}
          />

          {workspace.storageNotice && <p className="storage-notice" role="status">{workspace.storageNotice}</p>}

          {workspaceMode.mode === 'calendar' && workspace.unitWorkspace && workspace.lessonWorkspace ? (
            <FridgeDoorPanel
              state={fridge.state}
              units={workspace.unitWorkspace}
              lessons={workspace.lessonWorkspace}
              notice={fridge.notice}
              onCreateMagnet={fridge.createLooseMagnet}
              onReposition={fridge.reposition}
              onSetPriority={fridge.setPriority}
              onPutAway={fridge.putAwayItem}
              onBringBack={fridge.bringBackItem}
              onOpenUnit={(unitId) => setFocus({ kind: 'unit', unitId })}
              onOpenLesson={(lessonId) => setFocus({ kind: 'lesson', lessonId })}
            />
          ) : null}

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
              protectedSectionIds={workspace.protectedSectionIds}
              onUseCalendar={workspace.useCalendar}
              onUseTerms={workspace.useTerms}
              onUseClasses={workspace.useClasses}
              onUseUnits={workspace.useUnits}
              onUseLessons={workspace.useLessons}
              onApplyRecoveryShift={workspace.applyRecoveryShift}
              onOpenUnit={(unitId) => setFocus({ kind: 'unit', unitId })}
              onOpenLesson={(unitId, lessonId) => setFocus({ kind: 'unit', unitId, lessonId })}
              onCloseMode={workspaceMode.close}
            />
          </section>
        </main>

        {focus && canUseObjectFocus && workspace.calendar && workspace.planningWorkspace && workspace.unitWorkspace && workspace.lessonWorkspace ? (
          <ObjectFocusLayer
            focus={focus}
            calendar={workspace.calendar}
            planning={workspace.planningWorkspace}
            units={workspace.unitWorkspace}
            lessons={workspace.lessonWorkspace}
            shiftState={workspace.shiftState}
            onChangeFocus={setFocus}
            onClose={() => setFocus(null)}
            onMoveUnit={workspace.moveUnitObject}
            onUnplaceUnit={workspace.unplaceUnitObject}
            onDeleteUnit={workspace.deleteUnitObject}
            onMoveLesson={workspace.moveLessonObject}
            onUnplaceLesson={workspace.unplaceLessonObject}
            onDeleteLesson={workspace.deleteLessonObject}
            onEditUnitTitle={editUnitTitle}
            onEditLessonTitle={editLessonTitle}
          />
        ) : null}
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
