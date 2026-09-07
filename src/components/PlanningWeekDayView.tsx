import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningNoteProjection, PlanningRangeProjection } from '../planning/planningProjection'
import { formatLongDate, formatShortDate, formatWeekday } from './dateLabels'

export type PlanningWeekObjectActions = {
  editUnit?: (unitId: string) => void
  copyUnit?: (unitId: string) => void
  unplaceUnit?: (unitId: string) => void
  deleteUnit?: (unitId: string) => void
  editLesson?: (lessonId: string) => void
  copyLesson?: (lessonId: string) => void
  unplaceLesson?: (lessonId: string) => void
  deleteLesson?: (lessonId: string) => void
  copyNote?: (noteId: string) => void
  deleteNote?: (noteId: string) => void
}

type Selection = { kind: 'unit' | 'lesson' | 'note'; id: string } | null

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

  if (planning.courses.length === 0 && planning.notes.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  const calendarNotes = planning.notes.filter((note) => note.placement === 'calendar')
  const afterSchoolNotes = planning.notes.filter((note) => note.placement === 'after-school')
  const select = (next: Exclude<Selection, null>) => setSelected((current) => current?.kind === next.kind && current.id === next.id ? null : next)
  const dismiss = () => setSelected(null)

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'} onKeyDown={(event) => { if (event.key === 'Escape') dismiss() }}>
      <PlanningDateHeader days={days} single={single} />
      {calendarNotes.length > 0 ? <PlanningNoteLane label="Notes" notes={calendarNotes} days={days} selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} /> : null}
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} />
      ))}
      {afterSchoolNotes.length > 0 ? <PlanningNoteLane label="After School" notes={afterSchoolNotes} days={days} subordinate selected={selected} onSelect={select} actions={actions} onDismiss={dismiss} /> : null}
    </div>
  )
}

function PlanningDateHeader({ days, single }: { days: ProjectedDay[]; single: boolean }) {
  return (
    <div className="planning-date-header" style={gridTemplate(days.length)} aria-hidden="true">
      <span className="planning-row-label planning-row-label--header">Class</span>
      {days.map((day) => (
        <span key={day.date} className={`planning-date-heading planning-date-heading--${day.kind}`}>
          {!single ? <span className="planning-date-weekday">{formatWeekday(day.date)}</span> : null}
          <span>{formatShortDate(day.date)}</span>
          {day.kind !== 'instructional' ? <span className="planning-date-kind">{day.label || humanizeKind(day.kind)}</span> : null}
        </span>
      ))}
    </div>
  )
}

