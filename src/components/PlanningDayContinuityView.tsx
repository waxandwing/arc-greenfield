import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { DayContinuityLesson, DayContinuityProjection } from '../planning/dayContinuityProjection'
import type { LessonWorkspace, PlanningWorkspace, TeachingDayBlock } from '../planning'
import { formatShortDate } from './dateLabels'

export function PlanningDayContinuityView({
  day,
  continuity,
  onStartClass,
  lessons,
  planning,
}: {
  day: ProjectedDay
  continuity: DayContinuityProjection
  onStartClass?: (sectionId: string, lessonId: string) => void
  lessons: LessonWorkspace
  planning: PlanningWorkspace
}) {
  const periods = continuity.courses.flatMap((course) => course.sections.map((section) => ({ course, section })))
    .sort((a, b) => periodNumber(a.section.sectionName) - periodNumber(b.section.sectionName))
  const numberedPeriods = periods.map((entry) => ({ entry, number: periodNumber(entry.section.sectionName) })).filter(({ number }) => Number.isFinite(number))
  const firstPeriod = numberedPeriods[0]?.number ?? 1
  const lastPeriod = numberedPeriods.at(-1)?.number ?? 0
  const legacyRail = Array.from({ length: Math.max(0, lastPeriod - firstPeriod + 1) }, (_, index) => {
    const number = firstPeriod + index
    const entry = numberedPeriods.find((candidate) => candidate.number === number)?.entry ?? null
    return { id: entry?.section.sectionId ?? `legacy-planning-${number}`, label: `Period ${number}`, type: entry ? 'teaching' as const : 'planning' as const, entry, block: null }
  })
  const explicitRail = planning.teachingDay?.blocks.map((block) => ({
    id: block.id,
    label: block.label,
    type: block.type,
    entry: block.sectionId ? periods.find((candidate) => candidate.section.sectionId === block.sectionId) ?? null : null,
    block,
  })) ?? []
  const periodRail = explicitRail.length > 0 ? explicitRail : legacyRail
  const [selectedBlockId, setSelectedBlockId] = useState(periodRail[0]?.id ?? '')
  const selectedRail = periodRail.find((item) => item.id === selectedBlockId) ?? periodRail[0] ?? null
  const selected = selectedRail?.entry ?? null

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
          {periodRail.map(({ id, label, type, entry, block }) => entry ? (
            <button type="button" className={`day-period-button${id === selectedRail?.id ? ' is-selected' : ''}`} aria-current={id === selectedRail?.id ? 'true' : undefined} onClick={() => setSelectedBlockId(id)} key={id}>
              <span>{label}{blockTimes(block)}</span><strong>{entry.course.courseTitle}</strong>
            </button>
          ) : <button type="button" className={`day-period-gap${id === selectedRail?.id ? ' is-selected' : ''}`} aria-current={id === selectedRail?.id ? 'true' : undefined} aria-label={`${label}, ${type === 'planning' ? 'planning time' : 'non-teaching time'}`} onClick={() => setSelectedBlockId(id)} key={id}><span>{label}{blockTimes(block)}</span><strong>{type === 'planning' ? 'Planning time' : 'Lunch / other'}</strong></button>)}
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
      ) : selectedRail?.type === 'planning' ? <PlanningPeriodLens label={selectedRail.label} date={day.date} continuity={continuity} lessons={lessons} /> : <NonTeachingLens label={selectedRail?.label ?? 'Non-teaching block'} />}
    </div>
  )
}

function PlanningPeriodLens({ label, date, continuity, lessons }: { label: string; date: string; continuity: DayContinuityProjection; lessons: LessonWorkspace }) {
  return (
    <section className="planning-period-lens" aria-label={`${label} planning time`}>
      <header><div><p className="day-continuity-kicker">{label} · Planning time</p><h2>Pull the week into focus.</h2></div><p>Unfinished teaching, what comes next, and loose Lesson work across every prep.</p></header>
      <div className="planning-period-courses">
        {continuity.courses.map((course) => {
          const courseLessons = lessons.lessons.filter((lesson) => lesson.courseId === course.courseId)
          const next = courseLessons.filter((lesson) => lesson.plannedDate && lesson.plannedDate >= date).sort((a, b) => (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') || a.sequence - b.sequence)[0]
          const unfinished = course.sections.flatMap((section) => section.carryovers.map((lesson) => ({ section: section.sectionName, lesson })))
          const loose = courseLessons.filter((lesson) => lesson.plannedDate === null)
          return <article key={course.courseId}><h3>{course.courseTitle}</h3><p className="planning-period-sections">{course.sections.map((section) => section.sectionName).join(' · ')}</p>{unfinished.length ? <p><strong>Pick up:</strong> {unfinished.map((item) => `${item.section} — ${item.lesson.title}`).join('; ')}</p> : <p><strong>Pacing:</strong> Sections are aligned with no unfinished teaching held.</p>}<p><strong>Next:</strong> {next ? `${next.title} · ${formatShortDate(next.plannedDate!)}` : 'No dated Lesson ahead.'}</p>{loose.length ? <p><strong>Workspace:</strong> {loose.map((lesson) => lesson.title).join(', ')}</p> : null}</article>
        })}
      </div>
    </section>
  )
}

function NonTeachingLens({ label }: { label: string }) {
  return <section className="planning-period-lens" aria-label={`${label}, non-teaching time`}><header><div><p className="day-continuity-kicker">{label}</p><h2>This part of the day is yours.</h2></div><p>Arc keeps class plans quiet during lunch and other non-teaching blocks.</p></header></section>
}

function blockTimes(block: TeachingDayBlock | null): string {
  return block?.startTime && block.endTime ? ` · ${block.startTime}–${block.endTime}` : ''
}

function periodNumber(label: string): number {
  const match = label.match(/\d+/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
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
