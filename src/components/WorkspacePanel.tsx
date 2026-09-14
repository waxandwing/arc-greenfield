import { useMemo, useState } from 'react'
import type { ISODate } from '../calendar'
import type { CaptureWorkspace, Lesson, PlanningCapture, UnitWorkspace } from '../planning'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, promptMoveToDate, type ArcObjectMenuItem } from './ArcObjectMenu'
import { TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag } from '../planning/deskDrag'

type Props = {
  captures: CaptureWorkspace | null
  lessons: Lesson[]
  units: UnitWorkspace | null
  unscheduledUnitTitles: Array<{ id: string; title: string }>
  defaultDate: ISODate | null
  undoAvailable: boolean
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
  planningDragDisabled?: boolean
}

export function WorkspacePanel(props: Props) {
  const [date, setDate] = useState(props.defaultDate ?? '')
  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(null)
  const unscheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate === null)
  const scheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate !== null)
  const captureCount = props.captures?.captures.length ?? 0

  return (
    <div className="b01-fridge-content b01-fridge-content--repair-pass-3 b01-tray-content">
      <section aria-labelledby="workspace-captures-heading" className="workspace-captures-primary">
        <div className="workspace-captures-heading-row">
          <h2 id="workspace-captures-heading">Tray</h2>
          {captureCount > 0 ? <span className="workspace-capture-count">{captureCount}</span> : null}
        </div>
        {captureCount === 0 ? (
          <p className="b01-furniture-empty">Nothing waiting. Use + Capture from any planner view.</p>
        ) : (
          props.captures?.captures.map((capture) => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              units={props.units}
              defaultDate={date as ISODate | ''}
              selected={selectedCaptureId === capture.id}
              planningDragDisabled={props.planningDragDisabled}
              onSelect={() => setSelectedCaptureId((current) => (current === capture.id ? null : capture.id))}
              onPromote={props.onPromoteCapture}
              onDelete={props.onDeleteCapture}
              onSetImportant={props.onSetCaptureImportant}
              onMoveToDate={props.onMoveCaptureToDate}
            />
          ))
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

function CaptureCard({ capture, units, defaultDate, selected, planningDragDisabled = false, onSelect, onPromote, onDelete, onSetImportant, onMoveToDate }: {
  capture: PlanningCapture
  units: UnitWorkspace | null
  defaultDate: ISODate | ''
  selected: boolean
  planningDragDisabled?: boolean
  onSelect: () => void
  onPromote: Props['onPromoteCapture']
  onDelete: Props['onDeleteCapture']
  onSetImportant?: Props['onSetCaptureImportant']
  onMoveToDate?: Props['onMoveCaptureToDate']
}) {
  const placedUnits = useMemo(() => units?.units.filter((unit) => unit.placement) ?? [], [units])
  const [unitId, setUnitId] = useState(placedUnits[0]?.id ?? units?.units[0]?.id ?? '')
  const [scheduleNow, setScheduleNow] = useState(false)
  const unit = units?.units.find((candidate) => candidate.id === unitId)
  const dateAllowed = Boolean(unit?.placement && defaultDate && defaultDate >= unit.placement.startDate && defaultDate <= unit.placement.endDate)

  const menuItems: ArcObjectMenuItem[] = []
  if (onSetImportant) {
    menuItems.push({
      id: 'important',
      label: capture.important ? 'Remove Important' : 'Mark Important',
      onSelect: () => { onSetImportant(capture.id, !capture.important) },
    })
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
    menuItems.push({
      id: 'tray',
      label: 'Move to Tray…',
      onSelect: () => { onMoveToDate(capture.id, null) },
    })
  }

  const [lifting, setLifting] = useState(false)

  return (
    <ArcImportantObject important={capture.important === true} className={`workspace-capture-card tray-post-it${selected ? ' workspace-capture-card--selected' : ''}${lifting ? ' tray-post-it--lift' : ''}`}>
      <ArcObjectMenu label={capture.text} items={menuItems}>
      <button
        type="button"
        className="workspace-capture-card-select"
        draggable={!planningDragDisabled}
        onDragStart={(event) => {
          if (planningDragDisabled) {
            event.preventDefault()
            return
          }
          setLifting(true)
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData(TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag({ kind: 'capture', captureId: capture.id }))
        }}
        onDragEnd={() => setLifting(false)}
        onClick={onSelect}
      >
        <strong>{capture.text}</strong>
        <span>Captured {new Date(capture.createdAt).toLocaleDateString()}{capture.anchorDate ? ` · ${capture.anchorDate}` : ''}</span>
      </button>
      </ArcObjectMenu>
      {selected ? (
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
