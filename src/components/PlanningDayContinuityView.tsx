import type { ProjectedDay } from '../calendar/projections'
import type { DayContinuityLesson, DayContinuityProjection } from '../planning/dayContinuityProjection'
import { formatShortDate } from './dateLabels'

export function PlanningDayContinuityView({
  day,
  continuity,
}: {
  day: ProjectedDay
  continuity: DayContinuityProjection
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
              <p className="day-continuity-units">
                <span>Unit</span>
                <strong>{course.activeUnits.map((unit) => unit.title).join(' · ')}</strong>
              </p>
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
                      <div className="day-continuity-held" aria-label={`${section.sectionName} unfinished teaching`}>
                        <p className="day-continuity-kicker">Arc is holding your place</p>
                        {section.carryovers.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} carryover />
                        ))}
                      </div>
                    ) : null}

                    <div className="day-continuity-planned" aria-label={`${section.sectionName} plan for today`}>
                      <p className="day-continuity-kicker">Today’s plan</p>
                      {section.scheduledLessons.length > 0 ? (
                        section.scheduledLessons.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} />
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

function ContinuityLesson({ lesson, carryover = false }: { lesson: DayContinuityLesson; carryover?: boolean }) {
  const status = humanizeStatus(lesson.deliveryStatus)
  const actualDateDiffers = Boolean(lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate)
  const accessible = [
    lesson.title,
    lesson.unitTitle,
    carryover ? 'unfinished teaching Arc is holding' : 'plan for today',
    lesson.datePolicy === 'fixed' ? 'fixed date' : null,
    lesson.isSectionOverride ? 'shifted for this class' : null,
    status,
    lesson.taughtDate ? `taught ${formatShortDate(lesson.taughtDate)}` : null,
    lesson.resumeNote ? `resume note: ${lesson.resumeNote}` : null,
  ].filter(Boolean).join('. ')

  return (
    <div className={`day-continuity-lesson${carryover ? ' day-continuity-lesson--held' : ''}`} aria-label={accessible}>
      <div className="day-continuity-lesson-heading">
        <strong>{lesson.title}</strong>
        {lesson.datePolicy === 'fixed' ? <span className="day-continuity-fixed">Fixed</span> : null}
      </div>
      <p className="day-continuity-lesson-meta">
        <span>{lesson.unitTitle}</span>
        <span>{status}</span>
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
        {carryover && lesson.effectiveDate === null ? <span>No planned date</span> : null}
      </p>
      {carryover && lesson.taughtDate ? (
        <p className="day-continuity-last-taught">Last taught {formatShortDate(lesson.taughtDate)}</p>
      ) : !carryover && actualDateDiffers && lesson.taughtDate ? (
        <p className="day-continuity-last-taught">Taught {formatShortDate(lesson.taughtDate)}</p>
      ) : null}
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <p className="day-continuity-resume"><strong>Continue:</strong> {lesson.resumeNote}</p>
      ) : null}
    </div>
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
