import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import type { ISODate } from '../calendar'
import type { CaptureWorkspace, Lesson, PlanningCapture, UnitWorkspace } from '../planning'
import type { ObjectStack, StackWorkspace } from '../planning/stacks'
import { trayRowsForCaptures } from '../planning/stacks'
import {
  STACK_DWELL_MS,
  TRAY_CAPTURE_DRAG_MIME,
  TRAY_STACK_DRAG_MIME,
  encodeTrayCaptureDrag,
  encodeTrayStackDrag,
  hasTrayCaptureDrag,
  readTrayCaptureDrag,
} from '../planning/deskDrag'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, promptMoveToDate, type ArcObjectMenuItem } from './ArcObjectMenu'

type Props = {
  captures: CaptureWorkspace | null
  lessons: Lesson[]
  units: UnitWorkspace | null
  unscheduledUnitTitles: Array<{ id: string; title: string }>
  defaultDate: ISODate | null
  undoAvailable: boolean
  stackWorkspace: StackWorkspace | null
  onAddCapture: (text: string) => string | null
  onDeleteCapture: (captureId: string) => void
  onSetCaptureImportant?: (captureId: string, important: boolean) => boolean
  onMoveCaptureToDate?: (captureId: string, anchorDate: ISODate | null) => boolean
  onPromoteCapture: (captureId: string, unitId: string, plannedDate: ISODate | null) => boolean
  onScheduleLesson: (lessonId: string, date: ISODate) => void
  onUnplaceLesson: (lessonId: string) => void
  onUndo: () => void
  onOpenUnits: () => void
  onOpenImport: () => void
  onCombineCaptures: (targetCaptureId: string, incomingCaptureId: string) => void
  onRemoveCaptureFromStack: (stackId: string, captureId: string) => void
  onUnstack: (stackId: string) => void
  onReorderStackMember: (stackId: string, captureId: string, toIndex: number) => void
  planningDragDisabled?: boolean
}

