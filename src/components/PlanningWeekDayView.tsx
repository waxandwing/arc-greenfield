import { useEffect, useRef, useState } from 'react'
import type { ISODate } from '../calendar/types'
import type { ProjectedDay } from '../calendar/projections'
import type { PlanningNotePlacement } from '../planning/notes'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningNoteProjection, PlanningRangeProjection } from '../planning/planningProjection'
import { formatLongDate, formatShortDate, formatWeekday } from './dateLabels'

export type WeekCourseOption = { id: string; title: string }
export type WeekUnitOption = { id: string; title: string; courseId: string; startDate: ISODate; endDate: ISODate }
export type ShiftPreviewResult = { allowed: boolean; message: string }

export type PlanningWeekObjectActions = {
  courses?: WeekCourseOption[]
  units?: WeekUnitOption[]
  moveUnit?: (unitId: string, startDate: ISODate, endDate: ISODate) => void
  fullEditUnit?: (unitId: string) => void
  copyUnit?: (unitId: string) => void
  unplaceUnit?: (unitId: string) => void
  deleteUnit?: (unitId: string) => void
  moveLesson?: (lessonId: string, plannedDate: ISODate) => void
  previewShift?: (sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) => ShiftPreviewResult
  applyShift?: (sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) => void
  fullEditLesson?: (lessonId: string) => void
  copyLesson?: (lessonId: string) => void
  unplaceLesson?: (lessonId: string) => void
  deleteLesson?: (lessonId: string) => void
  moveNote?: (noteId: string, date: ISODate, placement: PlanningNotePlacement) => void
  copyNote?: (noteId: string) => void
  deleteNote?: (noteId: string) => void
  createUnit?: (courseId: string, title: string, startDate: ISODate, endDate: ISODate) => void
  createLesson?: (unitId: string, title: string, plannedDate: ISODate) => void
  createNote?: (date: ISODate, text: string, placement: PlanningNotePlacement, important: boolean) => void
}

type Selection =
  | { kind: 'unit'; id: string }
  | { kind: 'lesson'; id: string; sectionId: string }
  | { kind: 'note'; id: string }
  | null

type QuickAdd = { date: ISODate } | null

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
  actions,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
  actions?: PlanningWeekObjectActions
}) {
  const [selected, setSelected] = useState<Selection>(null)
  const [quickAdd, setQuickAdd] = useState<QuickAdd>(null)

  if (planning.courses.length === 0 && planning.notes.length === 0 && !(actions?.courses?.length)) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  const calendarNotes = planning.notes.filter((note) => note.placement === 'calendar')
  const afterSchoolNotes = planning.notes.filter((note) => note.placement === 'after-school')
  const select = (next: Exclude<Selection, null>) => setSelected((current) => sameSelection(current, next) ? null : next)
  const dismiss = () => setSelected(null)

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'}>
      <PlanningDateHeader
        days={days}
        single={single}
        onQuickAdd={actions?.createUnit || actions?.createLesson || actions?.createNote ? (date) => { setSelected(null); setQuickAdd({ date }) } : undefined}
      />
      {quickAdd ? <QuickAddComposer date={quickAdd.date} actions={actions} onDismiss={() => setQuickAdd(null)} /> : null}
      {calendarNotes.length > 0 ? <PlanningNoteLane label="Notes" notes={calendarNotes} days={days} selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} /> : null}
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} />
      ))}
      {afterSchoolNotes.length > 0 ? <PlanningNoteLane label="After School" notes={afterSchoolNotes} days={days} subordinate selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} /> : null}
    </div>
  )
}

