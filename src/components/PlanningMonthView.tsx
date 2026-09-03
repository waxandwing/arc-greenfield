import type { MonthProjection, ProjectedDay } from '../calendar/projections'
import type { MonthLessonSignal, MonthPlanningProjection, MonthUnitSegment } from '../planning/monthPlanningProjection'
import { formatLongDate, formatShortDate } from './dateLabels'
import { isCalendarObjectSelected, type CalendarObjectSelection } from './calendarObjectSelection'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PlanningMonthView({
  month,
  planning,
  selection,
  onSelect,
}: {
  month: MonthProjection
  planning: MonthPlanningProjection
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  return (
    <div className="planning-month">
      <div className="planning-month-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
      </div>
      {month.weeks.map((calendarWeek, weekIndex) => {
        const planningWeek = planning.weeks[weekIndex]
        return (
          <section className="planning-month-week" key={calendarWeek.startDate} aria-label={`Week of ${formatShortDate(calendarWeek.startDate)}`}>
            {planningWeek?.unitSegments.length ? (
              <div className="planning-month-unit-stack">
                {planningWeek.unitSegments.map((segment) => (
                  <MonthUnitLane key={`${segment.unitId}:${segment.weekIndex}`} segment={segment} selection={selection} onSelect={onSelect} />
                ))}
              </div>
            ) : null}
            <div className="planning-month-days">
              {calendarWeek.days.map((day, dayIndex) => (
                <MonthDayCell
                  key={day.date}
                  day={day}
                  inAnchorMonth={day.date.slice(0, 7) === month.monthKey}
                  signals={planningWeek?.days[dayIndex]?.lessonSignals ?? []}
                  selection={selection}
                  onSelect={onSelect}
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
  selection,
  onSelect,
}: {
  segment: MonthUnitSegment
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  return (
    <div className="planning-month-unit-lane">
      <button
        type="button"
        className="calendar-object-select planning-month-unit-band planning-month-unit-select"
        style={{ gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}` }}
        title={`${segment.courseTitle} · ${segment.title}`}
        aria-pressed={isCalendarObjectSelected(selection, 'unit', segment.unitId)}
        onClick={() => onSelect({ kind: 'unit', id: segment.unitId })}
      >
        <span className="planning-month-unit-course">{segment.courseTitle}</span>
        <span className="planning-month-unit-title">{segment.title}</span>
      </button>
    </div>
  )
}

function MonthDayCell({
  day,
  inAnchorMonth,
  signals,
  selection,
  onSelect,
}: {
  day: ProjectedDay
  inAnchorMonth: boolean
  signals: MonthLessonSignal[]
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  const dayStatus = day.kind === 'instructional' ? null : day.label || humanizeKind(day.kind)
  const classes = [
    'planning-month-day',
    `planning-month-day--${day.kind}`,
    day.isWeekend ? 'planning-month-day--weekend' : '',
    inAnchorMonth ? '' : 'planning-month-day--outside-month',
    day.inSchoolYear ? '' : 'planning-month-day--outside-year',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="planning-month-day-heading">
        <time className="planning-month-date" dateTime={day.date} aria-label={formatLongDate(day.date)}>
          {Number(day.date.slice(8))}
        </time>
        {dayStatus ? <span className="planning-month-day-status">{dayStatus}</span> : null}
      </div>
      <div className="planning-month-signals">
        {signals.map((signal) => (
          <MonthLessonSignalView
            key={`${signal.courseId}:${signal.lessonId}`}
            signal={signal}
            selection={selection}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function MonthLessonSignalView({
  signal,
  selection,
  onSelect,
}: {
  signal: MonthLessonSignal
  selection: CalendarObjectSelection
  onSelect: (selection: Exclude<CalendarObjectSelection, null>) => void
}) {
  const statusSummary = summarizeStatuses(signal)
  const shiftedNames = signal.sections.filter((section) => section.isSectionOverride).map((section) => section.sectionName)
  const sectionNames = signal.sections.map((section) => section.sectionName)

  return (
    <button
      type="button"
      className={`calendar-object-select planning-month-signal planning-month-signal-select${signal.datePolicy === 'fixed' ? ' planning-month-signal--fixed' : ''}`}
      aria-pressed={isCalendarObjectSelected(selection, 'lesson', signal.lessonId)}
      onClick={() => onSelect({ kind: 'lesson', id: signal.lessonId })}
    >
      <span className="planning-month-signal-heading">
        <span className="planning-month-signal-title">{signal.title}</span>
        {signal.datePolicy === 'fixed' ? <span className="planning-month-fixed">Fixed</span> : null}
      </span>
      <span className="planning-month-signal-context">{signal.courseTitle} · {sectionNames.join(' · ')}</span>
      {statusSummary ? <span className="planning-month-status-summary">{statusSummary}</span> : null}
      {shiftedNames.length ? <span className="planning-month-shifted">Shifted: {shiftedNames.join(', ')}</span> : null}
    </button>
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
    case 'holiday': return 'Holiday'
    case 'break': return 'Break'
    case 'instructional': return 'Instructional day'
    case 'unknown': return 'Unknown calendar status'
  }
}
