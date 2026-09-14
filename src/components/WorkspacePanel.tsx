import { useMemo, useState } from 'react'
import type { ISODate } from '../calendar'
import type { CaptureWorkspace, Lesson, PlanningCapture, UnitWorkspace } from '../planning'

type Props = {
  captures: CaptureWorkspace | null
  lessons: Lesson[]
  units: UnitWorkspace | null
  unscheduledUnitTitles: Array<{ id: string; title: string }>
  defaultDate: ISODate | null
  undoAvailable: boolean
  onAddCapture: (text: string) => string | null
  onDeleteCapture: (captureId: string) => void
  onPromoteCapture: (captureId: string, unitId: string, plannedDate: ISODate | null) => boolean
  onScheduleLesson: (lessonId: string, date: ISODate) => void
  onUnplaceLesson: (lessonId: string) => void
  onUndo: () => void
  onOpenUnits: () => void
  onOpenImport: () => void
}

export function WorkspacePanel(props: Props) {
  const [draft, setDraft] = useState('')
  const [date, setDate] = useState(props.defaultDate ?? '')
  const unscheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate === null)
  const scheduledLessons = props.lessons.filter((lesson) => lesson.plannedDate !== null)

  function capture() {
    if (!draft.trim()) return
    if (props.onAddCapture(draft)) setDraft('')
  }

  return (
    <div className="b01-fridge-content">
      <p className="b01-furniture-empty">Loose ideas and unplaced lessons wait here until you are ready to place them.</p>
      <button type="button" className="workspace-import-link" onClick={props.onOpenImport}>Bring in curriculum CSV</button>
      <div className="workspace-quick-capture">
        <label htmlFor="workspace-capture-text">Quick capture</label>
        <div><input id="workspace-capture-text" value={draft} placeholder="A Lesson idea, resource, or reminder" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); capture() } }} /><button type="button" disabled={!draft.trim()} onClick={capture}>Save</button></div>
      </div>
      {props.undoAvailable ? <button type="button" className="quiet-button" onClick={props.onUndo}>Undo last Workspace move</button> : null}

      <section aria-labelledby="workspace-captures-heading">
        <h2 id="workspace-captures-heading">Captures</h2>
        {(props.captures?.captures.length ?? 0) === 0 ? <p className="b01-furniture-empty">Nothing waiting to be organized.</p> : props.captures?.captures.map((capture) => <CaptureCard key={capture.id} capture={capture} units={props.units} defaultDate={date as ISODate | ''} onPromote={props.onPromoteCapture} onDelete={props.onDeleteCapture} />)}
      </section>

      <label className="b01-fridge-date"><span>Lesson destination</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <section aria-labelledby="b01-fridge-lessons">
        <h2 id="b01-fridge-lessons">Unscheduled Lessons</h2>
        {unscheduledLessons.length === 0 ? <p className="b01-furniture-empty">No loose Lessons.</p> : unscheduledLessons.map((lesson) => <article className="b01-fridge-card" key={lesson.id}><strong>{lesson.title}</strong><button type="button" className="quiet-button" disabled={!date} onClick={() => props.onScheduleLesson(lesson.id, date as ISODate)}>Place on date</button></article>)}
      </section>
      <section aria-labelledby="b01-fridge-units">
        <h2 id="b01-fridge-units">Unscheduled Units</h2>
        {props.unscheduledUnitTitles.length === 0 ? <p className="b01-furniture-empty">No loose Units.</p> : props.unscheduledUnitTitles.map((unit) => <article className="b01-fridge-card b01-fridge-card--unit" key={unit.id}><strong>{unit.title}</strong><button type="button" className="quiet-button" onClick={props.onOpenUnits}>Place Unit</button></article>)}
      </section>
      {scheduledLessons.length > 0 ? <details className="b01-fridge-return"><summary>Put a scheduled Lesson in Workspace</summary>{scheduledLessons.map((lesson) => <button key={lesson.id} type="button" className="quiet-button" onClick={() => props.onUnplaceLesson(lesson.id)}>{lesson.title}</button>)}</details> : null}
    </div>
  )
}

function CaptureCard({ capture, units, defaultDate, onPromote, onDelete }: {
  capture: PlanningCapture
  units: UnitWorkspace | null
  defaultDate: ISODate | ''
  onPromote: Props['onPromoteCapture']
  onDelete: Props['onDeleteCapture']
}) {
  const placedUnits = useMemo(() => units?.units.filter((unit) => unit.placement) ?? [], [units])
  const [unitId, setUnitId] = useState(placedUnits[0]?.id ?? units?.units[0]?.id ?? '')
  const [scheduleNow, setScheduleNow] = useState(false)
  const unit = units?.units.find((candidate) => candidate.id === unitId)
  const dateAllowed = Boolean(unit?.placement && defaultDate && defaultDate >= unit.placement.startDate && defaultDate <= unit.placement.endDate)

  return (
    <article className="workspace-capture-card">
      <strong>{capture.text}</strong>
      <p>Captured {new Date(capture.createdAt).toLocaleDateString()}</p>
      {units?.units.length ? <>
        <label><span>Unit</span><select aria-label={`Unit for ${capture.text}`} value={unitId} onChange={(event) => setUnitId(event.target.value)}>{units.units.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.title}</option>)}</select></label>
        <label className="workspace-schedule-choice"><input type="checkbox" checked={scheduleNow} disabled={!dateAllowed} onChange={(event) => setScheduleNow(event.target.checked)} /><span>{dateAllowed ? `Place on ${defaultDate}` : 'Choose a date inside the Unit to place now'}</span></label>
        <button type="button" className="quiet-button" onClick={() => onPromote(capture.id, unitId, scheduleNow && dateAllowed ? defaultDate as ISODate : null)}>{scheduleNow && dateAllowed ? 'Place as Lesson' : 'Make unscheduled Lesson'}</button>
      </> : <p className="b01-furniture-empty">It is safe here. Add a Course and Unit when you are ready to organize it.</p>}
      <button type="button" className="text-button" aria-label={`Delete Capture ${capture.text}`} onClick={() => onDelete(capture.id)}>Delete</button>
    </article>
  )
}