function PlanningDateHeader({ days, single, onQuickAdd }: { days: ProjectedDay[]; single: boolean; onQuickAdd?: (date: ISODate) => void }) {
  return (
    <div className="planning-date-header" style={gridTemplate(days.length)} aria-label="Week dates">
      <span className="planning-row-label planning-row-label--header">Class</span>
      {days.map((day) => (
        <div key={day.date} className={`planning-date-heading planning-date-heading--${day.kind}`}>
          {!single ? <span className="planning-date-weekday">{formatWeekday(day.date)}</span> : null}
          <span>{formatShortDate(day.date)}</span>
          {day.kind !== 'instructional' ? <span className="planning-date-kind">{day.label || humanizeKind(day.kind)}</span> : null}
          {onQuickAdd && day.kind === 'instructional' ? <button type="button" className="planning-quick-add-trigger" aria-label={`Add work on ${formatLongDate(day.date)}`} onClick={() => onQuickAdd(day.date)}>+</button> : null}
        </div>
      ))}
    </div>
  )
}

function QuickAddComposer({ date, actions, onDismiss }: { date: ISODate; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const [kind, setKind] = useState<'unit' | 'lesson' | 'note'>('lesson')
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState(actions?.courses?.[0]?.id ?? '')
  const eligibleUnits = (actions?.units ?? []).filter((unit) => unit.startDate <= date && unit.endDate >= date)
  const [unitId, setUnitId] = useState(eligibleUnits[0]?.id ?? '')
  const [endDate, setEndDate] = useState(date)
  const [placement, setPlacement] = useState<PlanningNotePlacement>('calendar')
  const [important, setImportant] = useState(false)
  const titleRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [kind])
  useEffect(() => {
    if (kind === 'lesson' && !eligibleUnits.some((unit) => unit.id === unitId)) setUnitId(eligibleUnits[0]?.id ?? '')
  }, [date, eligibleUnits, kind, unitId])

  function submit() {
    const cleaned = title.trim()
    if (!cleaned) return
    if (kind === 'unit' && courseId && actions?.createUnit) actions.createUnit(courseId, cleaned, date, endDate)
    if (kind === 'lesson' && unitId && actions?.createLesson) actions.createLesson(unitId, cleaned, date)
    if (kind === 'note' && actions?.createNote) actions.createNote(date, cleaned, placement, important)
    onDismiss()
  }

  return (
    <section className="planning-quick-add" aria-label={`Add work on ${formatLongDate(date)}`} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onDismiss() } }}>
      <div className="planning-quick-add-heading"><strong>Add to {formatShortDate(date)}</strong><button type="button" className="planning-context-dismiss" aria-label="Close quick add" onClick={onDismiss}>×</button></div>
      <div className="planning-quick-add-kinds" role="group" aria-label="Object type">
        {(['unit','lesson','note'] as const).map((candidate) => <button key={candidate} type="button" aria-pressed={kind === candidate} onClick={() => setKind(candidate)}>{candidate === 'unit' ? 'Unit' : candidate === 'lesson' ? 'Lesson' : 'Note'}</button>)}
      </div>
      {kind === 'note' ? <textarea ref={titleRef as React.RefObject<HTMLTextAreaElement>} aria-label="Note text" rows={3} value={title} onChange={(event) => setTitle(event.target.value)} /> : <input ref={titleRef as React.RefObject<HTMLInputElement>} aria-label={kind === 'unit' ? 'Unit title' : 'Lesson title'} value={title} onChange={(event) => setTitle(event.target.value)} />}
      {kind === 'unit' ? <><label>Course<select aria-label="Course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>{(actions?.courses ?? []).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Through<input type="date" aria-label="Unit end date" min={date} value={endDate} onChange={(event) => setEndDate(event.target.value as ISODate)} /></label></> : null}
      {kind === 'lesson' ? <label>Unit<select aria-label="Unit" value={unitId} onChange={(event) => setUnitId(event.target.value)}>{eligibleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.title}</option>)}</select>{eligibleUnits.length === 0 ? <span className="planning-action-hint">Place a Unit across this date before adding a Lesson.</span> : null}</label> : null}
      {kind === 'note' ? <div className="planning-quick-add-note-options"><label>Placement<select aria-label="Note placement" value={placement} onChange={(event) => setPlacement(event.target.value as PlanningNotePlacement)}><option value="calendar">Notes</option><option value="after-school">After School</option></select></label><label className="planning-check"><input type="checkbox" checked={important} onChange={(event) => setImportant(event.target.checked)} />Important</label></div> : null}
      <button type="button" className="planning-action-primary" disabled={!title.trim() || (kind === 'unit' && !courseId) || (kind === 'lesson' && !unitId)} onClick={submit}>Add {kind === 'unit' ? 'Unit' : kind === 'lesson' ? 'Lesson' : 'Note'}</button>
    </section>
  )
}

