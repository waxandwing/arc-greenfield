import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { ISODate, PlanNavigationContext } from '../calendar'
import { isPlannableDayKind } from '../calendar/schoolCalendar'
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
  onSetLessonImportant,
  lessonImportantById,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onSelectDate?: (date: ISODate) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  lessonImportantById?: (lessonId: string) => boolean
}) {
  if (planning.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'} data-focus-date={focusDate ?? ''}>
      <PlanningDateHeader days={days} single={single} focusDate={focusDate} onSelectDate={onSelectDate} />
      {planning.courses.map((course) => (
        <PlanningCourse key={course.course.id} course={course} days={days} single={single} focusDate={focusDate} planContext={planContext} onBeginPlanLessonMove={onBeginPlanLessonMove} onOpenRecoveryForSection={onOpenRecoveryForSection} onSetLessonImportant={onSetLessonImportant} lessonImportantById={lessonImportantById} />
      ))}
    </div>
  )
}

function PlanningDateHeader({ days, single, focusDate, onSelectDate }: { days: ProjectedDay[]; single: boolean; focusDate?: string; onSelectDate?: (date: ISODate) => void }) {
  return (
    <div className="planning-date-header" style={gridTemplate(days, focusDate)}>
      <span className="planning-row-label planning-row-label--header" aria-hidden="true">Class</span>
      {days.map((day) => (
        <button type="button" key={day.date} className={`planning-date-heading planning-date-heading--${day.kind}${!isPlannableDayKind(day.kind) ? ' planning-date-heading--off' : ''}${day.kind === 'early-release' ? ' planning-date-heading--early-release' : ''}${day.date === focusDate ? ' planning-date-heading--focus' : ''}`} aria-current={day.date === focusDate ? 'date' : undefined} aria-label={`Open Day for ${formatLongDate(day.date)}${!isPlannableDayKind(day.kind) ? `. ${day.label || humanizeKind(day.kind)}` : day.kind === 'early-release' ? `. Early release${day.schoolEndTime ? `, school ends ${day.schoolEndTime}` : ''}` : ''}`} onClick={() => onSelectDate?.(day.date)}>
          {!single ? <span className="planning-date-weekday">{formatWeekday(day.date)}</span> : null}
          <span>{formatShortDate(day.date)}</span>
          {day.kind === 'early-release' ? (
            <span className="planning-date-kind">{day.schoolEndTime ? `Ends ${day.schoolEndTime}` : (day.label || 'Early release')}</span>
          ) : day.kind !== 'instructional' && day.kind !== 'unknown' && day.kind !== 'no-school' ? (
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
  onSetLessonImportant,
  lessonImportantById,
}: {
  course: PlanningCourseGroup
  days: ProjectedDay[]
  single: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  lessonImportantById?: (lessonId: string) => boolean
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
              const offDay = !isPlannableDayKind(dayKind)
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
                    important={lessonImportantById?.(lesson.lessonId) ?? false}
                    selected={planContext?.lessonId === lesson.lessonId}
                    onBeginPlanLessonMove={onBeginPlanLessonMove}
                    onOpenRecoveryForSection={onOpenRecoveryForSection}
                    onSetLessonImportant={onSetLessonImportant}
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

import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, type ArcObjectMenuItem } from './ArcObjectMenu'

function LessonTile({ lesson, sectionId, important = false, selected, onBeginPlanLessonMove, onOpenRecoveryForSection, onSetLessonImportant }: { lesson: PlanningLessonPlacement; sectionId: string; important?: boolean; selected?: boolean; onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void; onOpenRecoveryForSection?: (sectionId: string) => void; onSetLessonImportant?: (lessonId: string, important: boolean) => boolean }) {
  const [touchRevealed, setTouchRevealed] = useState(false)
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const showStatus = lesson.deliveryStatus !== 'not-started' || lesson.datePolicy === 'fixed' || lesson.isSectionOverride
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
  const hasActions = Boolean(onBeginPlanLessonMove || onSetLessonImportant || (onOpenRecoveryForSection && lesson.deliveryStatus === 'in-progress'))

  const menuItems: ArcObjectMenuItem[] = []
  if (onSetLessonImportant) {
    menuItems.push({
      id: 'important',
      label: important ? 'Remove Important' : 'Mark Important',
      onSelect: () => { onSetLessonImportant(lesson.lessonId, !important) },
    })
  }
  if (onBeginPlanLessonMove) {
    menuItems.push({
      id: 'move',
      label: 'Move to date…',
      onSelect: () => onBeginPlanLessonMove({ lessonId: lesson.lessonId, sectionId, defaultDestination: lesson.effectiveDate }),
    })
  }

  return (
    <ArcImportantObject important={important}>
    <article
      className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}${selected || touchRevealed ? ' is-actions-revealed' : ''}`}
      aria-label={accessible}
      tabIndex={hasActions ? 0 : undefined}
      onClick={(event) => {
        if (!hasActions || event.target !== event.currentTarget) return
        setTouchRevealed((value) => !value)
      }}
    >
      <ArcObjectMenu label={lesson.title} items={menuItems}>
      <div className="planning-lesson-title-row">
        <span className="planning-lesson-title" title={lesson.title}>{lesson.title}</span>
        {lesson.datePolicy === 'fixed' ? <span className="planning-lesson-anchor" title={lesson.title}>Fixed</span> : null}
      </div>
      {showStatus ? (
        <div className="planning-lesson-meta">
          {lesson.deliveryStatus !== 'not-started' ? <span>{statusLabel}</span> : null}
          {taughtLabel ? <span>{taughtLabel}</span> : null}
          {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
        </div>
      ) : null}
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <p className="planning-resume-note">Continue: {lesson.resumeNote}</p>
      ) : null}
      </ArcObjectMenu>
      {hasActions ? (
        <LessonProgressiveActions
          lessonId={lesson.lessonId}
          sectionId={sectionId}
          effectiveDate={lesson.effectiveDate}
          inProgress={lesson.deliveryStatus === 'in-progress'}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
          onSetLessonImportant={onSetLessonImportant}
          important={important}
        />
      ) : null}
    </article>
    </ArcImportantObject>
  )
}

function LessonProgressiveActions({
  lessonId,
  sectionId,
  effectiveDate,
  inProgress,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
  onSetLessonImportant,
  important = false,
}: {
  lessonId: string
  sectionId: string
  effectiveDate: ISODate
  inProgress: boolean
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  important?: boolean
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const extras = [
    onSetLessonImportant ? (
      <button key="important" type="button" className="text-button" onClick={() => onSetLessonImportant(lessonId, !important)}>{important ? 'Remove Important' : 'Mark Important'}</button>
    ) : null,
    onOpenRecoveryForSection && inProgress ? (
      <button key="shift" type="button" className="text-button recovery-review-trigger" onClick={() => onOpenRecoveryForSection(sectionId)}>Review Shift</button>
    ) : null,
  ].filter(Boolean)

  if (!onBeginPlanLessonMove && extras.length === 0) return null

  return (
    <div className={`planning-lesson-actions${moreOpen ? ' is-expanded' : ''}`}>
      {onBeginPlanLessonMove ? (
        <button type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId, sectionId, defaultDestination: effectiveDate })}>Move</button>
      ) : null}
      {extras.length > 0 ? (
        <button type="button" className="text-button planning-lesson-more-toggle" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>More</button>
      ) : null}
      {moreOpen && extras.length > 0 ? <div className="planning-lesson-more-panel">{extras}</div> : null}
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
    case 'early-release': return 'Early release'
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
