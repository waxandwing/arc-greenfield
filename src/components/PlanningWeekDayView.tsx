import { useState, type MouseEvent } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { ISODate, PlanNavigationContext } from '../calendar'
import { isPlannableDayKind } from '../calendar/schoolCalendar'
import type { PlanningNote } from '../planning'
import type { PlanningCourseGroup, PlanningLessonPlacement, PlanningRangeProjection, PlanningUnitSpan } from '../planning/planningProjection'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, type ArcObjectMenuItem } from './ArcObjectMenu'
import { CalendarDayNotes, type CalendarDayNoteHandlers } from './CalendarDayNotes'
import { DeskNotesObject } from './DeskNotesObject'
import { formatKellyDeskDayNumber, formatKellyDeskWeekday, formatLongDate, formatShortDate } from './dateLabels'

type SelectLessonHandler = (lesson: {
  lessonId: string
  unitId: string
  courseId: string
  sectionId?: string
  date?: ISODate
}) => void

type SelectUnitHandler = (input: { date: ISODate; courseId: string; unitId: string }) => void

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
  focusDate,
  planContext,
  onSelectDate,
  onSelectLesson,
  onSelectUnit,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
  onSetLessonImportant,
  onStartClass,
  lessonImportantById,
  deskNotes = null,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  single?: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onSelectDate?: (date: ISODate) => void
  onSelectLesson?: SelectLessonHandler
  onSelectUnit?: SelectUnitHandler
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
  lessonImportantById?: (lessonId: string) => boolean
  /**
   * Optional desk notes — when set, renders a day-aligned strip between the CLASS/date
   * header and the first course row. Omit entirely when the Desk setup toggle is off
   * so no leftover gap remains.
   */
  deskNotes?: { notes: PlanningNote[]; handlers: CalendarDayNoteHandlers } | null
}) {
  if (planning.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className={single ? 'planning-grid planning-grid--day' : 'planning-grid'} data-focus-date={focusDate ?? ''}>
      <PlanningDateHeader days={days} single={single} focusDate={focusDate} onSelectDate={onSelectDate} />
      {deskNotes ? (
        <PlanningDeskNotesStrip
          days={days}
          focusDate={focusDate}
          notes={deskNotes.notes}
          handlers={deskNotes.handlers}
        />
      ) : null}
      {planning.courses.map((course) => (
        <PlanningCourse
          key={course.course.id}
          course={course}
          days={days}
          single={single}
          focusDate={focusDate}
          planContext={planContext}
          onSelectLesson={onSelectLesson}
          onSelectUnit={onSelectUnit}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
          onSetLessonImportant={onSetLessonImportant}
          onStartClass={onStartClass}
          lessonImportantById={lessonImportantById}
        />
      ))}
    </div>
  )
}

/** Day-column notes band — sits under weekday/date headers, above the first course row. */
function PlanningDeskNotesStrip({
  days,
  focusDate,
  notes,
  handlers,
}: {
  days: ProjectedDay[]
  focusDate?: string
  notes: PlanningNote[]
  handlers: CalendarDayNoteHandlers
}) {
  const dateBounds = days.length > 0
    ? { min: days[0].date, max: days[days.length - 1].date }
    : undefined

  return (
    <div className="planning-desk-notes-strip" data-testid="planning-desk-notes-strip">
      <DeskNotesObject strip>
        <div
          className="planning-desk-notes-row"
          style={gridTemplate(days)}
          role="row"
          aria-label="Desk notes by day"
        >
          <span className="planning-row-label planning-row-label--notes" aria-hidden="true">Notes</span>
          {days.map((day) => (
            <div
              key={day.date}
              className={`planning-desk-notes-cell${day.date === focusDate ? ' planning-desk-notes-cell--focus' : ''}${!isPlannableDayKind(day.kind) ? ' planning-desk-notes-cell--off' : ''}`}
              data-testid={`planning-desk-notes-cell-${day.date}`}
              data-day-notes-date={day.date}
              data-desk-postit-drop="date"
              data-desk-postit-date={day.date}
            >
              <CalendarDayNotes
                notes={notes}
                date={day.date}
                compact
                dateBounds={dateBounds}
                handlers={handlers}
              />
            </div>
          ))}
        </div>
      </DeskNotesObject>
    </div>
  )
}

