import type { MonthProjection, ProjectedDay } from '../calendar/projections'
import type { ISODate, PlanNavigationContext } from '../calendar'
import type { LessonWorkspace } from '../planning'
import type { MonthLessonSignal, MonthPlanningProjection, MonthUnitSegment } from '../planning/monthPlanningProjection'
import type { PlanningNote } from '../planning'
import { CalendarDayNotes, CalendarDayNoteDropTarget, type CalendarDayNoteHandlers } from './CalendarDayNotes'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, type ArcObjectMenuItem } from './ArcObjectMenu'
import { formatLongDate, formatMonthKey, formatShortDate } from './dateLabels'

import { PLAN_WEEKDAY_LABELS } from '../calendar/dateMath'

export function PlanningMonthView({
  month,
  planning,
  notes,
  monthDateBounds,
  focusDate,
  planContext,
  lessons,
  onSelectDate,
  onSelectUnit,
  onBeginPlanLessonMove,
  onSetLessonImportant,
  dayNotes,
}: {
  month: MonthProjection
  planning: MonthPlanningProjection
  notes: PlanningNote[]
  monthDateBounds?: { min: ISODate; max: ISODate }
  focusDate?: ISODate
  planContext?: PlanNavigationContext | null
  lessons: LessonWorkspace | null
  onSelectDate?: (date: ISODate) => void
  onSelectUnit?: (input: { date: ISODate; courseId: string; unitId: string }) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  dayNotes?: CalendarDayNoteHandlers
}) {
  const noteHandlers: CalendarDayNoteHandlers = dayNotes ?? {}

  return (
    <div className="planning-month" aria-label={`${formatMonthKey(month.monthKey)} planning calendar`} data-focus-date={focusDate ?? ''}>
      <div className="planning-month-weekdays" aria-hidden="true">
        {PLAN_WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
      </div>
      {month.weeks.map((calendarWeek, weekIndex) => {
        const planningWeek = planning.weeks[weekIndex]
        return (
          <section className="planning-month-week" key={calendarWeek.startDate} aria-label={`Week of ${formatShortDate(calendarWeek.startDate)}`}>
            {planningWeek?.unitSegments.length ? (
              <div className="planning-month-unit-stack" aria-label="Unit pacing">
                {planningWeek.unitSegments.map((segment) => (
                  <MonthUnitLane key={`${segment.unitId}:${segment.weekIndex}`} segment={segment} onSelectUnit={onSelectUnit} />
                ))}
              </div>
            ) : null}
            <div className="planning-month-days">
              {calendarWeek.days.map((day, dayIndex) => (
                <MonthDayCell
                  key={day.date}
                  day={day}
                  notes={notes}
                  monthDateBounds={monthDateBounds}
                  noteHandlers={noteHandlers}
                  inAnchorMonth={day.date.slice(0, 7) === month.monthKey}
                  selected={day.date === focusDate}
                  signals={planningWeek?.days[dayIndex]?.lessonSignals ?? []}
                  planContext={planContext}
                  lessons={lessons}
                  onSelectDate={onSelectDate}
                  onBeginPlanLessonMove={onBeginPlanLessonMove}
                  onSetLessonImportant={onSetLessonImportant}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MonthUnitLane({
  segment,
  onSelectUnit,
}: {
  segment: MonthUnitSegment
  onSelectUnit?: (input: { date: ISODate; courseId: string; unitId: string }) => void
}) {
  const continuation = [segment.continuesBefore ? 'continues from prior week' : null, segment.continuesAfter ? 'continues next week' : null]
    .filter(Boolean)
    .join(', ')
  const label = `${segment.courseTitle} · ${segment.title}`
  return (
    <div className="planning-month-unit-lane" data-course-id={segment.courseId} aria-label={`${segment.courseTitle}, ${segment.title}${continuation ? `, ${continuation}` : ''}`}>
      <button
        type="button"
        className="planning-month-unit-band"
        style={{ gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}` }}
        title={label}
        aria-label={`Open ${label} in Month at unit start`}
        onClick={() => onSelectUnit?.({ date: segment.unitStartDate, courseId: segment.courseId, unitId: segment.unitId })}
      >
        <span className="planning-month-unit-course">{segment.courseTitle}</span>
        <span className="planning-month-unit-title">{segment.title}</span>
      </button>
    </div>
  )
}

function MonthDayCell({
  day,
  notes,
  monthDateBounds,
  noteHandlers,
  inAnchorMonth,
  selected,
  signals,
  planContext,
  lessons,
  onSelectDate,
  onBeginPlanLessonMove,
  onSetLessonImportant,
}: {
  day: ProjectedDay
  notes: PlanningNote[]
  monthDateBounds?: { min: ISODate; max: ISODate }
  noteHandlers: CalendarDayNoteHandlers
  inAnchorMonth: boolean
  selected: boolean
  signals: MonthLessonSignal[]
  planContext?: PlanNavigationContext | null
  lessons: LessonWorkspace | null
  onSelectDate?: (date: ISODate) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
}) {
  const nonTeaching = day.kind === 'no-school' || day.kind === 'holiday' || day.kind === 'break' || day.kind === 'teacher-workday'
  const dayStatus = day.kind === 'early-release'
    ? (day.schoolEndTime ? `Early release · ends ${day.schoolEndTime}` : (day.label || 'Early release'))
    : day.kind === 'instructional' || day.kind === 'unknown'
    ? null
    : day.label || humanizeKind(day.kind)
  const ariaStatus = nonTeaching ? (day.label || humanizeKind(day.kind)) : dayStatus
  const classes = [
    'planning-month-day',
    `planning-month-day--${day.kind}`,
    day.isWeekend ? 'planning-month-day--weekend' : '',
    inAnchorMonth ? '' : 'planning-month-day--outside-month',
    day.inSchoolYear ? '' : 'planning-month-day--outside-year',
    selected ? 'planning-month-day--focus' : '',
  ].filter(Boolean).join(' ')

  return (
    <CalendarDayNoteDropTarget
      date={day.date}
      onDropNote={(noteId, targetDate) => noteHandlers.onMove?.(noteId, targetDate) ?? false}
    >
      <div className={classes} aria-label={`${formatLongDate(day.date)}${ariaStatus ? `. ${ariaStatus}` : ''}`}>
        <div className="planning-month-day-heading">
          <button type="button" className="planning-month-date" aria-current={selected ? 'date' : undefined} aria-label={`Open Day for ${formatLongDate(day.date)}`} onClick={() => onSelectDate?.(day.date)}>{Number(day.date.slice(8))}</button>
          {dayStatus ? <span className="planning-month-day-status">{dayStatus}</span> : null}
        </div>
        <CalendarDayNotes notes={notes} date={day.date} compact dateBounds={monthDateBounds} handlers={noteHandlers} />
        <div className="planning-month-signals">
          {signals.map((signal) => (
            <MonthLessonSignalView
              key={`${signal.courseId}:${signal.lessonId}`}
              signal={signal}
              important={lessons?.lessons.find((lesson) => lesson.id === signal.lessonId)?.important === true}
              dayDate={day.date}
              planContext={planContext}
              onBeginPlanLessonMove={onBeginPlanLessonMove}
              onSetLessonImportant={onSetLessonImportant}
            />
          ))}
        </div>
      </div>
    </CalendarDayNoteDropTarget>
  )
}

function MonthLessonSignalView({ signal, important = false, dayDate, planContext, onBeginPlanLessonMove, onSetLessonImportant }: { signal: MonthLessonSignal; important?: boolean; dayDate: ISODate; planContext?: PlanNavigationContext | null; onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void; onSetLessonImportant?: (lessonId: string, important: boolean) => boolean }) {
  const focusedSection = planContext?.sectionId
    ? signal.sections.find((section) => section.sectionId === planContext.sectionId)
    : planContext?.courseId === signal.courseId
      ? signal.sections[0]
      : null
  const statusSummary = summarizeStatuses(signal)
  const shiftedNames = signal.sections.filter((section) => section.isSectionOverride).map((section) => section.sectionName)
  const sectionNames = signal.sections.map((section) => section.sectionName)
  const accessible = [
    signal.courseTitle,
    signal.title,
    signal.datePolicy === 'fixed' ? 'fixed date' : null,
    `Sections: ${sectionNames.join(', ')}`,
    shiftedNames.length ? `Shifted for ${shiftedNames.join(', ')}` : null,
    statusSummary,
  ].filter(Boolean).join('. ')

  const menuItems: ArcObjectMenuItem[] = []
  if (onSetLessonImportant) {
    menuItems.push({
      id: 'important',
      label: important ? 'Remove Important' : 'Mark Important',
      onSelect: () => { onSetLessonImportant(signal.lessonId, !important) },
    })
  }
  if (onBeginPlanLessonMove && focusedSection && planContext?.view === 'Month') {
    menuItems.push({
      id: 'move',
      label: 'Move to date…',
      onSelect: () => onBeginPlanLessonMove({ lessonId: signal.lessonId, sectionId: focusedSection.sectionId, defaultDestination: dayDate }),
    })
  }

  return (
    <ArcImportantObject important={important} className={`planning-month-signal${signal.datePolicy === 'fixed' ? ' planning-month-signal--fixed' : ''}`}>
      <article aria-label={accessible}>
        <ArcObjectMenu label={signal.title} items={menuItems}>
          <div className="planning-month-signal-body">
            <div className="planning-month-signal-heading">
              <span className="planning-month-signal-title">{signal.title}</span>
              {signal.datePolicy === 'fixed' ? <span className="planning-month-fixed">Fixed</span> : null}
            </div>
            <span className="planning-month-signal-course">{signal.courseTitle}</span>
            <span className="planning-month-signal-sections">{sectionNames.join(' · ')}</span>
            {shiftedNames.length ? <span className="planning-month-shifted">Shifted: {shiftedNames.join(', ')}</span> : null}
            {statusSummary ? <span className="planning-month-status-summary">{statusSummary}</span> : null}
          </div>
        </ArcObjectMenu>
        {onBeginPlanLessonMove && focusedSection && planContext?.view === 'Month' ? (
          <div className="planning-lesson-actions">
            <button type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId: signal.lessonId, sectionId: focusedSection.sectionId, defaultDestination: dayDate })}>Move</button>
          </div>
        ) : null}
      </article>
    </ArcImportantObject>
  )
}

function summarizeStatuses(signal: MonthLessonSignal): string | null {
  const counts = { 'in-progress': 0, completed: 0, skipped: 0 }
  for (const section of signal.sections) {
    if (section.deliveryStatus === 'in-progress') counts['in-progress'] += 1
    if (section.deliveryStatus === 'completed') counts.completed += 1
    if (section.deliveryStatus === 'skipped') counts.skipped += 1
  }
  const pieces: string[] = []
  if (counts['in-progress']) pieces.push(`${counts['in-progress']} in progress`)
  if (counts.completed) pieces.push(`${counts.completed} completed`)
  if (counts.skipped) pieces.push(`${counts.skipped} skipped`)
  return pieces.length ? pieces.join(' · ') : null
}

function humanizeKind(kind: ProjectedDay['kind']): string {
  switch (kind) {
    case 'no-school': return 'No school'
    case 'teacher-workday': return 'Teacher workday'
    case 'early-release': return 'Early release'
    case 'holiday': return 'Holiday'
    case 'break': return 'Break'
    case 'instructional': return 'Instructional day'
    case 'unknown': return 'Unknown calendar status'
  }
}