function PlanningNoteLane({ label, notes, days, subordinate = false, selected, onSelect, actions, onDismiss }: { label: string; notes: PlanningNoteProjection[]; days: ProjectedDay[]; subordinate?: boolean; selected: Selection; onSelect: (selection: Exclude<Selection, null>) => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  return (
    <section className={`planning-note-lane${subordinate ? ' planning-note-lane--subordinate' : ''}`} aria-label={label}>
      <div className="planning-note-row" style={gridTemplate(days.length)}>
        <div className="planning-row-label planning-row-label--note"><strong>{label}</strong></div>
        {days.map((day) => {
          const dayNotes = notes.filter((note) => note.date === day.date)
          return <div className="planning-note-slot" key={day.date} aria-label={`${label}, ${formatLongDate(day.date)}`} role={dayNotes.length ? 'list' : undefined}>{dayNotes.map((note) => <NoteTile key={note.noteId} note={note} selected={selected?.kind === 'note' && selected.id === note.noteId} onSelect={() => onSelect({ kind: 'note', id: note.noteId })} actions={actions} onDismiss={onDismiss} />)}</div>
        })}
      </div>
    </section>
  )
}

function NoteTile({ note, selected, onSelect, actions, onDismiss }: { note: PlanningNoteProjection; selected: boolean; onSelect: () => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const [moving, setMoving] = useState(false)
  const [date, setDate] = useState(note.date)
  const [placement, setPlacement] = useState<PlanningNotePlacement>(note.placement)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!selected) setMoving(false) }, [selected])
  const dismissAndFocus = () => { onDismiss(); requestAnimationFrame(() => buttonRef.current?.focus()) }
  const accessible = [note.important ? 'Important' : null, note.placement === 'after-school' ? 'After School note' : 'Note', note.text, note.sourceLabel ? `Source ${note.sourceLabel}` : null].filter(Boolean).join('. ')
  return (
    <article className={`planning-note${note.important ? ' planning-note--important' : ''}${selected ? ' planning-object--selected' : ''}`} role="listitem">
      <button ref={buttonRef} type="button" className="planning-object-select planning-note-select" aria-label={`Select ${accessible}`} aria-pressed={selected} onClick={onSelect}>{note.important ? <span className="planning-important-mark" aria-label="Important" title="Important">!</span> : null}<span className="planning-note-text">{note.text}</span>{note.sourceLabel ? <span className="planning-note-source" title={note.sourceLocator ?? undefined}>Source: {note.sourceLabel}</span> : null}</button>
      {selected ? <><ContextToolbar label="Note actions" onDismiss={dismissAndFocus} actions={[
        actions?.moveNote ? { label: 'Move', run: () => setMoving(true) } : null,
        actions?.copyNote ? { label: 'Copy', run: () => actions.copyNote?.(note.noteId) } : null,
        actions?.deleteNote ? { label: 'Delete', run: () => actions.deleteNote?.(note.noteId), destructive: true } : null,
      ]} />{moving ? <InlineEditor label="Move Note" onCancel={() => setMoving(false)}><label>Date<input type="date" aria-label="Note date" value={date} onChange={(event) => setDate(event.target.value as ISODate)} /></label><label>Placement<select aria-label="Move Note placement" value={placement} onChange={(event) => setPlacement(event.target.value as PlanningNotePlacement)}><option value="calendar">Notes</option><option value="after-school">After School</option></select></label><button type="button" className="planning-action-primary" onClick={() => { actions?.moveNote?.(note.noteId, date, placement); setMoving(false) }}>Move Note</button></InlineEditor> : null}</> : null}
    </article>
  )
}

