import type { ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { ISODate, SchoolCalendar, TermBoundary } from '../calendar/types'
import { projectPlanningRange } from '../planning/planningProjection'
import { projectMonthPlanning } from '../planning/monthPlanningProjection'
import type { LessonWorkspace, PlanningWorkspace, ShiftPersistenceInput, UnitWorkspace } from '../planning'
import { PlanningMonthView } from './PlanningMonthView'
import { PlanningWeekDayView } from './PlanningWeekDayView'

type PlanningContext = {
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  shiftState: ShiftPersistenceInput | null
}

type Props = {
  view: CalendarView
  calendar: SchoolCalendar | null
  anchorDate: ISODate | null
  planningContext?: PlanningContext | null
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarProjectionView({ view, calendar, anchorDate, planningContext }: Props) {
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
      const days = [projection.day]
      return (
        <PlanningDayStrip
          title={formatLongDate(projection.date)}
          days={days}
          planningContext={planningContext}
          termContext={<TermContext quarters={projection.quarter ? [projection.quarter] : []} semesters={projection.semester ? [projection.semester] : []} />}
        />
      )
    }
    case 'Week': {
      const projection = projectWeek(calendar, anchorDate)
      const weekdays = projection.days.filter((day) => !day.isWeekend)
      return (
        <PlanningWeekStrip
          title={formatDateRange(weekdays[0]?.date ?? projection.startDate, weekdays[weekdays.length - 1]?.date ?? projection.endDate)}
          days={weekdays}
          planningContext={planningContext}
          termContext={<TermContext quarters={projection.quarters} semesters={projection.semesters} />}
        />
      )
    }
    case 'Month': {
      const projection = projectMonth(calendar, anchorDate)
      const monthPlanning = planningContext
        ? projectMonthPlanning({
            month: projection,
            planning: planningContext.planning,
            units: planningContext.units,
            lessons: planningContext.lessons,
            overrides: planningContext.shiftState?.overrides ?? [],
          })
        : null
      return (
        <section className="projection-section month-section" aria-label={`${formatMonth(anchorDate)} calendar`}>
          <div className="projection-heading-row">
            <p className="projection-range-label">{formatMonth(anchorDate)}</p>
            <TermContext quarters={projection.quarters} semesters={projection.semesters} />
          </div>
          {monthPlanning ? (
            <div className="planning-scroll-frame">
              <PlanningMonthView month={projection} planning={monthPlanning} />
            </div>
          ) : (
            <>
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
            </>
          )}
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

function PlanningDayStrip({ title, days, planningContext, termContext }: { title: string; days: ProjectedDay[]; planningContext?: PlanningContext | null; termContext?: ReactNode }) {
  return (
    <section className="projection-section" aria-label={title}>
      <ProjectionHeading title={title} termContext={termContext} />
      {planningContext ? (
        <PlanningWeekDayView days={days} planning={planningForDays(days, planningContext)} single />
      ) : (
        <div className="projection-day-strip projection-day-strip--single">
          {days.map((day) => <CalendarDayCell key={day.date} day={day} showWeekday />)}
        </div>
      )}
    </section>
  )
}

function PlanningWeekStrip({ title, days, planningContext, termContext }: { title: string; days: ProjectedDay[]; planningContext?: PlanningContext | null; termContext?: ReactNode }) {
  return (
    <section className="projection-section" aria-label={title}>
      <ProjectionHeading title={title} termContext={termContext} />
      {planningContext ? (
        <div className="planning-scroll-frame">
          <PlanningWeekDayView days={days} planning={planningForDays(days, planningContext)} />
        </div>
      ) : (
        <div className="projection-day-strip">
          {days.map((day) => <CalendarDayCell key={day.date} day={day} showWeekday />)}
        </div>
      )}
    </section>
  )
}

function planningForDays(days: ProjectedDay[], context: PlanningContext) {
  return projectPlanningRange({
    dates: days.map((day) => day.date),
    planning: context.planning,
    units: context.units,
    lessons: context.lessons,
    overrides: context.shiftState?.overrides ?? [],
  })
}

function ProjectionHeading({ title, termContext }: { title: string; termContext?: ReactNode }) {
  return (
    <div className="projection-heading-row">
      <p className="projection-range-label">{title}</p>
      {termContext}
    </div>
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
