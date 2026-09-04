import { useEffect, useMemo, useRef, useState } from 'react'
import { eachCalendarDay, isConfirmedInstructionalDay, type ISODate, type SchoolCalendar } from '../calendar'
import type {
  Lesson,
  LessonWorkspace,
  PlanningWorkspace,
  SectionLessonDateOverride,
  ShiftPersistenceInput,
  Unit,
  UnitPlacement,
  UnitWorkspace,
} from '../planning'

export type ObjectFocusState =
  | { kind: 'unit'; unitId: string; lessonId?: string }
  | { kind: 'lesson'; lessonId: string }

type Props = {
  focus: ObjectFocusState
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  shiftState: ShiftPersistenceInput | null
  onChangeFocus: (focus: ObjectFocusState) => void
  onClose: () => void
  onMoveUnit: (unitId: string, placement: UnitPlacement) => string | null
  onUnplaceUnit: (unitId: string) => string | null
  onDeleteUnit: (unitId: string) => string | null
  onMoveLesson: (lessonId: string, plannedDate: ISODate) => string | null
  onUnplaceLesson: (lessonId: string) => string | null
  onDeleteLesson: (lessonId: string) => string | null
  onEditUnitTitle: (unitId: string, title: string) => string | null
  onEditLessonTitle: (lessonId: string, title: string) => string | null
}

type ActionMode = 'move' | 'edit' | 'unplace' | 'delete' | null

export function ObjectFocusLayer(props: Props) {
  const { focus, units, lessons } = props
  const closeRef = useRef<HTMLButtonElement>(null)
  const focusIdentity = focus.kind === 'unit' ? `unit:${focus.unitId}` : `lesson:${focus.lessonId}`
  const unit = focus.kind === 'unit' ? units.units.find((candidate) => candidate.id === focus.unitId) ?? null : null
  const lesson = focus.kind === 'lesson'
    ? lessons.lessons.find((candidate) => candidate.id === focus.lessonId) ?? null
    : focus.lessonId
      ? lessons.lessons.find((candidate) => candidate.id === focus.lessonId) ?? null
      : null

  useEffect(() => {
    closeRef.current?.focus()
  }, [focusIdentity])

  if (focus.kind === 'unit' && !unit) return null
  if (focus.kind === 'lesson' && !lesson) return null

  return (
    <aside className="object-focus-layer" aria-label={focus.kind === 'unit' ? 'Unit Focus' : 'Lesson editor'}>
      <div className="object-focus-panel">
        <header className="object-focus-header">
          <div>
            <p className="section-label">{focus.kind === 'unit' ? 'Unit Focus' : 'Lesson'}</p>
            <h2>{focus.kind === 'unit' ? unit!.title : lesson!.title}</h2>
          </div>
          <button ref={closeRef} type="button" className="quiet-button object-focus-close" onClick={props.onClose}>Close</button>
        </header>

        {focus.kind === 'unit' ? (
          <UnitFocus unit={unit!} selectedLesson={lesson} {...props} />
        ) : (
          <LessonEditor lesson={lesson!} {...props} />
        )}
      </div>
    </aside>
  )
}

