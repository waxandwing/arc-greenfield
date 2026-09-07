import type { ProjectedDay } from '../calendar/projections'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningNoteProjection, PlanningRangeProjection } from '../planning/planningProjection'
import { formatLongDate, formatShortDate, formatWeekday } from './dateLabels'

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
}) {
  if (planning.courses.length === 0 && planning.notes.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  const calendarNotes = planning.notes.filter((note) => note.placement === 'calendar')
  const afterSchoolNotes = planning.notes.filter((note) => note.placement === 'after-school')

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'}>
      <PlanningDateHeader days={days} single={single} />
      {calendarNotes.length > 0 ? <PlanningNoteLane label="Notes" notes={calendarNotes} days={days} /> : null}
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} />
      ))}
      {afterSchoolNotes.length > 0 ? <PlanningNoteLane label="After School" notes={afterSchoolNotes} days={days} subordinate /> : null}
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

function PlanningNoteLane({ label, notes, days, subordinate = false }: { label: string; notes: PlanningNoteProjection[]; days: ProjectedDay[]; subordinate?: boolean }) {
  return (
    <section className={`planning-note-lane${subordinate ? ' planning-note-lane--subordinate' : ''}`} aria-label={label}>
      <div className="planning-note-row" style={gridTemplate(days.length)}>
        <div className="planning-row-label planning-row-label--note"><strong>{label}</strong></div>
        {days.map((day) => {
          const dayNotes = notes.filter((note) => note.date === day.date)
          return (
            <div className="planning-note-slot" key={day.date} aria-label={`${label}, ${formatLongDate(day.date)}`} role={dayNotes.length ? 'list' : undefined}>
              {dayNotes.map((note) => <NoteTile key={note.noteId} note={note} />)}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function NoteTile({ note }: { note: PlanningNoteProjection }) {
  const accessible = [
    note.important ? 'Important' : null,
    note.placement === 'after-school' ? 'After School note' : 'Note',
    note.text,
    note.sourceLabel ? `Source ${note.sourceLabel}` : null,
  ].filter(Boolean).join('. ')

  return (
    <article className={`planning-note${note.important ? ' planning-note--important' : ''}`} aria-label={accessible} role="listitem">
      {note.important ? <span className="planning-important-mark" aria-label="Important" title="Important">!</span> : null}
      <span className="planning-note-text">{note.text}</span>
      {note.sourceLabel ? <span className="planning-note-source" title={note.sourceLocator ?? undefined}>Source: {note.sourceLabel}</span> : null}
    </article>
  )
}

function PlanningCourse({
  course,
  days,
  single,
}: {
  course: PlanningCourseGroup
  days: ProjectedDay[]
  single: boolean
}) {
  return (
    <section className="planning-course" aria-labelledby={`planning-course-${course.course.id}`}>
      <div className="planning-course-heading">
        <h2 id={`planning-course-${course.course.id}`}>{course.course.title}</h2>
      </div>
      {course.unitSpans.length > 0 ? (
        <div className="planning-unit-stack" aria-label={`${course.course.title} Unit spans`}>
          {course.unitSpans.map((unit, index) => (
            <div className="planning-unit-grid" style={gridTemplate(days.length)} key={unit.unitId}>
              <span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span>
              <div
                id={unitSpanId(course.course.id, unit.unitId)}
                className="planning-unit-span"
                style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
                title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`}
                aria-label={`Unit ${unit.title}, ${formatLongDate(unit.startDate)} through ${formatLongDate(unit.endDate)}`}
              >
                {unit.title}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="planning-section-list">
        {course.sections.length === 0 ? (
          <p className="planning-course-empty">No Sections are attached to this Course yet.</p>
        ) : course.sections.map((row) => (
          <div className="planning-section-row" style={gridTemplate(days.length)} key={row.section.id}>
            <div className="planning-row-label"><strong>{row.section.name}</strong></div>
            {row.days.map((slot, index) => (
              <div
                key={slot.date}
                className={`planning-day-slot planning-day-slot--${days[index]?.kind ?? 'unknown'}`}
                aria-label={`${row.section.name}, ${formatLongDate(slot.date)}`}
                role={slot.lessons.length > 0 ? 'list' : undefined}
              >
                {slot.lessons.map((lesson) => <LessonTile key={lesson.lessonId} lesson={lesson} courseId={course.course.id} />)}
                {single && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function LessonTile({ lesson, courseId }: { lesson: PlanningLessonPlacement; courseId: string }) {
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate ? `Taught ${formatShortDate(lesson.taughtDate)}` : null
  const accessible = [lesson.title, `Lesson in Unit ${lesson.unitTitle}`, lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date', lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan', statusLabel, taughtLabel, lesson.resumeNote ? `Resume note: ${lesson.resumeNote}` : null].filter(Boolean).join('. ')

  return (
    <article className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}`} aria-label={accessible} aria-describedby={unitSpanId(courseId, lesson.unitId)} role="listitem">
      <span className="planning-lesson-parent">{lesson.unitTitle}</span>
      <div className="planning-lesson-title-row"><span className="planning-lesson-title">{lesson.title}</span>{lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}</div>
      <div className="planning-lesson-meta"><span>{statusLabel}</span>{taughtLabel ? <span>{taughtLabel}</span> : null}{lesson.isSectionOverride ? <span>Shifted for this class</span> : null}</div>
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? <p className="planning-resume-note">Continue: {lesson.resumeNote}</p> : null}
    </article>
  )
}

function unitSpanId(courseId: string, unitId: string): string { return `planning-unit-${courseId}-${unitId}` }
function gridTemplate(dayCount: number): { gridTemplateColumns: string } { return { gridTemplateColumns: `minmax(104px, .8fr) repeat(${dayCount}, minmax(112px, 1fr))` } }
function humanizeKind(kind: ProjectedDay['kind']): string { switch (kind) { case 'no-school': return 'No school'; case 'teacher-workday': return 'Teacher workday'; case 'holiday': return 'Holiday'; case 'break': return 'Break'; case 'instructional': return 'Instructional day'; case 'unknown': return 'Unknown' } }
function humanizeStatus(status: PlanningLessonPlacement['deliveryStatus']): string { switch (status) { case 'not-started': return 'Not started'; case 'in-progress': return 'In progress'; case 'completed': return 'Completed'; case 'skipped': return 'Skipped' } }