function PlanningDateHeader({ days, single, focusDate, onSelectDate }: { days: ProjectedDay[]; single: boolean; focusDate?: string; onSelectDate?: (date: ISODate) => void }) {
  return (
    <div className="planning-date-header" style={gridTemplate(days)}>
      <span className="planning-row-label planning-row-label--header" aria-hidden="true">Class</span>
      {days.map((day) => (
        <button type="button" key={day.date} className={`planning-date-heading planning-date-heading--${day.kind}${!isPlannableDayKind(day.kind) ? ' planning-date-heading--off' : ''}${day.kind === 'early-release' ? ' planning-date-heading--early-release' : ''}${day.date === focusDate ? ' planning-date-heading--focus' : ''}`} aria-current={day.date === focusDate ? 'date' : undefined} aria-label={`Open Day for ${formatLongDate(day.date)}${!isPlannableDayKind(day.kind) ? `. ${day.label || humanizeKind(day.kind)}` : day.kind === 'early-release' ? `. Early release${day.schoolEndTime ? `, school ends ${day.schoolEndTime}` : ''}` : ''}`} data-desk-postit-drop="date" data-desk-postit-date={day.date} data-date={day.date} onClick={() => onSelectDate?.(day.date)}>
          {!single ? <span className="planning-date-weekday">{formatKellyDeskWeekday(day.date)}</span> : null}
          <span className="planning-date-day">{single ? formatShortDate(day.date) : formatKellyDeskDayNumber(day.date)}</span>
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
  onSelectLesson,
  onSelectUnit,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
  onSetLessonImportant,
  onStartClass,
  lessonImportantById,
}: {
  course: PlanningCourseGroup
  days: ProjectedDay[]
  single: boolean
  focusDate?: string
  planContext?: PlanNavigationContext | null
  onSelectLesson?: SelectLessonHandler
  onSelectUnit?: SelectUnitHandler
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
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
            <div className="planning-unit-grid" style={gridTemplate(days)} key={unit.unitId}>
              <span className="planning-row-label planning-row-label--unit">{index === 0 ? 'Unit' : ''}</span>
              <UnitSpanButton unit={unit} onSelectUnit={onSelectUnit} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="planning-section-list">
        {course.sections.length === 0 ? (
          <p className="planning-course-empty">No Sections are attached to this Course yet.</p>
        ) : course.sections.map((row) => (
          <div className="planning-section-row" style={gridTemplate(days)} key={row.section.id}>
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
                    slotDate={slot.date}
                    focusDate={focusDate}
                    important={lessonImportantById?.(lesson.lessonId) ?? false}
                    selected={planContext?.lessonId === lesson.lessonId}
                    onSelectLesson={onSelectLesson}
                    onBeginPlanLessonMove={onBeginPlanLessonMove}
                    onOpenRecoveryForSection={onOpenRecoveryForSection}
                    onSetLessonImportant={onSetLessonImportant}
                    onStartClass={onStartClass}
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

function UnitSpanButton({
  unit,
  onSelectUnit,
}: {
  unit: PlanningUnitSpan
  onSelectUnit?: SelectUnitHandler
}) {
  const title = `${unit.title}: ${unit.startDate} through ${unit.endDate}`
  if (!onSelectUnit) {
    return (
      <div
        className="planning-unit-span"
        style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
        title={title}
      >
        {unit.title}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="planning-unit-span planning-unit-span--open"
      style={{ gridColumn: `${unit.startIndex + 2} / ${unit.endIndex + 3}` }}
      title={title}
      aria-label={`Open ${unit.title} in Month at unit start`}
      onClick={() => onSelectUnit({ date: unit.startDate, courseId: unit.courseId, unitId: unit.unitId })}
    >
      {unit.title}
    </button>
  )
}

function LessonTile({
  lesson,
  sectionId,
  slotDate,
  focusDate,
  important = false,
  selected,
  onSelectLesson,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
  onSetLessonImportant,
  onStartClass,
}: {
  lesson: PlanningLessonPlacement
  sectionId: string
  slotDate: ISODate
  focusDate?: string
  important?: boolean
  selected?: boolean
  onSelectLesson?: SelectLessonHandler
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
}) {
  const [touchRevealed, setTouchRevealed] = useState(false)
  const statusLabel = humanizeStatus(lesson.deliveryStatus)
  const showStatus = lesson.deliveryStatus !== 'not-started' || lesson.datePolicy === 'fixed' || lesson.isSectionOverride
  const taughtLabel = lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate
    ? `Taught ${formatShortDate(lesson.taughtDate)}`
    : null
  const canStartClass =
    Boolean(onStartClass) &&
    (lesson.deliveryStatus === 'not-started' || lesson.deliveryStatus === 'in-progress') &&
    (!focusDate || slotDate === focusDate)
  const hasActions = Boolean(onBeginPlanLessonMove || onSetLessonImportant || (onOpenRecoveryForSection && lesson.deliveryStatus === 'in-progress') || canStartClass)

  const accessible = [
    lesson.title,
    lesson.datePolicy === 'fixed' ? 'fixed date' : 'flexible date',
    lesson.isSectionOverride ? 'Section-specific date' : 'shared Course plan',
    statusLabel,
    taughtLabel,
    lesson.resumeNote ? `Resume note: ${lesson.resumeNote}` : null,
  ].filter(Boolean).join('. ')

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

  function openPlanningSurface(event: MouseEvent) {
    if (!onSelectLesson) return
    event.stopPropagation()
    onSelectLesson({ ...lesson, sectionId, date: slotDate })
  }

  return (
    <ArcImportantObject important={important}>
    <article
      className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}${selected || touchRevealed ? ' is-actions-revealed' : ''}`}
      aria-label={accessible}
      tabIndex={hasActions ? 0 : undefined}
      onClick={(event) => {
        if (!hasActions) return
        const target = event.target as HTMLElement
        if (target.closest('button, a, [role="menuitem"]')) return
        setTouchRevealed((value) => !value)
      }}
    >
      <ArcObjectMenu label={lesson.title} items={menuItems}>
      <div className="planning-lesson-title-row">
        {onSelectLesson ? (
          <button
            type="button"
            className="planning-lesson-title planning-lesson-title--open"
            title={lesson.title}
            aria-label={`Open ${lesson.title} lesson plan`}
            onClick={openPlanningSurface}
          >
            {lesson.title}
          </button>
        ) : (
          <span className="planning-lesson-title" title={lesson.title}>{lesson.title}</span>
        )}
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
          liveDate={slotDate}
          inProgress={lesson.deliveryStatus === 'in-progress'}
          canStartClass={canStartClass}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
          onSetLessonImportant={onSetLessonImportant}
          onStartClass={onStartClass}
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
  liveDate,
  inProgress,
  canStartClass = false,
  onBeginPlanLessonMove,
  onOpenRecoveryForSection,
  onSetLessonImportant,
  onStartClass,
  important = false,
}: {
  lessonId: string
  sectionId: string
  effectiveDate: ISODate
  liveDate: ISODate
  inProgress: boolean
  canStartClass?: boolean
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
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

  if (!onBeginPlanLessonMove && !canStartClass && extras.length === 0) return null

  return (
    <div className={`planning-lesson-actions${moreOpen ? ' is-expanded' : ''}`}>
      {canStartClass && onStartClass ? (
        <button type="button" className="day-start-class" onClick={() => onStartClass(sectionId, lessonId, liveDate)}>{inProgress ? 'Resume in ArcTable' : 'Start class'}</button>
      ) : null}
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

function gridTemplate(days: ProjectedDay[]): { gridTemplateColumns: string } {
  // Equal day columns — focus is visual only (no width expand on hover/scroll-over or selection).
  const columns = days.map(() => 'minmax(0,1fr)')
  return { gridTemplateColumns: `minmax(4.25rem,0.72fr) ${columns.join(' ')}` }
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