function UnitFocus({
  unit,
  selectedLesson,
  lessons,
  onChangeFocus,
  ...props
}: Props & { unit: Unit; selectedLesson: Lesson | null }) {
  const unitLessons = useMemo(
    () => lessons.lessons.filter((lesson) => lesson.unitId === unit.id).slice().sort((a, b) => a.sequence - b.sequence || a.title.localeCompare(b.title)),
    [lessons.lessons, unit.id],
  )

  return (
    <div className="object-focus-body">
      <UnitSummary unit={unit} {...props} lessons={lessons} onChangeFocus={onChangeFocus} />

      <section className="unit-focus-lessons" aria-label="Lessons in this Unit">
        <div className="object-focus-section-heading">
          <p className="section-label">Lessons</p>
          <span>{unitLessons.length}</span>
        </div>
        {unitLessons.length === 0 ? <p className="object-focus-empty">No Lessons in this Unit yet.</p> : (
          <div className="unit-focus-lesson-list">
            {unitLessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                className="unit-focus-lesson"
                aria-current={selectedLesson?.id === lesson.id ? 'true' : undefined}
                onClick={() => onChangeFocus({ kind: 'unit', unitId: unit.id, lessonId: lesson.id })}
              >
                <strong>{lesson.title}</strong>
                <span>{lesson.plannedDate ?? 'Off calendar'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedLesson ? (
        <section className="unit-focus-selected-lesson" aria-label={`Selected Lesson ${selectedLesson.title}`}>
          <div className="object-focus-section-heading">
            <p className="section-label">Selected Lesson</p>
            <button type="button" className="text-button" onClick={() => onChangeFocus({ kind: 'unit', unitId: unit.id })}>Clear selection</button>
          </div>
          <LessonActionSurface lesson={selectedLesson} {...props} lessons={lessons} onChangeFocus={onChangeFocus} />
        </section>
      ) : null}
    </div>
  )
}

function LessonEditor({ lesson, ...props }: Props & { lesson: Lesson }) {
  return (
    <div className="object-focus-body">
      <p className="object-focus-context">This Lesson is off the calendar and remains part of its Unit.</p>
      <LessonActionSurface lesson={lesson} {...props} />
    </div>
  )
}

function UnitSummary({ unit, ...props }: Props & { unit: Unit }) {
  const course = props.planning.courses.find((candidate) => candidate.id === unit.courseId)
  return (
    <section className="object-focus-object">
      <div className="object-focus-facts">
        <span>{course?.title ?? 'Course unavailable'}</span>
        <span>{unit.placement ? `${unit.placement.startDate} → ${unit.placement.endDate}` : 'Off calendar'}</span>
      </div>
      <UnitActionSurface unit={unit} {...props} />
    </section>
  )
}

function UnitActionSurface({ unit, ...props }: Props & { unit: Unit }) {
  const [mode, setMode] = useState<ActionMode>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(unit.title)
  const [startDate, setStartDate] = useState(unit.placement?.startDate ?? '')
  const [endDate, setEndDate] = useState(unit.placement?.endDate ?? '')

  useEffect(() => {
    setMode(null)
    setError(null)
    setTitle(unit.title)
    setStartDate(unit.placement?.startDate ?? '')
    setEndDate(unit.placement?.endDate ?? '')
  }, [unit.id, unit.title, unit.placement?.startDate, unit.placement?.endDate])

  const act = (nextMode: ActionMode) => {
    setError(null)
    setMode(nextMode)
  }

  return (
    <div className="object-action-surface">
      <ActionBar onAction={act} unplaceDisabled={!unit.placement} />
      {error ? <p className="object-action-error" role="alert">{error}</p> : null}

      {mode === 'edit' ? (
        <ActionReview title="Edit Unit">
          <label><span>Unit title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <ActionCommit label="Save Edit" onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onEditUnitTitle(unit.id, title)
            if (result) setError(result)
            else setMode(null)
          }} />
        </ActionReview>
      ) : null}

      {mode === 'move' ? (
        <ActionReview title="Move Unit">
          <div className="object-action-date-grid">
            <label><span>Start</span><input type="date" min={props.calendar.firstDay} max={props.calendar.lastDay} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label><span>End</span><input type="date" min={props.calendar.firstDay} max={props.calendar.lastDay} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          </div>
          {startDate && endDate ? <p className="object-action-preview">Preview: {unit.title} → {startDate} through {endDate}</p> : null}
          <ActionCommit label="Move Unit" disabled={!startDate || !endDate} onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onMoveUnit(unit.id, { startDate: startDate as ISODate, endDate: endDate as ISODate })
            if (result) setError(result)
            else setMode(null)
          }} />
        </ActionReview>
      ) : null}

      {mode === 'unplace' ? (
        <ActionReview title="Unplace Unit">
          <p>Remove this Unit’s calendar span. The Unit itself stays in Arc. Arc will refuse if scheduled Lessons or Section-specific placements would be silently displaced.</p>
          <ActionCommit label="Unplace Unit" onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onUnplaceUnit(unit.id)
            if (result) setError(result)
            else setMode(null)
          }} />
        </ActionReview>
      ) : null}

      {mode === 'delete' ? (
        <ActionReview title="Delete Unit" destructive>
          <p>Delete {unit.title}? This is destructive. Arc will not cascade-delete Lessons and does not promise Undo.</p>
          <ActionCommit label="Delete Unit" destructive onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onDeleteUnit(unit.id)
            if (result) setError(result)
            else props.onClose()
          }} />
        </ActionReview>
      ) : null}
    </div>
  )
}