function PlanningNoteLane({ label, notes, days, subordinate = false, selected, onSelect, actions, onDismiss }: { label: string; notes: PlanningNoteProjection[]; days: ProjectedDay[]; subordinate?: boolean; selected: Selection; onSelect: (selection: Exclude<Selection, null>) => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  return (
    <section className={`planning-note-lane${subordinate ? ' planning-note-lane--subordinate' : ''}`} aria-label={label}>
      <div className="planning-note-row" style={gridTemplate(days.length)}>
        <div className="planning-row-label planning-row-label--note"><strong>{label}</strong></div>
        {days.map((day) => {
          const dayNotes = notes.filter((note) => note.date === day.date)
          return (
            <div className="planning-note-slot" key={day.date} aria-label={`${label}, ${formatLongDate(day.date)}`} role={dayNotes.length ? 'list' : undefined}>
              {dayNotes.map((note) => <NoteTile key={note.noteId} note={note} selected={selected?.kind === 'note' && selected.id === note.noteId} onSelect={() => onSelect({ kind: 'note', id: note.noteId })} actions={actions} onDismiss={onDismiss} />)}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function NoteTile({ note, selected, onSelect, actions, onDismiss }: { note: PlanningNoteProjection; selected: boolean; onSelect: () => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const accessible = [note.important ? 'Important' : null, note.placement === 'after-school' ? 'After School note' : 'Note', note.text, note.sourceLabel ? `Source ${note.sourceLabel}` : null].filter(Boolean).join('. ')
  return (
    <article className={`planning-note${note.important ? ' planning-note--important' : ''}${selected ? ' planning-object--selected' : ''}`} role="listitem">
      <button type="button" className="planning-object-select planning-note-select" aria-label={`Select ${accessible}`} aria-pressed={selected} onClick={onSelect}>
        {note.important ? <span className="planning-important-mark" aria-label="Important" title="Important">!</span> : null}
        <span className="planning-note-text">{note.text}</span>
        {note.sourceLabel ? <span className="planning-note-source" title={note.sourceLocator ?? undefined}>Source: {note.sourceLabel}</span> : null}
      </button>
      {selected ? <ContextToolbar label="Note actions" onDismiss={onDismiss} actions={[
        actions?.copyNote ? { label: 'Copy', run: () => actions.copyNote?.(note.noteId) } : null,
        actions?.deleteNote ? { label: 'Delete', run: () => actions.deleteNote?.(note.noteId), destructive: true } : null,
      ]} /> : null}
    </article>
  )
}

function PlanningCourse({ course, days, single, selected, onSelect, actions, onDismiss }: { course: PlanningCourseGroup; days: ProjectedDay[]; single: boolean; selected: Selection; onSelect: (selection: Exclude<Selection, null>) => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  return (
    <section className="planning-course" aria-labelledby={`planning-course-${course.course.id}`}>
      <div className="planning-course-heading"><h2 id={`planning-course-${course.course.id}`}>{course.course.title}</h2></div>
      {course.unitSpans.length > 0 ? (
        <div className="planning-unit-stack" aria-label={`${course.course.title} Unit spans`}>
          {course.unitSpans.map((unit, index) => {
            const isSelected = selected?.kind === 'unit' && selected.id === unit.unitId
            return (
              <div className="planning-unit-grid" style={gridTemplate(days.length)} key={unit.unitId}>
                <span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span>
                <div className={`planning-unit-object${isSelected ? ' planning-object--selected' : ''}`} style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}>
                  <button id={unitSpanId(course.course.id, unit.unitId)} type="button" className="planning-unit-span planning-object-select" title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`} aria-label={`Select Unit ${unit.title}, ${formatLongDate(unit.startDate)} through ${formatLongDate(unit.endDate)}`} aria-pressed={isSelected} onClick={() => onSelect({ kind: 'unit', id: unit.unitId })}>{unit.title}</button>
                  {isSelected ? <ContextToolbar label={`${unit.title} actions`} onDismiss={onDismiss} actions={[
                    actions?.editUnit ? { label: 'Move / resize', run: () => actions.editUnit?.(unit.unitId) } : null,
                    actions?.copyUnit ? { label: 'Copy', run: () => actions.copyUnit?.(unit.unitId) } : null,
                    actions?.unplaceUnit ? { label: 'Unplace', run: () => actions.unplaceUnit?.(unit.unitId) } : null,
                    actions?.deleteUnit ? { label: 'Delete', run: () => actions.deleteUnit?.(unit.unitId), destructive: true } : null,
                  ]} /> : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
      <div className="planning-section-list">
        {course.sections.length === 0 ? <p className="planning-course-empty">No Sections are attached to this Course yet.</p> : course.sections.map((row) => (
          <div className="planning-section-row" style={gridTemplate(days.length)} key={row.section.id}>
            <div className="planning-row-label"><strong>{row.section.name}</strong></div>
            {row.days.map((slot, index) => (
              <div key={slot.date} className={`planning-day-slot planning-day-slot--${days[index]?.kind ?? 'unknown'}`} aria-label={`${row.section.name}, ${formatLongDate(slot.date)}`} role={slot.lessons.length > 0 ? 'list' : undefined}>
                {slot.lessons.map((lesson) => <LessonTile key={lesson.lessonId} lesson={lesson} courseId={course.course.id} selected={selected?.kind === 'lesson' && selected.id === lesson.lessonId} onSelect={() => onSelect({ kind: 'lesson', id: lesson.lessonId })} actions={actions} onDismiss={onDismiss} />)}
                {single && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function LessonTile({ lesson, courseId, selected, onSelect, actions, onDismiss }: { lesson: PlanningLessonPlacement; courseId: string; selected: boolean; onSelect: () => void; actions?: PlanningWeekObjectActions; onDismiss: () => void }) {
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate ? `Taught ${formatShortDate(lesson.taughtDate)}` : null
  const accessible = [lesson.title, `Lesson in Unit ${lesson.unitTitle}`, lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date', lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan', statusLabel, taughtLabel, lesson.resumeNote ? `Resume note: ${lesson.resumeNote}` : null].filter(Boolean).join('. ')
  return (
    <article className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}${selected ? ' planning-object--selected' : ''}`} aria-describedby={unitSpanId(courseId, lesson.unitId)} role="listitem">
      <button type="button" className="planning-object-select planning-lesson-select" aria-label={`Select ${accessible}`} aria-pressed={selected} onClick={onSelect}>
        <span className="planning-lesson-parent">{lesson.unitTitle}</span>
        <span className="planning-lesson-title-row"><span className="planning-lesson-title">{lesson.title}</span>{lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}</span>
        <span className="planning-lesson-meta"><span>{statusLabel}</span>{taughtLabel ? <span>{taughtLabel}</span> : null}{lesson.isSectionOverride ? <span>Shifted for this class</span> : null}</span>
        {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? <span className="planning-resume-note">Continue: {lesson.resumeNote}</span> : null}
      </button>
      {selected ? <ContextToolbar label={`${lesson.title} actions`} onDismiss={onDismiss} actions={[
        actions?.editLesson ? { label: 'Move / edit', run: () => actions.editLesson?.(lesson.lessonId) } : null,
        actions?.copyLesson ? { label: 'Copy', run: () => actions.copyLesson?.(lesson.lessonId) } : null,
        actions?.unplaceLesson ? { label: 'Unplace', run: () => actions.unplaceLesson?.(lesson.lessonId) } : null,
        actions?.deleteLesson ? { label: 'Delete', run: () => actions.deleteLesson?.(lesson.lessonId), destructive: true } : null,
      ]} /> : null}
    </article>
  )
}

type ToolbarAction = { label: string; run: () => void; destructive?: boolean } | null
function ContextToolbar({ label, actions, onDismiss }: { label: string; actions: ToolbarAction[]; onDismiss: () => void }) {
  const available = actions.filter((action): action is Exclude<ToolbarAction, null> => Boolean(action))
  return (
    <div className="planning-context-toolbar" role="toolbar" aria-label={label}>
      {available.map((action) => <button key={action.label} type="button" className={action.destructive ? 'planning-context-action planning-context-action--danger' : 'planning-context-action'} onClick={(event) => { event.stopPropagation(); action.run() }}>{action.label}</button>)}
      <button type="button" className="planning-context-dismiss" aria-label="Close object actions" onClick={(event) => { event.stopPropagation(); onDismiss() }}>×</button>
    </div>
  )
}

function unitSpanId(courseId: string, unitId: string): string { return `planning-unit-${courseId}-${unitId}` }
function gridTemplate(dayCount: number): { gridTemplateColumns: string } { return { gridTemplateColumns: `minmax(104px, .8fr) repeat(${dayCount}, minmax(112px, 1fr))` } }
function humanizeKind(kind: ProjectedDay['kind']): string { switch (kind) { case 'no-school': return 'No school'; case 'teacher-workday': return 'Teacher workday'; case 'holiday': return 'Holiday'; case 'break': return 'Break'; case 'instructional': return 'Instructional day'; case 'unknown': return 'Unknown' } }
function humanizeStatus(status: PlanningLessonPlacement['deliveryStatus']): string { switch (status) { case 'not-started': return 'Not started'; case 'in-progress': return 'In progress'; case 'completed': return 'Completed'; case 'skipped': return 'Skipped' } }
