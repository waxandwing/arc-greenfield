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

  const visibleStatus = day.kind === 'instructional' ? null : day.label || humanizeKind(day.kind)

  return (
    <div className={classes} data-date={day.date} data-kind={day.kind}>
      {showWeekday && !compact ? <span className="calendar-day-weekday">{formatWeekday(day.date)}</span> : null}
      <time className="calendar-day-date" dateTime={day.date} aria-label={formatLongDate(day.date)}>{Number(day.date.slice(8))}</time>
      {!compact && visibleStatus ? <span className="calendar-day-status">{visibleStatus}</span> : null}
      {compact && visibleStatus ? <span className="sr-only">{visibleStatus}</span> : null}
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