function PlanningCourse({ course, days, single, selected, onSelect, actions, onDismiss }: { course: PlanningCourseGroup; days: ProjectedDay[]; single: boolean; selected: Selection; onSelect: (selection: Exclude<Selection, null>) => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  return (
    <section className="planning-course" aria-labelledby={`planning-course-${course.course.id}`}>
      <div className="planning-course-heading"><h2 id={`planning-course-${course.course.id}`}>{course.course.title}</h2></div>
      {course.unitSpans.length > 0 ? <div className="planning-unit-stack" aria-label={`${course.course.title} Unit spans`}>{course.unitSpans.map((unit, index) => <UnitTile key={unit.unitId} courseId={course.course.id} unit={unit} index={index} days={days} selected={selected?.kind === 'unit' && selected.id === unit.unitId} onSelect={() => onSelect({ kind: 'unit', id: unit.unitId })} actions={actions} onDismiss={onDismiss} />)}</div> : null}
      <div className="planning-section-list">
        {course.sections.length === 0 ? <p className="planning-course-empty">No Sections are attached to this Course yet.</p> : course.sections.map((row) => <div className="planning-section-row" style={gridTemplate(days.length)} key={row.section.id}><div className="planning-row-label"><strong>{row.section.name}</strong></div>{row.days.map((slot, index) => <div key={slot.date} className={`planning-day-slot planning-day-slot--${days[index]?.kind ?? 'unknown'}`} aria-label={`${row.section.name}, ${formatLongDate(slot.date)}`} role={slot.lessons.length > 0 ? 'list' : undefined}>{slot.lessons.map((lesson) => <LessonTile key={lesson.lessonId} lesson={lesson} courseId={course.course.id} sectionId={row.section.id} selected={selected?.kind === 'lesson' && selected.id === lesson.lessonId && selected.sectionId === row.section.id} onSelect={() => onSelect({ kind: 'lesson', id: lesson.lessonId, sectionId: row.section.id })} actions={actions} onDismiss={onDismiss} />)}{single && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}</div>)}</div>)}
      </div>
    </section>
  )
}

function UnitTile({ courseId, unit, index, days, selected, onSelect, actions, onDismiss }: { courseId: string; unit: PlanningCourseGroup['unitSpans'][number]; index: number; days: ProjectedDay[]; selected: boolean; onSelect: () => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const [moving, setMoving] = useState(false)
  const [startDate, setStartDate] = useState(unit.startDate)
  const [endDate, setEndDate] = useState(unit.endDate)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!selected) setMoving(false) }, [selected])
  const dismissAndFocus = () => { onDismiss(); requestAnimationFrame(() => buttonRef.current?.focus()) }
  return <div className="planning-unit-grid" style={gridTemplate(days.length)}><span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span><div className={`planning-unit-object${selected ? ' planning-object--selected' : ''}`} style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}><button ref={buttonRef} id={unitSpanId(courseId, unit.unitId)} type="button" className="planning-unit-span planning-object-select" title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`} aria-label={`Select Unit ${unit.title}, ${formatLongDate(unit.startDate)} through ${formatLongDate(unit.endDate)}`} aria-pressed={selected} onClick={onSelect}>{unit.title}</button>{selected ? <><ContextToolbar label={`${unit.title} actions`} onDismiss={dismissAndFocus} actions={[
    actions?.moveUnit ? { label: 'Move / resize', run: () => setMoving(true) } : null,
    actions?.fullEditUnit ? { label: 'Full Edit', run: () => actions.fullEditUnit?.(unit.unitId) } : null,
    actions?.copyUnit ? { label: 'Copy', run: () => actions.copyUnit?.(unit.unitId) } : null,
    actions?.unplaceUnit ? { label: 'Unplace', run: () => actions.unplaceUnit?.(unit.unitId) } : null,
    actions?.deleteUnit ? { label: 'Delete', run: () => actions.deleteUnit?.(unit.unitId), destructive: true } : null,
  ]} />{moving ? <InlineEditor label="Move or resize Unit" onCancel={() => setMoving(false)}><label>Start<input type="date" aria-label="Unit start date" value={startDate} onChange={(event) => setStartDate(event.target.value as ISODate)} /></label><label>End<input type="date" aria-label="Unit end date" value={endDate} onChange={(event) => setEndDate(event.target.value as ISODate)} /></label><button type="button" className="planning-action-primary" onClick={() => { actions?.moveUnit?.(unit.unitId, startDate, endDate); setMoving(false) }}>Apply range</button></InlineEditor> : null}</> : null}</div></div>
}

function LessonTile({ lesson, courseId, sectionId, selected, onSelect, actions, onDismiss }: { lesson: PlanningLessonPlacement; courseId: string; sectionId: string; selected: boolean; onSelect: () => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const [moving, setMoving] = useState(false)
  const [shifting, setShifting] = useState(false)
  const [targetDate, setTargetDate] = useState(lesson.effectiveDate)
  const [shiftPreview, setShiftPreview] = useState<ShiftPreviewResult | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!selected) { setMoving(false); setShifting(false); setShiftPreview(null) } }, [selected])
  const dismissAndFocus = () => { onDismiss(); requestAnimationFrame(() => buttonRef.current?.focus()) }
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate ? `Taught ${formatShortDate(lesson.taughtDate)}` : null
  const accessible = [lesson.title, `Lesson in Unit ${lesson.unitTitle}`, lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date', lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan', statusLabel, taughtLabel, lesson.resumeNote ? `Resume note: ${lesson.resumeNote}` : null].filter(Boolean).join('. ')
  return <article className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}${selected ? ' planning-object--selected' : ''}`} aria-describedby={unitSpanId(courseId, lesson.unitId)} role="listitem"><button ref={buttonRef} type="button" className="planning-object-select planning-lesson-select" aria-label={`Select ${accessible}`} aria-pressed={selected} onClick={onSelect}><span className="planning-lesson-parent">{lesson.unitTitle}</span><span className="planning-lesson-title-row"><span className="planning-lesson-title">{lesson.title}</span>{lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}</span><span className="planning-lesson-meta"><span>{statusLabel}</span>{taughtLabel ? <span>{taughtLabel}</span> : null}{lesson.isSectionOverride ? <span>Shifted for this class</span> : null}</span>{lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? <span className="planning-resume-note">Continue: {lesson.resumeNote}</span> : null}</button>{selected ? <><ContextToolbar label={`${lesson.title} actions`} onDismiss={dismissAndFocus} actions={[
    actions?.moveLesson ? { label: 'Move', run: () => { setMoving(true); setShifting(false) } } : null,
    actions?.previewShift && actions?.applyShift && lesson.datePolicy !== 'fixed' ? { label: 'Shift this class', run: () => { setShifting(true); setMoving(false); setShiftPreview(null) } } : null,
    actions?.fullEditLesson ? { label: 'Full Edit', run: () => actions.fullEditLesson?.(lesson.lessonId) } : null,
    actions?.copyLesson ? { label: 'Copy', run: () => actions.copyLesson?.(lesson.lessonId) } : null,
    actions?.unplaceLesson ? { label: 'Unplace', run: () => actions.unplaceLesson?.(lesson.lessonId) } : null,
    actions?.deleteLesson ? { label: 'Delete', run: () => actions.deleteLesson?.(lesson.lessonId), destructive: true } : null,
  ]} />{moving ? <InlineEditor label="Move Lesson shared plan" onCancel={() => setMoving(false)}><p className="planning-action-hint">Moves the shared Course plan. Section-specific Shift dates remain separate.</p><label>Date<input type="date" aria-label="Lesson planned date" value={targetDate} onChange={(event) => setTargetDate(event.target.value as ISODate)} /></label><button type="button" className="planning-action-primary" onClick={() => { actions?.moveLesson?.(lesson.lessonId, targetDate); setMoving(false) }}>Move Lesson</button></InlineEditor> : null}{shifting ? <InlineEditor label="Shift Lesson for this class" onCancel={() => { setShifting(false); setShiftPreview(null) }}><p className="planning-action-hint">Changes only this Section. The shared Course plan is not moved.</p><label>Date<input type="date" aria-label="Shift destination date" value={targetDate} onChange={(event) => { setTargetDate(event.target.value as ISODate); setShiftPreview(null) }} /></label>{shiftPreview ? <p className={shiftPreview.allowed ? 'planning-shift-preview' : 'planning-shift-preview planning-shift-preview--blocked'} role="status">{shiftPreview.message}</p> : null}{!shiftPreview ? <button type="button" className="planning-action-primary" onClick={() => setShiftPreview(actions?.previewShift?.(sectionId, lesson.lessonId, lesson.effectiveDate, targetDate) ?? { allowed:false, message:'Shift preview is unavailable.' })}>Preview Shift</button> : null}{shiftPreview?.allowed ? <button type="button" className="planning-action-primary" onClick={() => { actions?.applyShift?.(sectionId, lesson.lessonId, lesson.effectiveDate, targetDate); setShifting(false); setShiftPreview(null) }}>Apply Shift</button> : null}</InlineEditor> : null}</> : null}</article>
}