function LessonActionSurface({ lesson, ...props }: Props & { lesson: Lesson }) {
  const [mode, setMode] = useState<ActionMode>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(lesson.title)
  const [plannedDate, setPlannedDate] = useState(lesson.plannedDate ?? '')
  const unit = props.units.units.find((candidate) => candidate.id === lesson.unitId)
  const relatedOverrides = (props.shiftState?.overrides ?? []).filter((override) => override.lessonId === lesson.id)
  const canUnplace = Boolean(lesson.plannedDate || relatedOverrides.length)
  const validMoveDates = unit?.placement
    ? eachCalendarDay(unit.placement.startDate, unit.placement.endDate).filter((date) => isConfirmedInstructionalDay(props.calendar, date))
    : []

  useEffect(() => {
    setMode(null)
    setError(null)
    setTitle(lesson.title)
    setPlannedDate(lesson.plannedDate ?? '')
  }, [lesson.id, lesson.title, lesson.plannedDate])

  const act = (nextMode: ActionMode) => {
    setError(null)
    setMode(nextMode)
  }

  return (
    <div className="object-action-surface">
      <div className="object-focus-facts">
        <span>{unit?.title ?? 'Unit unavailable'}</span>
        <span>{lesson.plannedDate ?? 'Off calendar'}</span>
        {lesson.datePolicy === 'fixed' ? <span>Fixed</span> : null}
      </div>
      <ActionBar onAction={act} unplaceDisabled={!canUnplace} />
      {error ? <p className="object-action-error" role="alert">{error}</p> : null}

      {mode === 'edit' ? (
        <ActionReview title="Edit Lesson">
          <label><span>Lesson title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <ActionCommit label="Save Edit" onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onEditLessonTitle(lesson.id, title)
            if (result) setError(result)
            else setMode(null)
          }} />
        </ActionReview>
      ) : null}

      {mode === 'move' ? (
        <ActionReview title="Move Lesson">
          <label>
            <span>Destination date</span>
            <select disabled={!unit?.placement || validMoveDates.length === 0} value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)}>
              <option value="">Choose a confirmed instructional day</option>
              {validMoveDates.map((date) => <option value={date} key={date}>{date}</option>)}
            </select>
          </label>
          {plannedDate ? <p className="object-action-preview">Preview: {lesson.title} → {plannedDate}</p> : <p className="object-action-preview">Choose a confirmed instructional day inside this Unit.</p>}
          <ActionCommit label="Move Lesson" disabled={!plannedDate} onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onMoveLesson(lesson.id, plannedDate as ISODate)
            if (result) setError(result)
            else setMode(null)
          }} />
        </ActionReview>
      ) : null}

      {mode === 'unplace' ? (
        <ActionReview title="Unplace Lesson">
          <p>Remove this Lesson from the calendar. Its identity, Unit relationship, curriculum content, and teaching history remain.</p>
          {relatedOverrides.length > 0 ? (
            <div className="object-action-impact">
              <strong>Section-specific placements also cleared</strong>
              <ul>{relatedOverrides.map((override) => <OverrideItem key={`${override.sectionId}:${override.lessonId}`} override={override} planning={props.planning} />)}</ul>
            </div>
          ) : <p>No Section-specific placements will be cleared.</p>}
          <p>After Unplace, this Lesson will be visible on the Fridge Door.</p>
          <ActionCommit label="Unplace Lesson" onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onUnplaceLesson(lesson.id)
            if (result) setError(result)
            else props.onChangeFocus({ kind: 'lesson', lessonId: lesson.id })
          }} />
        </ActionReview>
      ) : null}

      {mode === 'delete' ? (
        <ActionReview title="Delete Lesson" destructive>
          <p>Delete {lesson.title}? This is destructive. Arc will block deletion if teaching history or Section-specific placements still reference it. No Undo is promised.</p>
          <ActionCommit label="Delete Lesson" destructive onCancel={() => setMode(null)} onCommit={() => {
            const result = props.onDeleteLesson(lesson.id)
            if (result) setError(result)
            else props.onClose()
          }} />
        </ActionReview>
      ) : null}
    </div>
  )
}

function OverrideItem({ override, planning }: { override: SectionLessonDateOverride; planning: PlanningWorkspace }) {
  const section = planning.sections.find((candidate) => candidate.id === override.sectionId)
  return <li>{section?.name ?? 'Unknown class'} · {override.plannedDate}</li>
}

function ActionBar({ onAction, unplaceDisabled }: { onAction: (mode: Exclude<ActionMode, null>) => void; unplaceDisabled: boolean }) {
  return (
    <div className="object-action-bar" aria-label="Object actions">
      <button type="button" onClick={() => onAction('move')}>Move</button>
      <button type="button" onClick={() => onAction('edit')}>Edit</button>
      <button type="button" disabled={unplaceDisabled} onClick={() => onAction('unplace')}>Unplace</button>
      <button type="button" onClick={() => onAction('delete')}>Delete</button>
    </div>
  )
}

function ActionReview({ title, destructive = false, children }: { title: string; destructive?: boolean; children: React.ReactNode }) {
  return (
    <section className={`object-action-review${destructive ? ' object-action-review--destructive' : ''}`} aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function ActionCommit({ label, onCancel, onCommit, destructive = false, disabled = false }: { label: string; onCancel: () => void; onCommit: () => void; destructive?: boolean; disabled?: boolean }) {
  return (
    <div className="object-action-commit">
      <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
      <button type="button" className={destructive ? 'object-delete-button' : 'primary-button'} disabled={disabled} onClick={onCommit}>{label}</button>
    </div>
  )
}
