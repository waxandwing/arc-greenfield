import type { MonthProjection, ProjectedDay } from '../calendar/projections'
import { calendarDayAriaSuffix, visibleCalendarDayLabel } from '../calendar/dayPresentation'
import type { ISODate, PlanNavigationContext } from '../calendar'
import type { MonthLessonSignal, MonthPlanningProjection, MonthUnitSegment } from '../planning/monthPlanningProjection'
import { formatLongDate, formatMonthKey, formatShortDate } from './dateLabels'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PlanningMonthView({
  month,
  planning,
  focusDate,
  planContext,
  onSelectDate,
  onBeginPlanLessonMove,
}: {
  month: MonthProjection
  planning: MonthPlanningProjection
  focusDate?: ISODate
  planContext?: PlanNavigationContext | null
  onSelectDate?: (date: ISODate) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
}) {
  const focusCourseId = planContext?.courseId ?? null

  return (
    <div className="planning-month" aria-label={`${formatMonthKey(month.monthKey)} planning calendar`} data-focus-date={focusDate ?? ''}>
      <header className="planning-month-horizon" aria-label="Month course and unit horizon">
        <p className="planning-month-horizon-lede">Unit pacing across the month{focusDate ? ` · selected ${formatShortDate(focusDate)}` : ''}</p>
      </header>
      <div className="planning-month-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
      </div>
      {month.weeks.map((calendarWeek, weekIndex) => {
        const planningWeek = planning.weeks[weekIndex]
        return (
          <section className="planning-month-week" key={calendarWeek.startDate} aria-label={`Week of ${formatShortDate(calendarWeek.startDate)}`}>
            <div className="planning-month-week-grid">
              {planningWeek?.unitSegments.length ? (
                <div className="planning-month-unit-stack" aria-label="Unit pacing">
                  {planningWeek.unitSegments.map((segment) => (
                    <MonthUnitLane key={`${segment.unitId}:${segment.weekIndex}`} segment={segment} emphasized={!focusCourseId || segment.courseId === focusCourseId} />
                  ))}
                </div>
              ) : null}
              {calendarWeek.days.map((day, dayIndex) => (
                <MonthDayCell
                  key={day.date}
                  day={day}
                  inAnchorMonth={day.date.slice(0, 7) === month.monthKey}
                  selected={day.date === focusDate}
                  signals={planningWeek?.days[dayIndex]?.lessonSignals ?? []}
                  planContext={planContext}
                  onSelectDate={onSelectDate}
                  onBeginPlanLessonMove={onBeginPlanLessonMove}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MonthUnitLane({ segment, emphasized }: { segment: MonthUnitSegment; emphasized: boolean }) {
  const continuation = [segment.continuesBefore ? 'continues from prior week' : null, segment.continuesAfter ? 'continues next week' : null]
    .filter(Boolean)
    .join(', ')
  return (
    <div className="planning-month-unit-lane" aria-label={`${segment.courseTitle}, ${segment.title}${continuation ? `, ${continuation}` : ''}`}>
      <div
        className={`planning-month-unit-band${emphasized ? '' : ' planning-month-unit-band--muted'}`}
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
  selected,
  signals,
  planContext,
  onSelectDate,
  onBeginPlanLessonMove,
}: {
  day: ProjectedDay
  inAnchorMonth: boolean
  selected: boolean
  signals: MonthLessonSignal[]
  planContext?: PlanNavigationContext | null
  onSelectDate?: (date: ISODate) => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
}) {
  const dayStatus = visibleCalendarDayLabel(day)
  const classes = [
    'planning-month-day',
    `planning-month-day--${day.kind}`,
    day.isWeekend ? 'planning-month-day--weekend' : '',
    inAnchorMonth ? '' : 'planning-month-day--outside-month',
    day.inSchoolYear ? '' : 'planning-month-day--outside-year',
    selected ? 'planning-month-day--focus' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} data-date={day.date} data-kind={day.kind} aria-label={`${formatLongDate(day.date)}${calendarDayAriaSuffix(day)}`}>
      <div className="planning-month-day-heading">
        <button type="button" className="planning-month-date" aria-current={selected ? 'date' : undefined} aria-label={`Open Day for ${formatLongDate(day.date)}`} onClick={() => onSelectDate?.(day.date)}>{Number(day.date.slice(8))}</button>
        {dayStatus ? <span className="planning-month-day-status">{dayStatus}</span> : null}
      </div>
      <div className="planning-month-signals">
        {signals.map((signal) => (
          <MonthLessonSignalView
            key={`${signal.courseId}:${signal.lessonId}`}
            signal={signal}
            dayDate={day.date}
            planContext={planContext}
            onBeginPlanLessonMove={onBeginPlanLessonMove}
          />
        ))}
      </div>
    </div>
  )
}

function MonthLessonSignalView({ signal, dayDate, planContext, onBeginPlanLessonMove }: { signal: MonthLessonSignal; dayDate: ISODate; planContext?: PlanNavigationContext | null; onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void }) {
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
      {onBeginPlanLessonMove && focusedSection && planContext?.view === 'Month' ? (
        <div className="planning-lesson-actions">
          <button type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId: signal.lessonId, sectionId: focusedSection.sectionId, defaultDestination: dayDate })}>Move</button>
        </div>
      ) : null}
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