export function WorkspacePanel(props: Props) {
  const [date, setDate] = useState(props.defaultDate ?? '')
  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(null)
  const [expandedStackId, setExpandedStackId] = useState<string | null>(null)
  const [draggingCaptureId, setDraggingCaptureId] = useState<string | null>(null)
  const [dwellTargetId, setDwellTargetId] = useState<string | null>(null)
  const dwellTimer = useRef<number | null>(null)
  const unscheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate === null)
  const scheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate !== null)
  const captureCount = props.captures?.captures.length ?? 0
  const captureById = useMemo(() => {
    const map = new Map<string, PlanningCapture>()
    props.captures?.captures.forEach((capture) => map.set(capture.id, capture))
    return map
  }, [props.captures?.captures])

  const trayRows = useMemo(() => {
    if (!props.stackWorkspace) {
      return props.captures?.captures.map((capture) => ({ kind: 'single' as const, memberId: capture.id })) ?? []
    }
    return trayRowsForCaptures(props.stackWorkspace, props.captures?.captures.map((capture) => capture.id) ?? [])
  }, [props.captures?.captures, props.stackWorkspace])

  useEffect(() => () => {
    if (dwellTimer.current !== null) window.clearTimeout(dwellTimer.current)
  }, [])

  function clearDwell() {
    if (dwellTimer.current !== null) {
      window.clearTimeout(dwellTimer.current)
      dwellTimer.current = null
    }
    setDwellTargetId(null)
  }

  function scheduleStackDwell(targetCaptureId: string) {
    if (!draggingCaptureId || draggingCaptureId === targetCaptureId || props.planningDragDisabled) return
    if (dwellTargetId === targetCaptureId) return
    clearDwell()
    setDwellTargetId(targetCaptureId)
    dwellTimer.current = window.setTimeout(() => {
      props.onCombineCaptures(targetCaptureId, draggingCaptureId)
      clearDwell()
      setDraggingCaptureId(null)
    }, STACK_DWELL_MS)
  }

  function acceptTrayReturnDrop(event: DragEvent) {
    if (!props.onMoveCaptureToDate || props.planningDragDisabled) return
    if (!hasTrayCaptureDrag(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleTrayReturnDrop(event: DragEvent) {
    if (!props.onMoveCaptureToDate || props.planningDragDisabled) return
    const payload = readTrayCaptureDrag(event.dataTransfer)
    if (!payload) return
    event.preventDefault()
    props.onMoveCaptureToDate(payload.captureId, null)
  }

  return (
    <div
      className="b01-fridge-content b01-fridge-content--repair-pass-3 b01-tray-content"
      data-drag-target="TRAY"
      data-testid="tray-drop-surface"
      onDragOver={acceptTrayReturnDrop}
      onDrop={handleTrayReturnDrop}
    >
      <section aria-labelledby="workspace-captures-heading" className="workspace-captures-primary">
        <div className="workspace-captures-heading-row">
          <h2 id="workspace-captures-heading">Tray</h2>
          {captureCount > 0 ? <span className="workspace-capture-count">{captureCount}</span> : null}
        </div>
        {captureCount === 0 ? (
          <p className="b01-furniture-empty">Nothing waiting. Use + Capture from any planner view.</p>
        ) : (
          trayRows.map((row) => {
            if (row.kind === 'single') {
              const capture = captureById.get(row.memberId)
              if (!capture) return null
              return (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  units={props.units}
                  defaultDate={date as ISODate | ''}
                  selected={selectedCaptureId === capture.id}
                  planningDragDisabled={props.planningDragDisabled}
                  stackHighlight={dwellTargetId === capture.id}
                  onSelect={() => setSelectedCaptureId((current) => (current === capture.id ? null : capture.id))}
                  onPromote={props.onPromoteCapture}
                  onDelete={props.onDeleteCapture}
                  onSetImportant={props.onSetCaptureImportant}
                  onMoveToDate={props.onMoveCaptureToDate}
                  onDragStart={() => setDraggingCaptureId(capture.id)}
                  onDragEnd={() => { setDraggingCaptureId(null); clearDwell() }}
                  onDragEnterStack={() => scheduleStackDwell(capture.id)}
                  onDragLeaveStack={clearDwell}
                />
              )
            }
            const stack = row.stack
            const members = stack.memberOrder.map((id) => captureById.get(id)).filter(Boolean) as PlanningCapture[]
            if (!members.length) return null
            return (
              <TrayCaptureStack
                key={stack.stackId}
                stack={stack}
                members={members}
                expanded={expandedStackId === stack.stackId}
                units={props.units}
                defaultDate={date as ISODate | ''}
                selectedCaptureId={selectedCaptureId}
                planningDragDisabled={props.planningDragDisabled}
                dwellTargetId={dwellTargetId}
                onToggleExpand={() => setExpandedStackId((current) => (current === stack.stackId ? null : stack.stackId))}
                onUnstack={() => props.onUnstack(stack.stackId)}
                onRemoveMember={(captureId) => props.onRemoveCaptureFromStack(stack.stackId, captureId)}
                onReorder={(captureId, toIndex) => props.onReorderStackMember(stack.stackId, captureId, toIndex)}
                onSelectCapture={(captureId) => setSelectedCaptureId((current) => (current === captureId ? null : captureId))}
                onPromote={props.onPromoteCapture}
                onDelete={props.onDeleteCapture}
                onSetImportant={props.onSetCaptureImportant}
                onMoveToDate={props.onMoveCaptureToDate}
                onDragStartCapture={setDraggingCaptureId}
                onDragEndCapture={() => { setDraggingCaptureId(null); clearDwell() }}
                onScheduleStackDwell={scheduleStackDwell}
                onClearDwell={clearDwell}
              />
            )
          })
        )}
      </section>

      {props.undoAvailable ? <button type="button" className="quiet-button" onClick={props.onUndo}>Undo last tray move</button> : null}

      <details className="workspace-secondary-block">
        <summary>Unscheduled lessons ({unscheduledLessons.length})</summary>
        <label className="b01-fridge-date"><span>Lesson destination</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        {unscheduledLessons.length === 0 ? <p className="b01-furniture-empty">No loose Lessons.</p> : unscheduledLessons.map((lesson) => (
          <article className="b01-fridge-card" key={lesson.id}>
            <strong>{lesson.title}</strong>
            <button type="button" className="quiet-button" disabled={!date} onClick={() => props.onScheduleLesson(lesson.id, date as ISODate)}>Place on date</button>
          </article>
        ))}
      </details>

      <details className="workspace-secondary-block">
        <summary>Unscheduled units ({props.unscheduledUnitTitles.length})</summary>
        {props.unscheduledUnitTitles.length === 0 ? <p className="b01-furniture-empty">No loose Units.</p> : props.unscheduledUnitTitles.map((unit) => (
          <article className="b01-fridge-card b01-fridge-card--unit" key={unit.id}>
            <strong>{unit.title}</strong>
            <button type="button" className="quiet-button" onClick={props.onOpenUnits}>Place Unit</button>
          </article>
        ))}
      </details>

      <details className="workspace-secondary-block">
        <summary>Curriculum & returns</summary>
        <button type="button" className="workspace-import-link" onClick={props.onOpenImport}>Bring in curriculum CSV</button>
        {scheduledLessons.length > 0 ? (
          <div className="b01-fridge-return">
            {scheduledLessons.map((lesson) => (
              <button key={lesson.id} type="button" className="quiet-button" onClick={() => props.onUnplaceLesson(lesson.id)}>{lesson.title}</button>
            ))}
          </div>
        ) : null}
      </details>
    </div>
  )
}

function TrayCaptureStack(props: {
  stack: ObjectStack
  members: PlanningCapture[]
  expanded: boolean
  units: UnitWorkspace | null
  defaultDate: ISODate | ''
  selectedCaptureId: string | null
  planningDragDisabled?: boolean
  dwellTargetId: string | null
  onToggleExpand: () => void
  onUnstack: () => void
  onRemoveMember: (captureId: string) => void
  onReorder: (captureId: string, toIndex: number) => void
  onSelectCapture: (captureId: string) => void
  onPromote: Props['onPromoteCapture']
  onDelete: Props['onDeleteCapture']
  onSetImportant?: Props['onSetCaptureImportant']
  onMoveToDate?: Props['onMoveCaptureToDate']
  onDragStartCapture: (captureId: string) => void
  onDragEndCapture: () => void
  onScheduleStackDwell: (targetCaptureId: string) => void
  onClearDwell: () => void
}) {
  const leader = props.members[0]
  const menuItems: ArcObjectMenuItem[] = [
    { id: 'open', label: props.expanded ? 'Collapse stack' : 'Open stack', onSelect: props.onToggleExpand },
    { id: 'unstack', label: 'Unstack all', onSelect: props.onUnstack },
  ]

  return (
    <div className={`tray-stack${props.expanded ? ' tray-stack--expanded' : ''}`} data-testid={`tray-stack-${props.stack.stackId}`} data-drag-target="STACK_GROUP">
      <ArcObjectMenu label={`Stack of ${props.members.length}`} items={menuItems}>
        <div
          className="tray-stack-leader"
          draggable={!props.planningDragDisabled && !props.expanded}
          onDragStart={(event) => {
            if (props.planningDragDisabled || props.expanded) {
              event.preventDefault()
              return
            }
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData(TRAY_STACK_DRAG_MIME, encodeTrayStackDrag({ kind: 'stack', stackId: props.stack.stackId, memberKind: 'capture' }))
          }}
          onDragOver={(event) => {
            if (!hasTrayCaptureDrag(event.dataTransfer) || props.planningDragDisabled) return
            event.preventDefault()
            props.onScheduleStackDwell(leader.id)
          }}
          onDragLeave={props.onClearDwell}
        >
          <span className="tray-stack-count">{props.members.length}</span>
          <CaptureCard
            capture={leader}
            units={props.units}
            defaultDate={props.defaultDate}
            selected={props.selectedCaptureId === leader.id}
            planningDragDisabled={props.planningDragDisabled}
            dragDisabled={!props.expanded}
            stackHighlight={props.dwellTargetId === leader.id}
            embeddedInStack
            onSelect={() => props.onSelectCapture(leader.id)}
            onPromote={props.onPromote}
            onDelete={props.onDelete}
            onSetImportant={props.onSetImportant}
            onMoveToDate={props.onMoveToDate}
            onDragStart={() => props.onDragStartCapture(leader.id)}
            onDragEnd={props.onDragEndCapture}
          />
        </div>
      </ArcObjectMenu>
      {props.expanded ? (
        <div className="tray-stack-fan" role="list">
          {props.members.map((capture, index) => (
            <div key={capture.id} role="listitem" className="tray-stack-fan-item">
              <CaptureCard
                capture={capture}
                units={props.units}
                defaultDate={props.defaultDate}
                selected={props.selectedCaptureId === capture.id}
                planningDragDisabled={props.planningDragDisabled}
                embeddedInStack
                onSelect={() => props.onSelectCapture(capture.id)}
                onPromote={props.onPromote}
                onDelete={props.onDelete}
                onSetImportant={props.onSetImportant}
                onMoveToDate={props.onMoveToDate}
                onDragStart={() => props.onDragStartCapture(capture.id)}
                onDragEnd={() => {
                  props.onDragEndCapture()
                  props.onRemoveMember(capture.id)
                }}
              />
              {index > 0 ? (
                <button type="button" className="quiet-button tray-stack-move-up" onClick={() => props.onReorder(capture.id, 0)}>Move to top</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CaptureCard({ capture, units, defaultDate, selected, planningDragDisabled = false, dragDisabled = false, stackHighlight = false, embeddedInStack = false, onSelect, onPromote, onDelete, onSetImportant, onMoveToDate, onDragStart, onDragEnd, onDragEnterStack, onDragLeaveStack }: {
  capture: PlanningCapture
  units: UnitWorkspace | null
  defaultDate: ISODate | ''
  selected: boolean
  planningDragDisabled?: boolean
  dragDisabled?: boolean
  stackHighlight?: boolean
  embeddedInStack?: boolean
  onSelect: () => void
  onPromote: Props['onPromoteCapture']
  onDelete: Props['onDeleteCapture']
  onSetImportant?: Props['onSetCaptureImportant']
  onMoveToDate?: Props['onMoveCaptureToDate']
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragEnterStack?: () => void
  onDragLeaveStack?: () => void
}) {
  const placedUnits = useMemo(() => units?.units.filter((unit) => unit.placement) ?? [], [units])
  const [unitId, setUnitId] = useState(placedUnits[0]?.id ?? units?.units[0]?.id ?? '')
  const [scheduleNow, setScheduleNow] = useState(false)
  const unit = units?.units.find((candidate) => candidate.id === unitId)
  const dateAllowed = Boolean(unit?.placement && defaultDate && defaultDate >= unit.placement.startDate && defaultDate <= unit.placement.endDate)

  const menuItems: ArcObjectMenuItem[] = []
  if (onSetImportant) {
    menuItems.push({ id: 'important', label: capture.important ? 'Remove Important' : 'Mark Important', onSelect: () => { onSetImportant(capture.id, !capture.important) } })
  }
  if (onMoveToDate) {
    menuItems.push({
      id: 'place',
      label: 'Place on calendar…',
      onSelect: () => {
        const next = promptMoveToDate(capture.anchorDate ?? (typeof defaultDate === 'string' ? defaultDate : ''))
        if (next) onMoveToDate(capture.id, next as ISODate)
      },
    })
    menuItems.push({ id: 'tray', label: 'Move to Tray…', onSelect: () => { onMoveToDate(capture.id, null) } })
  }

  const [lifting, setLifting] = useState(false)

  return (
    <ArcImportantObject important={capture.important === true} className={`workspace-capture-card tray-post-it${selected ? ' workspace-capture-card--selected' : ''}${lifting ? ' tray-post-it--lift' : ''}${stackHighlight ? ' tray-post-it--stack-target' : ''}${embeddedInStack ? ' tray-post-it--in-stack' : ''}`}>
      <ArcObjectMenu label={capture.text} items={menuItems}>
        <button
          type="button"
          className="workspace-capture-card-select"
          draggable={!planningDragDisabled && !dragDisabled}
          onDragStart={(event) => {
            if (planningDragDisabled || dragDisabled) {
              event.preventDefault()
              return
            }
            setLifting(true)
            onDragStart?.()
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData(TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag({ kind: 'capture', captureId: capture.id }))
          }}
          onDragEnd={() => {
            setLifting(false)
            onDragEnd?.()
          }}
          onDragOver={(event) => {
            if (!hasTrayCaptureDrag(event.dataTransfer) || planningDragDisabled) return
            event.preventDefault()
            onDragEnterStack?.()
          }}
          onDragLeave={() => onDragLeaveStack?.()}
          onClick={onSelect}
        >
          <strong>{capture.text}</strong>
          <span>Captured {new Date(capture.createdAt).toLocaleDateString()}{capture.anchorDate ? ` · ${capture.anchorDate}` : ''}</span>
        </button>
      </ArcObjectMenu>
      {selected && !embeddedInStack ? (
        <div className="workspace-capture-actions">
          {units?.units.length ? <>
            <label><span>Organize into unit</span><select aria-label={`Unit for ${capture.text}`} value={unitId} onChange={(event) => setUnitId(event.target.value)}>{units.units.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.title}</option>)}</select></label>
            <label className="workspace-schedule-choice"><input type="checkbox" checked={scheduleNow} disabled={!dateAllowed} onChange={(event) => setScheduleNow(event.target.checked)} /><span>{dateAllowed ? `Place on ${defaultDate}` : 'Choose a date inside the Unit to place now'}</span></label>
            <button type="button" className="quiet-button" onClick={() => onPromote(capture.id, unitId, scheduleNow && dateAllowed ? defaultDate as ISODate : null)}>{scheduleNow && dateAllowed ? 'Convert & place' : 'Convert to lesson'}</button>
          </> : <p className="b01-furniture-empty">Add a course and unit when you are ready to organize.</p>}
          <button type="button" className="text-button" aria-label={`Delete Capture ${capture.text}`} onClick={() => onDelete(capture.id)}>Delete</button>
        </div>
      ) : null}
    </ArcImportantObject>
  )
}