type ToolbarAction = { label: string; run: () => void; destructive?: boolean } | null
function ContextToolbar({ label, actions, onDismiss }: { label: string; actions: ToolbarAction[]; onDismiss: () => void }) {
  const available = actions.filter((action): action is Exclude<ToolbarAction, null> => Boolean(action))
  return <div className="planning-context-toolbar" role="toolbar" aria-label={label} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onDismiss() } }}>{available.map((action) => <button key={action.label} type="button" className={action.destructive ? 'planning-context-action planning-context-action--danger' : 'planning-context-action'} onClick={(event) => { event.stopPropagation(); action.run() }}>{action.label}</button>)}<button type="button" className="planning-context-dismiss" aria-label="Close object actions" onClick={(event) => { event.stopPropagation(); onDismiss() }}>×</button></div>
}

function InlineEditor({ label, children, onCancel }: { label: string; children: React.ReactNode; onCancel: () => void }) {
  return <div className="planning-inline-editor" aria-label={label} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel() } }}><div className="planning-inline-editor-heading"><strong>{label}</strong><button type="button" className="planning-context-dismiss" aria-label={`Close ${label}`} onClick={onCancel}>×</button></div>{children}</div>
}

function sameSelection(left: Selection, right: Exclude<Selection, null>) {
  if (!left || left.kind !== right.kind || left.id !== right.id) return false
  return left.kind !== 'lesson' || right.kind !== 'lesson' || left.sectionId === right.sectionId
}
function unitSpanId(courseId: string, unitId: string): string { return `planning-unit-${courseId}-${unitId}` }
function gridTemplate(dayCount: number): { gridTemplateColumns: string } { return { gridTemplateColumns: `minmax(96px, .72fr) repeat(${dayCount}, minmax(0, 1fr))` } }
function humanizeKind(kind: ProjectedDay['kind']): string { switch (kind) { case 'no-school': return 'No school'; case 'teacher-workday': return 'Teacher workday'; case 'holiday': return 'Holiday'; case 'break': return 'Break'; case 'instructional': return 'Instructional day'; case 'unknown': return 'Unknown' } }
function humanizeStatus(status: PlanningLessonPlacement['deliveryStatus']): string { switch (status) { case 'not-started': return 'Not started'; case 'in-progress': return 'In progress'; case 'completed': return 'Completed'; case 'skipped': return 'Skipped' } }
