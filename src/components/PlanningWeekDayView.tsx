import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { ISODate, PlanNavigationContext } from '../calendar'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningRangeProjection } from '../planning/planningProjection'
import { formatLongDate, formatShortDate, formatWeekday } from './dateLabels'

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
  focusDate,
  planContext,
  onSelectDate,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onSelectDate?: (date: ISODate) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
}) {
  if (planning.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'} data-focus-date={focusDate ?? ''}>
      <PlanningDateHeader days={days} single={single} focusDate={focusDate} onSelectDate={onSelectDate} />
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} focusDate={focusDate} planContext={planContext} onBeginPlanLessonMove={onBeginPlanLessonMove} onOpenRecoveryForSection={onOpenRecoveryForSection} />
      ))}
    </div>
  )
}

function PlanningDateHeader({ days, single, focusDate, onSelectDate }: { days: ProjectedDay[]; single: boolean; focusDate?: string; onSelectDate?: (date: ISODate) => void }) {
  return (
    <div className="planning-date-header" style={gridTemplate(days, focusDate)}>
      <span className="planning-row-label planning-row-label--header" aria-hidden="true">Class</span>
      {days.map((day) => (
        <button type="button" key={day.date} className={`planning-date-heading planning-date-heading--${day.kind}${day.kind !== 'instructional' ? ' planning-date-heading--off' : ''}${day.date === focusDate ? ' planning-date-heading--focus' : ''}`} aria-current={day.date === focusDate ? 'date' : undefined} aria-label={`Open Day for ${formatLongDate(day.date)}${day.kind !== 'instructional' ? `. ${day.label || humanizeKind(day.kind)}` : ''}`} onClick={() => onSelectDate?.(day.date)}>
          {!single ? <span className="planning-date-weekday">{formatWeekday(day.date)}</span> : null}
          <span>{formatShortDate(day.date)}</span>
          {day.kind !== 'instructional' && day.kind !== 'unknown' && day.kind !== 'no-school' ? (
            <span className="planning-date-kind">{day.label || humanizeKind(day.kind)}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

function PlanningCourse({
  course,
  days,
  single,
  focusDate,
  planContext,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
}: {
  course: PlanningCourseGroup
  days: ProjectedDay[]
  single: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
}) {
  return (
    <section className="planning-course" data-course-id={course.course.id} aria-label={`${course.course.title} planning`}>
      <div className="planning-course-heading">
        <h2>{course.course.title}</h2>
      </div>
      {course.unitSpans.length > 0 ? (
        <div className="planning-unit-stack" aria-label={`${course.course.title} Unit spans`}>
          {course.unitSpans.map((unit, index) => (
            <div className="planning-unit-grid" style={gridTemplate(days, focusDate)} key={unit.unitId}>
              <span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span>
              <div
                className="planning-unit-span"
                style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
                title={`${unit.title}: ${unit.startDate} through ${unit.endDate}`}
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
          <div className="planning-section-row" style={gridTemplate(days, focusDate)} key={row.section.id}>
            <div className="planning-row-label">
              <strong>{row.section.name}</strong>
            </div>
            {row.days.map((slot, index) => {
              const dayKind = days[index]?.kind ?? 'unknown'
              const offDay = dayKind !== 'instructional'
              return (
              <div
                key={slot.date}
                className={`planning-day-slot planning-day-slot--${dayKind}${offDay ? ' planning-day-slot--off' : ''}${slot.date === focusDate ? ' planning-day-slot--focus' : ''}`}
                aria-label={`${row.section.name}, ${formatLongDate(slot.date)}${offDay ? `. ${days[index]?.label || humanizeKind(dayKind)}` : ''}`}
              >
                {slot.lessons.map((lesson) => (
                  <LessonTile
                    key={lesson.lessonId}
                    lesson={lesson}
                    sectionId={row.section.id}
                    showActions={planContext?.sectionId === row.section.id || planContext?.courseId === course.course.id}
                    onBeginPlanLessonMove={onBeginPlanLessonMove}
                    onOpenRecoveryForSection={onOpenRecoveryForSection}
                  />
                ))}
                {single && slot.lessons.length === 0 ? <span className="planning-day-empty">No Lesson placed</span> : null}
              </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

function LessonTile({ lesson, sectionId, showActions, onBeginPlanLessonMove, onOpenRecoveryForSection }: { lesson: PlanningLessonPlacement; sectionId: string; showActions?: boolean; onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void; onOpenRecoveryForSection?: (sectionId: string) => void }) {
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate
    ? `Taught ${formatShortDate(lesson.taughtDate)}`
    : null
  const accessible = [
    lesson.title,
    lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date',
    lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan',
    statusLabel,
    taughtLabel,
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
        {taughtLabel ? <span>{taughtLabel}</span> : null}
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
      </div>
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <p className="planning-resume-note">Continue: {lesson.resumeNote}</p>
      ) : null}
      {showActions && (onBeginPlanLessonMove || onOpenRecoveryForSection) ? (
        <LessonProgressiveActions
          lessonId={lesson.lessonId}
          sectionId={sectionId}
          effectiveDate={lesson.effectiveDate}
          inProgress={lesson.deliveryStatus === 'in-progress'}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
        />
      ) : null}
    </article>
  )
}

function LessonProgressiveActions({
  lessonId,
  sectionId,
  effectiveDate,
  inProgress,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
}: {
  lessonId: string
  sectionId: string
  effectiveDate: ISODate
  inProgress: boolean
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const secondary = [
    onBeginPlanLessonMove ? (
      <button key="move" type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId, sectionId, defaultDestination: effectiveDate })}>Move</button>
    ) : null,
    onOpenRecoveryForSection && inProgress ? (
      <button key="shift" type="button" className="text-button recovery-review-trigger" onClick={() => onOpenRecoveryForSection(sectionId)}>Review Shift</button>
    ) : null,
  ].filter(Boolean)

  return (
    <div className={`planning-lesson-actions${moreOpen ? ' is-expanded' : ''}`}>
      <button type="button" className="text-button planning-lesson-open" aria-pressed="true">Open</button>
      {onBeginPlanLessonMove ? (
        <button type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId, sectionId, defaultDestination: effectiveDate })}>Move</button>
      ) : null}
      {secondary.length > 0 ? (
        <button type="button" className="text-button planning-lesson-more-toggle" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>More</button>
      ) : null}
      {moreOpen && secondary.length > 0 ? <div className="planning-lesson-more-panel">{secondary}</div> : null}
    </div>
  )
}

function gridTemplate(days: ProjectedDay[], focusDate?: string): { gridTemplateColumns: string } {
  const columns = days.map((day) => day.date === focusDate ? 'minmax(180px,1.7fr)' : 'minmax(104px,.78fr)')
  return { gridTemplateColumns: `minmax(104px,.8fr) ${columns.join(' ')}` }
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
