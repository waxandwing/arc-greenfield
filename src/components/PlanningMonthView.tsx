import type { MonthProjection, ProjectedDay } from '../calendar/projections'
import type { MonthLessonSignal, MonthPlanningProjection, MonthUnitSegment } from '../planning/monthPlanningProjection'
import { formatPlanningLongDate, formatPlanningMonthKey, formatPlanningShortDate } from './planningDateLabels'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PlanningMonthView({
  month,
  planning,
}: {
  month: MonthProjection
  planning: MonthPlanningProjection
}) {
  return (
    <div className="planning-month" aria-label={`${formatPlanningMonthKey(month.monthKey)} planning calendar`}>
      <div className="planning-month-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
      </div>
      {month.weeks.map((calendarWeek, weekIndex) => {
        const planningWeek = planning.weeks[weekIndex]
        return (
          <section className="planning-month-week" key={calendarWeek.startDate} aria-label={`Week of ${formatPlanningShortDate(calendarWeek.startDate)}`}>
            {planningWeek?.unitSegments.length ? (
              <div className="planning-month-unit-stack" aria-label="Unit pacing">
                {planningWeek.unitSegments.map((segment) => <MonthUnitLane key={`${segment.unitId}:${segment.weekIndex}`} segment={segment} />)}
              </div>
            ) : null}
            <div className="planning-month-days">
              {calendarWeek.days.map((day, dayIndex) => (
                <MonthDayCell
                  key={day.date}
                  day={day}
                  inAnchorMonth={day.date.slice(0, 7) === month.monthKey}
                  signals={planningWeek?.days[dayIndex]?.lessonSignals ?? []}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MonthUnitLane({ segment }: { segment: MonthUnitSegment }) {
  const continuation = [segment.continuesBefore ? 'continues from prior week' : null, segment.continuesAfter ? 'continues next week' : null]
    .filter(Boolean)
    .join(', ')
  return (
    <div className="planning-month-unit-lane" aria-label={`${segment.courseTitle}, ${segment.title}${continuation ? `, ${continuation}` : ''}`}>
      <div
        className="planning-month-unit-band"
        style={{ gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}` }}
        title={`${segment.courseTitle} · ${segment.title}`}
      >
        <span className="planning-month-unit-course">{segment.courseTitle}</span>
        <span className="planning-month-unit-title">{segment.title}</span>
      </div>
    </div>
  )
}

function MonthDayCell({
  day,
  inAnchorMonth,
  signals,
}: {
  day: ProjectedDay
  inAnchorMonth: boolean
  signals: MonthLessonSignal[]
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
    <div className={classes} aria-label={`${formatPlanningLongDate(day.date)}${dayStatus ? `. ${dayStatus}` : ''}`}>
      <div className="planning-month-day-heading">
        <span className="planning-month-date">{Number(day.date.slice(8))}</span>
        {dayStatus ? <span className="planning-month-day-status">{dayStatus}</span> : null}
      </div>
      <div className="planning-month-signals">
        {signals.map((signal) => <MonthLessonSignalView key={`${signal.courseId}:${signal.lessonId}`} signal={signal} />)}
      </div>
    </div>
  )
}

function MonthLessonSignalView({ signal }: { signal: MonthLessonSignal }) {
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

  return (
    <article className={`planning-month-signal${signal.datePolicy === 'fixed' ? ' planning-month-signal--fixed' : ''}`} aria-label={accessible}>
      <div className="planning-month-signal-heading">
        <span className="planning-month-signal-title">{signal.title}</span>
        {signal.datePolicy === 'fixed' ? <span className="planning-month-fixed">Fixed</span> : null}
      </div>
      <span className="planning-month-signal-course">{signal.courseTitle}</span>
      <span className="planning-month-signal-sections">{sectionNames.join(' · ')}</span>
      {shiftedNames.length ? <span className="planning-month-shifted">Shifted: {shiftedNames.join(', ')}</span> : null}
      {statusSummary ? <span className="planning-month-status-summary">{statusSummary}</span> : null}
    </article>
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
