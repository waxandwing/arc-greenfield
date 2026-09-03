import type { ProjectedDay } from '../calendar/projections'
import type { ISODate } from '../calendar/types'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningRangeProjection } from '../planning/planningProjection'

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
}) {
  if (planning.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes, Units, and Lessons to place teaching work on the calendar.</p>
  }

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'}>
      <PlanningDateHeader days={days} single={single} />
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} />
      ))}
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
    <section className="planning-course" aria-label={`${course.course.title} planning`}>
      <div className="planning-course-heading">
        <h2>{course.course.title}</h2>
      </div>
      {course.unitSpans.length > 0 ? (
        <div className="planning-unit-grid" style={gridTemplate(days.length)} aria-label={`${course.course.title} Unit spans`}>
          <span className="planning-row-label planning-row-label--unit">Unit</span>
          {course.unitSpans.map((unit) => (
            <div
              key={unit.unitId}
              className="planning-unit-span"
              style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
              title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`}
            >
              {unit.title}
            </div>
          ))}
        </div>
      ) : null}
      <div className="planning-section-list">
        {course.sections.length === 0 ? (
          <p className="planning-course-empty">No Sections are attached to this Course yet.</p>
        ) : course.sections.map((row) => (
          <div className="planning-section-row" style={gridTemplate(days.length)} key={row.section.id}>
            <div className="planning-row-label">
              <strong>{row.section.name}</strong>
            </div>
            {row.days.map((slot, index) => (
              <div
                key={slot.date}
                className={`planning-day-slot planning-day-slot--${days[index]?.kind ?? 'unknown'}`}
                aria-label={`${row.section.name}, ${formatLongDate(slot.date)}`}
              >
                {slot.lessons.map((lesson) => <LessonTile key={lesson.lessonId} lesson={lesson} />)}
                {single && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function LessonTile({ lesson }: { lesson: PlanningLessonPlacement }) {
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const accessible = [
    lesson.title,
    lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date',
    lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan',
    statusLabel,
    lesson.resumeNote ? `Resume note: ${lesson.resumeNote}` : null,
  ].filter(Boolean).join('. ')

  return (
    <article
      className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}`}
      aria-label={accessible}
    >
      <div className="planning-lesson-title-row">
        <span className="planning-lesson-title">{lesson.title}</span>
        {lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}
      </div>
      <div className="planning-lesson-meta">
        <span>{statusLabel}</span>
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
      </div>
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <p className="planning-resume-note">Continue: {lesson.resumeNote}</p>
      ) : null}
    </article>
  )
}

function gridTemplate(dayCount: number): { gridTemplateColumns: string } {
  return { gridTemplateColumns: `minmax(104px, .8fr) repeat(${dayCount}, minmax(112px, 1fr))` }
}

function formatWeekday(date: ISODate): string {
  return formatter({ weekday: 'short' }).format(toUTCDate(date))
}

function formatShortDate(date: ISODate): string {
  return formatter({ month: 'short', day: 'numeric' }).format(toUTCDate(date))
}

function formatLongDate(date: ISODate): string {
  return formatter({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(toUTCDate(date))
}

function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' })
}

function toUTCDate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function humanizeKind(kind: ProjectedDay['kind']): string {
  switch (kind) {
    case 'no-school': return 'No school'
    case 'teacher-workday': return 'Teacher workday'
    case 'holiday': return 'Holiday'
    case 'break': return 'Break'
    case 'instructional': return 'Instructional day'
    case 'unknown': return 'Unknown'
  }
}

function humanizeStatus(status: PlanningLessonPlacement['deliveryStatus']): string {
  switch (status) {
    case 'not-started': return 'Not started'
    case 'in-progress': return 'In progress'
    case 'completed': return 'Completed'
    case 'skipped': return 'Skipped'
  }
}
