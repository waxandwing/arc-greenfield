import type { ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { ISODate, SchoolCalendar, TermBoundary } from '../calendar/types'

type Props = {
  view: CalendarView
  calendar: SchoolCalendar | null
  anchorDate: ISODate | null
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarProjectionView({ view, calendar, anchorDate }: Props) {
  if (!calendar || !anchorDate) {
    return (
      <section className="calendar-unconfigured" aria-label="Calendar not configured">
        <p className="projection-range-label">{view}</p>
        <p className="projection-empty-state">Calendar setup is required before Arc can place dates.</p>
      </section>
    )
  }

  switch (view) {
    case 'Day': {
      const projection = projectDay(calendar, anchorDate)
      return (
        <DayStrip
          title={formatLongDate(projection.date)}
          days={[projection.day]}
          single
          termContext={<TermContext quarters={projection.quarter ? [projection.quarter] : []} semesters={projection.semester ? [projection.semester] : []} />}
        />
      )
    }
    case 'Week': {
      const projection = projectWeek(calendar, anchorDate)
      return (
        <DayStrip
          title={formatDateRange(projection.startDate, projection.endDate)}
          days={projection.days}
          termContext={<TermContext quarters={projection.quarters} semesters={projection.semesters} />}
        />
      )
    }
    case 'Month': {
      const projection = projectMonth(calendar, anchorDate)
      return (
        <section className="projection-section month-section" aria-label={`${formatMonth(anchorDate)} calendar`}>
          <div className="projection-heading-row">
            <p className="projection-range-label">{formatMonth(anchorDate)}</p>
            <TermContext quarters={projection.quarters} semesters={projection.semesters} />
          </div>
          <div className="month-weekday-row" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
          </div>
          <div className="month-projection" role="grid" aria-label={`${formatMonth(anchorDate)} calendar grid`}>
            {projection.weeks.map((week) => (
              <div className="month-week" role="row" key={week.startDate}>
                {week.days.map((day) => <CalendarDayCell key={day.date} day={day} role="gridcell" />)}
              </div>
            ))}
          </div>
        </section>
      )
    }
    case 'Quarter': {
      const projection = projectQuarter(calendar, anchorDate)
      return projection ? <RangeProjection title={projection.label} subtitle={formatDateRange(projection.startDate, projection.endDate)} days={projection.days} /> : <MissingBoundary label="Quarter dates are not configured for this part of the school year." />
    }
    case 'Semester': {
      const projection = projectSemester(calendar, anchorDate)
      return projection ? <RangeProjection title={projection.label} subtitle={formatDateRange(projection.startDate, projection.endDate)} days={projection.days} /> : <MissingBoundary label="Semester dates are not configured for this part of the school year." />
    }
    case 'Year Map': {
      const projection = projectYearMap(calendar)
      return (
        <section className="projection-section" aria-label={`${calendar.schoolYearLabel} year map`}>
          <div className="projection-heading-row projection-heading-row--year">
            <div>
              <p className="projection-range-label">{calendar.schoolYearLabel}</p>
              <p className="projection-subtitle">{formatDateRange(projection.startDate, projection.endDate)}</p>
            </div>
            <TermContext quarters={projection.quarters} semesters={projection.semesters} detailed />
          </div>
          <div className="projection-range projection-range--compact">
            {projection.days.map((day) => <CalendarDayCell key={day.date} day={day} compact />)}
          </div>
        </section>
      )
    }
  }
}

function DayStrip({ title, days, single = false, termContext }: { title: string; days: ProjectedDay[]; single?: boolean; termContext?: ReactNode }) {
  return (
    <section className="projection-section" aria-label={title}>
      <div className="projection-heading-row">
        <p className="projection-range-label">{title}</p>
        {termContext}
      </div>
      <div className={single ? 'projection-day-strip projection-day-strip--single' : 'projection-day-strip'}>
        {days.map((day) => <CalendarDayCell key={day.date} day={day} showWeekday />)}
      </div>
    </section>
  )
}

function RangeProjection({ title, subtitle, days }: { title: string; subtitle: string; days: ProjectedDay[] }) {
  return (
    <section className="projection-section" aria-label={title}>
      <div className="projection-heading-row">
        <div>
          <p className="projection-range-label">{title}</p>
          <p className="projection-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="projection-range">
        {days.map((day) => <CalendarDayCell key={day.date} day={day} />)}
      </div>
    </section>
  )
}

function TermContext({ quarters, semesters, detailed = false }: { quarters: TermBoundary[]; semesters: TermBoundary[]; detailed?: boolean }) {
  if (quarters.length === 0 && semesters.length === 0) return null

  return (
    <div className={`term-context${detailed ? ' term-context--detailed' : ''}`} aria-label="Term context">
      {semesters.map((term) => (
        <span className="term-context-item term-context-item--semester" key={term.id}>
          {term.label}{detailed ? ` · ${formatDateRange(term.startDate, term.endDate)}` : ''}
        </span>
      ))}
      {quarters.map((term) => (
        <span className="term-context-item" key={term.id}>
          {term.label}{detailed ? ` · ${formatDateRange(term.startDate, term.endDate)}` : ''}
        </span>
      ))}
    </div>
  )
}

function CalendarDayCell({ day, compact = false, showWeekday = false, role }: { day: ProjectedDay; compact?: boolean; showWeekday?: boolean; role?: 'gridcell' }) {
  const classes = [
    'calendar-day-cell',
    `calendar-day-cell--${day.kind}`,
    day.isWeekend ? 'calendar-day-cell--weekend' : '',
    day.inSchoolYear ? '' : 'calendar-day-cell--outside-year',
    compact ? 'calendar-day-cell--compact' : '',
  ].filter(Boolean).join(' ')

  const status = day.kind === 'instructional' ? 'Instructional day' : day.kind === 'unknown' ? 'Unknown calendar status' : day.label || humanizeKind(day.kind)
  const accessibleLabel = `${formatLongDate(day.date)}. ${status}.`

  return (
    <div className={classes} data-date={day.date} data-kind={day.kind} role={role} aria-label={accessibleLabel}>
      {showWeekday && !compact ? <span className="calendar-day-weekday">{formatWeekday(day.date)}</span> : null}
      <span className="calendar-day-date">{day.date.slice(8)}</span>
      {!compact && day.label ? <span className="calendar-day-label">{day.label}</span> : null}
      {!compact && day.kind === 'unknown' ? <span className="calendar-day-status">Unknown</span> : null}
    </div>
  )
}

function MissingBoundary({ label }: { label: string }) {
  return <p className="projection-empty-state">{label}</p>
}

function formatLongDate(date: ISODate): string {
  return dateFormatter({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(toUTCDate(date))
}

function formatMonth(date: ISODate): string {
  return dateFormatter({ month: 'long', year: 'numeric' }).format(toUTCDate(date))
}

function formatWeekday(date: ISODate): string {
  return dateFormatter({ weekday: 'short' }).format(toUTCDate(date))
}

function formatDateRange(start: ISODate, end: ISODate): string {
  const startDate = toUTCDate(start)
  const endDate = toUTCDate(end)
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear()
  const startLabel = dateFormatter({ month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(startDate)
  const endLabel = dateFormatter({ month: 'short', day: 'numeric', year: 'numeric' }).format(endDate)
  return `${startLabel} – ${endLabel}`
}

function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' })
}

function toUTCDate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
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
