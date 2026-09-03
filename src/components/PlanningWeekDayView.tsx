import type { ProjectedDay } from '../calendar/projections'
import type { ISODate } from '../calendar/types'
import type { DayContinuityLesson, DayContinuityProjection } from '../planning/dayContinuityProjection'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningRangeProjection } from '../planning/planningProjection'
import { formatLongDate, formatShortDate, formatWeekday } from './dateLabels'
import { isCalendarObjectSelected, type CalendarObjectSelection } from './calendarObjectSelection'

export function PlanningWeekDayView({
  days,
  planning,
  continuity,
  selection,
  onSelect,
  single = false,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  continuity: DayContinuityProjection[]
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
  single?: boolean
}) {
  if (planning.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'}>
      <PlanningDateHeader days={days} single={single} />
      {planning.courses.map((course) => (
        <PlanningCourse
          key={course.course.id}
          course={course}
          days={days}
          continuity={continuity}
          selection={selection}
          onSelect={onSelect}
          single={single}
        />
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
  continuity,
  selection,
  onSelect,
  single,
}: {
  course: PlanningCourseGroup
  days: ProjectedDay[]
  continuity: DayContinuityProjection[]
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
  single: boolean
}) {
  return (
    <section className="planning-course" aria-label={`${course.course.title} planning`}>
      <div className="planning-course-heading">
        <h2>{course.course.title}</h2>
      </div>
      {course.unitSpans.length > 0 ? (
        <div className="planning-unit-stack">
          {course.unitSpans.map((unit, index) => (
            <div className="planning-unit-grid" style={gridTemplate(days.length)} key={unit.unitId}>
              <span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span>
              <button
                type="button"
                className="calendar-object-select planning-unit-span planning-unit-select"
                style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
                title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`}
                aria-pressed={isCalendarObjectSelected(selection, 'unit', unit.unitId)}
                onClick={() => onSelect({ kind: 'unit', id: unit.unitId })}
              >
                {unit.title}
              </button>
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
            {row.days.map((slot, index) => {
              const carryovers = carryoversFor(continuity, slot.date, course.course.id, row.section.id)
              return (
                <div
                  key={slot.date}
                  className={`planning-day-slot planning-day-slot--${days[index]?.kind ?? 'unknown'}`}
                  aria-label={`${row.section.name}, ${formatLongDate(slot.date)}`}
                >
                  {carryovers.map((lesson) => (
                    <CarryoverTile key={`carryover-${lesson.lessonId}`} lesson={lesson} selection={selection} onSelect={onSelect} />
                  ))}
                  {slot.lessons.map((lesson) => (
                    <LessonTile key={lesson.lessonId} lesson={lesson} selection={selection} onSelect={onSelect} />
                  ))}
                  {single && carryovers.length === 0 && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

function CarryoverTile({
  lesson,
  selection,
  onSelect,
}: {
  lesson: DayContinuityLesson
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  return (
    <button
      type="button"
      className="calendar-object-select planning-lesson planning-lesson--carryover planning-lesson-select"
      aria-pressed={isCalendarObjectSelected(selection, 'lesson', lesson.lessonId)}
      onClick={() => onSelect({ kind: 'lesson', id: lesson.lessonId })}
    >
      <span className="planning-continuity-label">Continue</span>
      <span className="planning-lesson-title-row">
        <span className="planning-lesson-title">{lesson.title}</span>
        {lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}
      </span>
      {lesson.resumeNote ? <span className="planning-resume-note">{lesson.resumeNote}</span> : null}
      <span className="planning-lesson-meta">
        <span>{lesson.unitTitle}</span>
        {lesson.taughtDate ? <span>Last taught {formatShortDate(lesson.taughtDate)}</span> : null}
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
      </span>
    </button>
  )
}

function LessonTile({
  lesson,
  selection,
  onSelect,
}: {
  lesson: PlanningLessonPlacement
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate
    ? `Taught ${formatShortDate(lesson.taughtDate)}`
    : null

  return (
    <button
      type="button"
      className={`calendar-object-select planning-lesson planning-lesson-select planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}`}
      aria-pressed={isCalendarObjectSelected(selection, 'lesson', lesson.lessonId)}
      onClick={() => onSelect({ kind: 'lesson', id: lesson.lessonId })}
    >
      <span className="planning-lesson-title-row">
        <span className="planning-lesson-title">{lesson.title}</span>
        {lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title="Fixed date">Fixed</span> : null}
      </span>
      <span className="planning-lesson-meta">
        <span>{statusLabel}</span>
        {taughtLabel ? <span>{taughtLabel}</span> : null}
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
      </span>
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <span className="planning-resume-note">Continue: {lesson.resumeNote}</span>
      ) : null}
    </button>
  )
}

function carryoversFor(
  continuity: DayContinuityProjection[],
  date: ISODate,
  courseId: string,
  sectionId: string,
): DayContinuityLesson[] {
  const day = continuity.find((item) => item.date === date)
  const course = day?.courses.find((item) => item.courseId === courseId)
  return course?.sections.find((item) => item.sectionId === sectionId)?.carryovers ?? []
}

function gridTemplate(dayCount: number): { gridTemplateColumns: string } {
  return { gridTemplateColumns: `minmax(104px, .8fr) repeat(${dayCount}, minmax(112px, 1fr))` }
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
