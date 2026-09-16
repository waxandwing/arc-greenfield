import { useState } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { ISODate, PlanNavigationContext } from '../calendar'
import { isPlannableDayKind } from '../calendar/schoolCalendar'
import type { PlanningNote } from '../planning'
import {
  loadCourseMinimizePreferences,
  resolveCourseMinimized,
  saveCourseMinimizePreferences,
  shouldAutoMinimizeCourse,
  toggleCourseMinimized,
  type CourseMinimizePreferences,
  type CourseMinimizeReason,
} from '../planning/courseMinimizePreferences'
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

type AddLessonToSlotHandler = (input: {
  courseId: string
  sectionId: string
  date: ISODate
  dayKind: ProjectedDay['kind']
  dayLabel: string | null
}) => void

export function PlanningWeekDayView({
  days,
  planning,
  single = false,
  focusDate,
  planContext,
  onSelectDate,
  onSelectLesson,
  onSelectUnit,
  onAddLessonToSlot,
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
  onAddLessonToSlot?: AddLessonToSlotHandler
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
  const [minimizePrefs, setMinimizePrefs] = useState<CourseMinimizePreferences>(loadCourseMinimizePreferences)
  const allowMinimize = !single

  function updateMinimizePrefs(next: CourseMinimizePreferences) {
    setMinimizePrefs(next)
    saveCourseMinimizePreferences(next)
  }

  function toggleCourseRow(course: PlanningCourseGroup) {
    const resolved = resolveCourseMinimized(course.course.id, course, days, minimizePrefs, focusDate)
    const wouldAuto = shouldAutoMinimizeCourse(course, days, focusDate)
    updateMinimizePrefs(toggleCourseMinimized(minimizePrefs, course.course.id, resolved.minimized, wouldAuto))
  }

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
      {planning.courses.map((course) => {
        const resolved = allowMinimize
          ? resolveCourseMinimized(course.course.id, course, days, minimizePrefs, focusDate)
          : { minimized: false, reason: null as CourseMinimizeReason | null }
        return (
          <PlanningCourse
            key={course.course.id}
            course={course}
            days={days}
            single={single}
            focusDate={focusDate}
            planContext={planContext}
            minimized={resolved.minimized}
            minimizeReason={resolved.reason}
            onToggleMinimize={allowMinimize ? () => toggleCourseRow(course) : undefined}
            onSelectLesson={onSelectLesson}
            onSelectUnit={onSelectUnit}
            onAddLessonToSlot={onAddLessonToSlot}
            onBeginPlanLessonMove={onBeginPlanLessonMove}
            onOpenRecoveryForSection={onOpenRecoveryForSection}
            onSetLessonImportant={onSetLessonImportant}
            onStartClass={onStartClass}
            lessonImportantById={lessonImportantById}
          />
        )
      })}
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
  minimized = false,
  minimizeReason = null,
  onToggleMinimize,
  onSelectLesson,
  onSelectUnit,
  onAddLessonToSlot,
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
  minimized?: boolean
  minimizeReason?: CourseMinimizeReason | null
  onToggleMinimize?: () => void
  onSelectLesson?: SelectLessonHandler
  onSelectUnit?: SelectUnitHandler
  onAddLessonToSlot?: AddLessonToSlotHandler
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
  lessonImportantById?: (lessonId: string) => boolean
}) {
  const headingId = `planning-course-heading-${course.course.id}`
  const bodyId = `planning-course-body-${course.course.id}`
  const toggleLabel = minimized
    ? `Expand ${course.course.title}`
    : `Minimize ${course.course.title}`
  const statusHint = minimizeReason === 'weekend-auto'
    ? 'Weekend — no classes'
    : minimizeReason === 'manual' && minimized
      ? 'Minimized'
      : null

  return (
    <section
      className={`planning-course${minimized ? ' planning-course--minimized' : ''}`}
      data-course-id={course.course.id}
      data-minimized={minimized ? 'true' : 'false'}
      data-minimize-reason={minimizeReason ?? undefined}
      aria-label={`${course.course.title} planning`}
    >
      <div className="planning-course-heading">
        {onToggleMinimize ? (
          <button
            type="button"
            className="planning-course-toggle"
            id={headingId}
            aria-expanded={!minimized}
            aria-controls={bodyId}
            aria-label={toggleLabel}
            title={toggleLabel}
            data-testid={`planning-course-toggle-${course.course.id}`}
            onClick={onToggleMinimize}
          >
            <span className="planning-course-chevron" aria-hidden="true">{minimized ? '▸' : '▾'}</span>
            <h2>{course.course.title}</h2>
            {statusHint ? (
              <span className="planning-course-minimize-hint" data-testid={`planning-course-minimize-hint-${course.course.id}`}>
                {statusHint}
              </span>
            ) : null}
          </button>
        ) : (
          <h2 id={headingId}>{course.course.title}</h2>
        )}
      </div>
      <div
        id={bodyId}
        className="planning-course-body"
        hidden={minimized}
        role={onToggleMinimize ? 'region' : undefined}
        aria-labelledby={onToggleMinimize ? headingId : undefined}
      >
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
                const day = days[index]
                const dayKind = day?.kind ?? 'unknown'
                const dayLabel = day?.label ?? null
                const offDay = !isPlannableDayKind(dayKind)
                const empty = slot.lessons.length === 0
                const offKindLabel = dayLabel || humanizeKind(dayKind)
                const addLabel = empty && onAddLessonToSlot
                  ? `Add lesson for ${row.section.name}, ${formatLongDate(slot.date)}${offDay ? `. ${offKindLabel}` : ''}`
                  : null
                return (
                <div
                  key={slot.date}
                  className={`planning-day-slot planning-day-slot--${dayKind}${offDay ? ' planning-day-slot--off' : ''}${slot.date === focusDate ? ' planning-day-slot--focus' : ''}${empty && onAddLessonToSlot ? ' planning-day-slot--addable' : ''}`}
                  aria-label={`${row.section.name}, ${formatLongDate(slot.date)}${offDay ? `. ${offKindLabel}` : ''}${empty && onAddLessonToSlot ? '. Empty — add lesson' : ''}`}
                  data-desk-postit-drop="date"
                  data-desk-postit-date={slot.date}
                  data-date={slot.date}
                  data-plan-place-empty={empty ? 'true' : undefined}
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
                  {empty && onAddLessonToSlot && addLabel ? (
                    <button
                      type="button"
                      className={`planning-day-slot-add${offDay ? ' planning-day-slot-add--off' : ''}`}
                      aria-label={addLabel}
                      data-testid={`planning-day-slot-add-${row.section.id}-${slot.date}`}
                      onClick={() => onAddLessonToSlot({
                        courseId: course.course.id,
                        sectionId: row.section.id,
                        date: slot.date,
                        dayKind,
                        dayLabel,
                      })}
                    >
                      {offDay ? <span className="planning-day-slot-add-off">{offKindLabel}</span> : null}
                      <span className="planning-day-slot-add-label">{single ? 'Place a lesson' : 'Add lesson'}</span>
                    </button>
                  ) : single && empty ? (
                    <span className="planning-day-empty">No Lesson placed</span>
                  ) : null}
                </div>
                )
              })}
            </div>
          ))}
        </div>
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
      aria-label={`Open ${unit.title} unit`}
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
  const startableStatus = lesson.deliveryStatus === 'not-started' || lesson.deliveryStatus === 'in-progress'
  const canStartClass =
    Boolean(onStartClass) &&
    startableStatus &&
    (!focusDate || slotDate === focusDate)
  const startClassBlockedReason =
    Boolean(onStartClass) && startableStatus && focusDate && slotDate !== focusDate
      ? 'Open today to start'
      : null
  const hasActions = Boolean(
    onSelectLesson ||
    onBeginPlanLessonMove ||
    onSetLessonImportant ||
    (onOpenRecoveryForSection && lesson.deliveryStatus === 'in-progress') ||
    canStartClass ||
    startClassBlockedReason,
  )

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

  function openPlanningSurface(event: { stopPropagation: () => void }) {
    if (!onSelectLesson) return
    event.stopPropagation()
    onSelectLesson({ ...lesson, sectionId, date: slotDate })
  }

  return (
    <ArcImportantObject important={important}>
    <article
      className={`planning-lesson planning-lesson--${lesson.deliveryStatus}${lesson.datePolicy === 'fixed' ? ' planning-lesson--fixed' : ''}${selected || touchRevealed ? ' is-actions-revealed' : ''}${onSelectLesson ? ' planning-lesson--openable' : ''}`}
      aria-label={accessible}
      tabIndex={hasActions ? 0 : undefined}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, a, [role="menuitem"]')) return
        if (onSelectLesson) {
          openPlanningSurface(event)
          return
        }
        if (!hasActions) return
        setTouchRevealed((value) => !value)
      }}
      onKeyDown={(event) => {
        if (!onSelectLesson) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        const target = event.target as HTMLElement
        if (target.closest('button, a, [role="menuitem"]')) return
        event.preventDefault()
        openPlanningSurface(event)
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
          liveDate={slotDate}
          inProgress={lesson.deliveryStatus === 'in-progress'}
          canStartClass={canStartClass}
          startClassBlockedReason={startClassBlockedReason}
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
  startClassBlockedReason = null,
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
  startClassBlockedReason?: string | null
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
      <button key="shift" type="button" className="text-button recovery-review-trigger" onClick={() => onOpenRecoveryForSection(sectionId)}>Pick up here</button>
    ) : null,
  ].filter(Boolean)

  const hasSecondary = Boolean(onBeginPlanLessonMove || extras.length > 0)
  if (!canStartClass && !startClassBlockedReason && !hasSecondary) return null

  return (
    <>
      {canStartClass && onStartClass ? (
        <div
          className="planning-lesson-primary-action"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="day-start-class"
            data-testid="week-start-class"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onStartClass(sectionId, lessonId, liveDate)
            }}
          >
            {inProgress ? 'Resume' : 'Start class'}
          </button>
        </div>
      ) : startClassBlockedReason ? (
        <div className="planning-lesson-primary-action">
          <span className="planning-lesson-start-hint" role="note">{startClassBlockedReason}</span>
        </div>
      ) : null}
      {hasSecondary ? (
        <div className={`planning-lesson-actions${moreOpen ? ' is-expanded' : ''}`}>
          {onBeginPlanLessonMove ? (
            <button type="button" className="text-button" onClick={(event) => {
              event.stopPropagation()
              onBeginPlanLessonMove({ lessonId, sectionId, defaultDestination: effectiveDate })
            }}>Move</button>
          ) : null}
          {extras.length > 0 ? (
            <button type="button" className="text-button planning-lesson-more-toggle" aria-expanded={moreOpen} onClick={(event) => {
              event.stopPropagation()
              setMoreOpen((value) => !value)
            }}>More</button>
          ) : null}
          {moreOpen && extras.length > 0 ? <div className="planning-lesson-more-panel">{extras}</div> : null}
        </div>
      ) : null}
    </>
  )
}

function gridTemplate(days: ProjectedDay[]): { gridTemplateColumns: string } {
  // Equal day columns with a readable floor so titles/actions stay horizontal.
  // Focus is visual only (no width expand on hover/scroll-over or selection).
  const columns = days.map(() => 'minmax(8.5rem,1fr)')
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
