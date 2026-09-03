import type { ReactNode } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { TermBoundary } from '../calendar/types'
import { formatDateRange, formatLongDate, formatWeekday } from './dateLabels'

export function ProjectionHeading({ title, termContext }: { title: string; termContext?: ReactNode }) {
  return (
    <div className="projection-heading-row">
      <p className="projection-range-label">{title}</p>
      {termContext}
    </div>
  )
}

export function RangeProjection({ title, subtitle, days }: { title: string; subtitle: string; days: ProjectedDay[] }) {
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

export function TermContext({ quarters, semesters, detailed = false }: { quarters: TermBoundary[]; semesters: TermBoundary[]; detailed?: boolean }) {
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

export function CalendarDayCell({ day, compact = false, showWeekday = false }: { day: ProjectedDay; compact?: boolean; showWeekday?: boolean }) {
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
    <div className={classes} data-date={day.date} data-kind={day.kind} aria-label={accessibleLabel}>
      {showWeekday && !compact ? <span className="calendar-day-weekday">{formatWeekday(day.date)}</span> : null}
      <span className="calendar-day-date">{day.date.slice(8)}</span>
      {!compact && day.label ? <span className="calendar-day-label">{day.label}</span> : null}
      {!compact && day.kind === 'unknown' ? <span className="calendar-day-status">Unknown</span> : null}
    </div>
  )
}

export function MissingBoundary({ label }: { label: string }) {
  return <p className="projection-empty-state">{label}</p>
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
