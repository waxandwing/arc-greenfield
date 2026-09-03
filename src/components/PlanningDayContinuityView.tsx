import type { ProjectedDay } from '../calendar/projections'
import type { DayContinuityLesson, DayContinuityProjection } from '../planning/dayContinuityProjection'
import { formatShortDate } from './dateLabels'
import { isCalendarObjectSelected, type CalendarObjectSelection } from './calendarObjectSelection'

export function PlanningDayContinuityView({
  day,
  continuity,
  selection,
  onSelect,
}: {
  day: ProjectedDay
  continuity: DayContinuityProjection
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  if (continuity.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className="day-continuity">
      {day.kind !== 'instructional' ? (
        <p className="day-continuity-day-note">
          <strong>{day.label || humanizeKind(day.kind)}</strong>
          <span>Day view stays available so notes and unfinished teaching context do not disappear.</span>
        </p>
      ) : null}

      {continuity.courses.map((course) => (
        <section className="day-continuity-course" aria-label={`${course.courseTitle} today`} key={course.courseId}>
          <header className="day-continuity-course-heading">
            <h2>{course.courseTitle}</h2>
            {course.activeUnits.length > 0 ? (
              <div className="day-continuity-units">
                <span>Unit</span>
                <span className="day-continuity-unit-options">
                  {course.activeUnits.map((unit, index) => (
                    <span key={unit.unitId}>
                      {index > 0 ? <span aria-hidden="true"> · </span> : null}
                      <button
                        type="button"
                        className="calendar-object-select day-continuity-unit-select"
                        aria-pressed={isCalendarObjectSelected(selection, 'unit', unit.unitId)}
                        onClick={() => onSelect({ kind: 'unit', id: unit.unitId })}
                      >
                        {unit.title}
                      </button>
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
          </header>

          {course.sections.length === 0 ? (
            <p className="planning-course-empty">No Sections are attached to this Course yet.</p>
          ) : (
            <div className="day-continuity-sections">
              {course.sections.map((section) => (
                <article className="day-continuity-section" key={section.sectionId}>
                  <header className="day-continuity-section-heading">
                    <h3>{section.sectionName}</h3>
                  </header>

                  <div className="day-continuity-work">
                    {section.carryovers.length > 0 ? (
                      <div className="day-continuity-held">
                        <p className="day-continuity-kicker">Arc is holding your place</p>
                        {section.carryovers.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} carryover selection={selection} onSelect={onSelect} />
                        ))}
                      </div>
                    ) : null}

                    <div className="day-continuity-planned">
                      <p className="day-continuity-kicker">{section.carryovers.length > 0 ? 'Planned today' : 'Today’s plan'}</p>
                      {section.scheduledLessons.length > 0 ? (
                        section.scheduledLessons.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} selection={selection} onSelect={onSelect} />
                        ))
                      ) : (
                        <p className="day-continuity-empty">No Lesson placed for this class.</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function ContinuityLesson({
  lesson,
  carryover = false,
  selection,
  onSelect,
}: {
  lesson: DayContinuityLesson
  carryover?: boolean
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  const status = humanizeStatus(lesson.deliveryStatus)
  const actualDateDiffers = Boolean(lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate)
  const visibleMeta = [
    lesson.unitTitle,
    status,
    lesson.isSectionOverride ? 'Shifted for this class' : null,
    carryover && lesson.effectiveDate === null ? 'No planned date' : null,
  ].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      className="calendar-object-select day-continuity-lesson"
      aria-pressed={isCalendarObjectSelected(selection, 'lesson', lesson.lessonId)}
      onClick={() => onSelect({ kind: 'lesson', id: lesson.lessonId })}
    >
      <span className="day-continuity-lesson-heading">
        <strong>{lesson.title}</strong>
        {lesson.datePolicy === 'fixed' ? <span className="day-continuity-fixed">Fixed</span> : null}
      </span>

      {carryover && lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <span className="day-continuity-resume">{lesson.resumeNote}</span>
      ) : null}

      {carryover && lesson.taughtDate ? (
        <span className="day-continuity-last-taught">Last taught {formatShortDate(lesson.taughtDate)}</span>
      ) : null}

      <span className="day-continuity-lesson-meta">{visibleMeta}</span>

      {!carryover && actualDateDiffers && lesson.taughtDate ? (
        <span className="day-continuity-last-taught">Taught {formatShortDate(lesson.taughtDate)}</span>
      ) : null}

      {!carryover && lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <span className="day-continuity-resume"><strong>Continue:</strong> {lesson.resumeNote}</span>
      ) : null}
    </button>
  )
}

function humanizeStatus(status: DayContinuityLesson['deliveryStatus']): string {
  switch (status) {
    case 'not-started': return 'Not started'
    case 'in-progress': return 'In progress'
    case 'completed': return 'Completed'
    case 'skipped': return 'Skipped'
  }
}

function humanizeKind(kind: ProjectedDay['kind']): string {
  switch (kind) {
    case 'no-school': return 'No school'
    case 'teacher-workday': return 'Teacher workday'
    case 'holiday': return 'Holiday'
    case 'break': return 'Break'
    case 'unknown': return 'Calendar status unknown'
    case 'instructional': return 'Instructional day'
  }
}
