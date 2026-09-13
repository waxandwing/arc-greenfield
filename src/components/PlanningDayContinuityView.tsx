import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { DayContinuityLesson, DayContinuityProjection } from '../planning/dayContinuityProjection'
import { formatShortDate } from './dateLabels'

export function PlanningDayContinuityView({
  day,
  continuity,
  onStartClass,
}: {
  day: ProjectedDay
  continuity: DayContinuityProjection
  onStartClass?: (sectionId: string, lessonId: string) => void
}) {
  const periods = continuity.courses.flatMap((course) => course.sections.map((section) => ({ course, section })))
    .sort((a, b) => periodNumber(a.section.sectionName) - periodNumber(b.section.sectionName))
  const [selectedSectionId, setSelectedSectionId] = useState(periods[0]?.section.sectionId ?? '')
  const selected = periods.find(({ section }) => section.sectionId === selectedSectionId) ?? periods[0]

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

      {periods.length > 0 ? (
        <nav className="day-period-rail" aria-label="Teaching day periods">
          {periods.map(({ course, section }) => (
            <button type="button" className={`day-period-button${section.sectionId === selected?.section.sectionId ? ' is-selected' : ''}`} aria-current={section.sectionId === selected?.section.sectionId ? 'true' : undefined} onClick={() => setSelectedSectionId(section.sectionId)} key={section.sectionId}>
              <span>{section.sectionName}</span><strong>{course.courseTitle}</strong>
            </button>
          ))}
        </nav>
      ) : null}

      {selected ? (
        <section className="day-continuity-course day-continuity-course--focus" aria-label={`${selected.course.courseTitle} today`} key={selected.course.courseId}>
          <header className="day-continuity-course-heading">
            <div><p className="day-continuity-kicker">Focused teaching moment · {selected.section.sectionName}</p><h2>{selected.course.courseTitle}</h2></div>
            {selected.course.activeUnits.length > 0 ? (
              <p className="day-continuity-units">
                <span>Unit</span>
                <strong>{selected.course.activeUnits.map((unit) => unit.title).join(' · ')}</strong>
              </p>
            ) : null}
          </header>

          <div className="day-continuity-sections">
                <article className="day-continuity-section" key={selected.section.sectionId}>
                  <header className="day-continuity-section-heading">
                    <h3>{selected.section.sectionName}</h3>
                  </header>

                  <div className="day-continuity-work">
                    {selected.section.carryovers.length > 0 ? (
                      <section className="day-continuity-held" aria-label={`${selected.section.sectionName} unfinished teaching`}>
                        <p className="day-continuity-kicker">Arc is holding your place</p>
                        {selected.section.carryovers.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={selected.section.sectionId} onStartClass={onStartClass} carryover />
                        ))}
                      </section>
                    ) : null}

                    <section className="day-continuity-planned" aria-label={`${selected.section.sectionName} plan for today`}>
                      <p className="day-continuity-kicker">Today’s plan</p>
                      {selected.section.scheduledLessons.length > 0 ? (
                        selected.section.scheduledLessons.map((lesson) => (
                          <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={selected.section.sectionId} onStartClass={onStartClass} />
                        ))
                      ) : (
                        <p className="day-continuity-empty">No Lesson placed for this class.</p>
                      )}
                    </section>
                  </div>
                </article>
          </div>
        </section>
      ) : <p className="planning-course-empty">No Sections are attached to these Courses yet.</p>}
    </div>
  )
}

function periodNumber(label: string): number {
  const match = label.match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

function ContinuityLesson({ lesson, sectionId, onStartClass, carryover = false }: { lesson: DayContinuityLesson; sectionId: string; onStartClass?: (sectionId: string, lessonId: string) => void; carryover?: boolean }) {
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
    <article className={`day-continuity-lesson${carryover ? ' day-continuity-lesson--held' : ''}`} aria-label={accessible}>
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
      {onStartClass && (lesson.deliveryStatus === 'not-started' || lesson.deliveryStatus === 'in-progress') ? (
        <button type="button" className="day-start-class" onClick={() => onStartClass(sectionId, lesson.lessonId)}>{lesson.deliveryStatus === 'in-progress' ? 'Resume in ArcTable' : 'Start class'}</button>
      ) : null}
    </article>
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
