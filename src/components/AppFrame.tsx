import { useEffect, useState, type DragEvent } from 'react'
import { CalendarStageHeader } from './CalendarStageHeader'
import { CalendarViewRail } from './CalendarViewRail'
import { FridgeDoorPanel } from './FridgeDoorPanel'
import { ObjectFocusLayer, type ObjectFocusState } from './ObjectFocusLayer'
import { WorkspaceStage } from './WorkspaceStage'
import { buildFridgeLessonCapture, buildFridgeUnitCapture } from '../app/fridgeCapture'
import {
  loadReversibleActionSlot,
  saveReversibleActionSlot,
  type ReversibleAction,
  type ReversibleActionSlot,
} from '../app/reversibleActionPersistence'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useFridgeDoorWorkspace } from '../app/useFridgeDoorWorkspace'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import type { ISODate } from '../calendar'
import { DEFAULT_HOME_VIEW } from '../navigation/calendarViews'
import {
  hydrateLessonWorkspace,
  hydrateUnitWorkspace,
  moveLesson,
  type FridgeDoorState,
  type LessonWorkspaceInput,
  type UnitWorkspaceInput,
} from '../planning'

export type DragPreviewState =
  | { kind: 'lesson'; lessonId: string; entityRef: `lesson:${string}` }
  | { kind: 'magnet'; entityRef: `magnet:${string}` }
  | { kind: 'stack'; stackId: string }
  | null

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
  const [dragPreview, setDragPreview] = useState<DragPreviewState>(null)
  const [undoSlot, setUndoSlot] = useState<ReversibleActionSlot>(() => loadReversibleActionSlot(workspace.calendar?.id ?? null))
  const [transactionNotice, setTransactionNotice] = useState<string | null>(null)

  useEffect(() => {
    setUndoSlot(loadReversibleActionSlot(workspace.calendar?.id ?? null))
  }, [workspace.calendar?.id])

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const stageTitle = stageTitleFor(workspaceMode.mode, workspace.activeView)
  const canUseObjectFocus = Boolean(workspace.calendar && workspace.planningWorkspace && workspace.unitWorkspace && workspace.lessonWorkspace)
  const undoLabel = undoLabelFor(undoSlot.action, Boolean(workspace.shiftState?.undo), undoSlot.supersedesShift)

  function saveUndoSlot(action: ReversibleAction | null, supersedesShift: boolean): boolean {
    const next = { action, supersedesShift }
    setUndoSlot(next)
    if (!workspace.calendar) return false
    return saveReversibleActionSlot(workspace.calendar.id, next)
  }

  function openWorkspaceMode(mode: Parameters<typeof workspaceMode.open>[0]) {
    setFocus(null)
    setDragPreview(null)
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

  function captureUnit(title: string, courseId: string): string | null {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) {
      return 'Arc cannot create this Unit because planning state is incomplete. Nothing changed.'
    }
    try {
      const result = buildFridgeUnitCapture({
        calendar: workspace.calendar,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        courseId,
        title,
      })
      workspace.useUnits(result.persistence, result.workspace)
      return fridge.placeCanonicalEntity(`unit:${result.unit.id}`, result.workspace, workspace.lessonWorkspace)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function captureLesson(title: string, unitId: string): string | null {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) {
      return 'Arc cannot create this Lesson because planning state is incomplete. Nothing changed.'
    }
    try {
      const result = buildFridgeLessonCapture({
        calendar: workspace.calendar,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        unitId,
        title,
      })
      workspace.useLessons(result.persistence, result.workspace)
      return fridge.placeCanonicalEntity(`lesson:${result.lesson.id}`, workspace.unitWorkspace, result.workspace)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function runReversibleFridgeAction(label: string, action: () => string | null): string | null {
    const beforeFridge = cloneFridgeState(fridge.state)
    const result = action()
    if (result) return result
    const persisted = saveUndoSlot({ kind: 'fridge', label, beforeFridge }, true)
    setTransactionNotice(persisted
      ? `${label} complete. Undo is available.`
      : `${label} complete. Undo is available for this session, but Arc could not save the Undo record in this browser.`)
    return null
  }

  function moveLessonWithFridge(lessonId: string, plannedDate: ISODate): string | null {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) {
      return 'Arc cannot move this Lesson because the planning state is incomplete. Nothing changed.'
    }
    const lesson = workspace.lessonWorkspace.lessons.find((candidate) => candidate.id === lessonId)
    if (!lesson) return 'That Lesson is no longer available. Nothing changed.'

    const beforeFridge = cloneFridgeState(fridge.state)
    try {
      const nextLessons = moveLesson({
        calendar: workspace.calendar,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState?.overrides ?? [],
        lessonId,
        plannedDate,
      })
      const fridgeResult = fridge.removeReferenceWithCanonical(`lesson:${lessonId}`, workspace.unitWorkspace, nextLessons)
      if (fridgeResult) return fridgeResult

      const moveResult = workspace.moveLessonObject(lessonId, plannedDate)
      if (moveResult) {
        const rollback = fridge.restoreExactState(beforeFridge)
        return rollback ? `${moveResult} Arc also could not restore the prior Fridge placement: ${rollback}` : moveResult
      }

      const persisted = saveUndoSlot({ kind: 'lesson-move', lessonId, previousDate: lesson.plannedDate, beforeFridge }, true)
      setTransactionNotice(persisted
        ? 'Lesson moved. Its Fridge placement was removed. Undo is available.'
        : 'Lesson moved and its Fridge placement was removed. Undo is available for this session, but Arc could not save the Undo record in this browser.')
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function undoLastAction() {
    setTransactionNotice(null)
    const lastAction = undoSlot.action
    if (lastAction?.kind === 'shift') {
      workspace.undoLastShift()
      return
    }
    if (lastAction?.kind === 'fridge') {
      const result = fridge.restoreExactState(lastAction.beforeFridge)
      if (result) {
        setTransactionNotice(`Undo is blocked. ${result}`)
        return
      }
      const persisted = saveUndoSlot(null, true)
      setTransactionNotice(persisted
        ? `Undid ${lastAction.label}.`
        : `Undid ${lastAction.label}, but Arc could not save the updated Undo state in this browser.`)
      return
    }
    if (lastAction?.kind === 'lesson-move') {
      const currentFridge = cloneFridgeState(fridge.state)
      const fridgeResult = fridge.restoreExactState(lastAction.beforeFridge)
      if (fridgeResult) {
        setTransactionNotice(`Undo is blocked. ${fridgeResult}`)
        return
      }
      const moveResult = lastAction.previousDate
        ? workspace.moveLessonObject(lastAction.lessonId, lastAction.previousDate)
        : workspace.unplaceLessonObject(lastAction.lessonId)
      if (moveResult) {
        const rollback = fridge.restoreExactState(currentFridge)
        setTransactionNotice(rollback
          ? `Undo failed and Arc could not fully restore the current Fridge state. ${moveResult} ${rollback}`
          : `Undo is blocked. ${moveResult}`)
        return
      }
      const persisted = saveUndoSlot(null, true)
      setTransactionNotice(persisted
        ? 'Undid Lesson move and restored its prior Fridge placement.'
        : 'Undid Lesson move and restored its prior Fridge placement, but Arc could not save the updated Undo state in this browser.')
      return
    }
    if (!undoSlot.supersedesShift && workspace.shiftState?.undo) workspace.undoLastShift()
  }

  function applyRecoveryShiftWithUndo(operation: Parameters<typeof workspace.applyRecoveryShift>[0]): string | null {
    const result = workspace.applyRecoveryShift(operation)
    if (!result) {
      saveUndoSlot({ kind: 'shift' }, false)
      setTransactionNotice(null)
    }
    return result
  }

  function canAcceptDrop(target: EventTarget | null): boolean {
    if (!dragPreview || !(target instanceof Element)) return false
    if (dragPreview.kind === 'lesson' && target.closest('[data-drag-date-target]')) return true
    if (target.closest('[data-fridge-drag-target]')) return true
    return dragPreview.kind !== 'stack' && Boolean(target.closest('[data-fridge-stack-target]'))
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (canAcceptDrop(event.target)) event.preventDefault()
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!dragPreview || !(event.target instanceof Element)) return
    const dateTarget = event.target.closest<HTMLElement>('[data-drag-date-target]')
    const fridgeTarget = event.target.closest<HTMLElement>('[data-fridge-drag-target]')
    const stackTarget = event.target.closest<HTMLElement>('[data-fridge-stack-target]')
    if (!dateTarget && !fridgeTarget && !stackTarget) return
    event.preventDefault()

    let result: string | null = null
    if (dateTarget && dragPreview.kind === 'lesson') {
      const date = dateTarget.dataset.dragDateTarget as ISODate | undefined
      if (date) result = moveLessonWithFridge(dragPreview.lessonId, date)
    } else if (fridgeTarget) {
      const raw = fridgeTarget.dataset.fridgeDragTarget
      if (raw) {
        const [row, column] = raw.split(':').map(Number)
        if (dragPreview.kind === 'stack') {
          result = runReversibleFridgeAction('Fridge stack move', () => fridge.repositionStack(dragPreview.stackId, row, column))
        } else {
          result = runReversibleFridgeAction('Fridge move', () => fridge.reposition(dragPreview.entityRef, row, column))
        }
      }
    } else if (stackTarget && dragPreview.kind !== 'stack') {
      const stackId = stackTarget.dataset.fridgeStackTarget
      const anchor = stackId
        ? fridge.state.placements
          .filter((item) => item.stackId === stackId)
          .sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0))[0]
        : undefined
      if (anchor) result = runReversibleFridgeAction('Fridge stack change', () => fridge.stackItem(anchor.entityRef, dragPreview.entityRef))
    }

    if (result) setTransactionNotice(result)
    setDragPreview(null)
  }

  return (
    <div className={`arc-shell${dragPreview ? ' arc-shell--drag-preview' : ''}`}>
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
            setDragPreview(null)
            workspace.setActiveView(view)
          }}
        />

        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1} onDragOver={handleDragOver} onDrop={handleDrop}>
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
            undoLabel={undoLabel}
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
            onUndo={undoLastAction}
          />

          {workspace.storageNotice && <p className="storage-notice" role="status">{workspace.storageNotice}</p>}
          {transactionNotice && <p className="storage-notice" role="status">{transactionNotice}</p>}
          {dragPreview ? (
            <p className="drag-preview-status" role="status">
              {dragPreview.kind === 'lesson'
                ? 'Drop on a highlighted instructional date to schedule this Lesson, or on a highlighted Fridge target to reorganize it. Undo will be available.'
                : dragPreview.kind === 'magnet'
                  ? 'Drop on a highlighted Fridge position or compatible stack. Undo will be available.'
                  : 'Drop the stack on a highlighted Fridge position. Undo will be available.'}
            </p>
          ) : null}

          {workspaceMode.mode === 'calendar' && workspace.planningWorkspace && workspace.unitWorkspace && workspace.lessonWorkspace ? (
            <FridgeDoorPanel
              state={fridge.state}
              planning={workspace.planningWorkspace}
              units={workspace.unitWorkspace}
              lessons={workspace.lessonWorkspace}
              notice={fridge.notice}
              dragPreview={dragPreview}
              onDragPreviewChange={setDragPreview}
              onCreateMagnet={fridge.createLooseMagnet}
              onCreateUnit={captureUnit}
              onCreateLesson={captureLesson}
              onReposition={(ref, row, column) => runReversibleFridgeAction('Fridge move', () => fridge.reposition(ref, row, column))}
              onStack={(anchor, member) => runReversibleFridgeAction('Fridge stack change', () => fridge.stackItem(anchor, member))}
              onReorderStack={fridge.reorderStackItem}
              onRepositionStack={(stackId, row, column) => runReversibleFridgeAction('Fridge stack move', () => fridge.repositionStack(stackId, row, column))}
              onUnstack={fridge.unstackItem}
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
              dragLessonId={dragPreview?.kind === 'lesson' ? dragPreview.lessonId : undefined}
              protectedCourseIds={workspace.protectedCourseIds}
              protectedSectionIds={workspace.protectedSectionIds}
              onUseCalendar={workspace.useCalendar}
              onUseTerms={workspace.useTerms}
              onUseClasses={workspace.useClasses}
              onUseUnits={workspace.useUnits}
              onUseLessons={workspace.useLessons}
              onApplyRecoveryShift={applyRecoveryShiftWithUndo}
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
            onMoveLesson={moveLessonWithFridge}
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

function cloneFridgeState(state: FridgeDoorState): FridgeDoorState {
  return {
    magnets: state.magnets.map((item) => ({ ...item })),
    placements: state.placements.map((item) => ({ ...item })),
  }
}

function undoLabelFor(lastAction: ReversibleAction | null, shiftUndoAvailable: boolean, shiftUndoSuperseded: boolean): string | null {
  if (lastAction?.kind === 'shift') return shiftUndoAvailable ? 'Undo last Shift' : null
  if (lastAction?.kind === 'lesson-move') return 'Undo Lesson move'
  if (lastAction?.kind === 'fridge') return `Undo ${lastAction.label}`
  if (!shiftUndoSuperseded && shiftUndoAvailable) return 'Undo last Shift'
  return null
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
