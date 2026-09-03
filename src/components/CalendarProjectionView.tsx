import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { ISODate, SchoolCalendar } from '../calendar/types'

type Props = {
  view: CalendarView
  calendar: SchoolCalendar | null
  anchorDate: ISODate | null
}

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
      return <DayStrip title={projection.date} days={[projection.day]} single />
    }
    case 'Week': {
      const projection = projectWeek(calendar, anchorDate)
      return <DayStrip title={`${projection.startDate} – ${projection.endDate}`} days={projection.days} />
    }
    case 'Month': {
      const projection = projectMonth(calendar, anchorDate)
      return (
        <div className="month-projection" aria-label={`${projection.monthKey} calendar grid`}>
          {projection.weeks.map((week) => (
            <div className="month-week" key={week.startDate}>
              {week.days.map((day) => <CalendarDayCell key={day.date} day={day} />)}
            </div>
          ))}
        </div>
      )
    }
    case 'Quarter': {
      const projection = projectQuarter(calendar, anchorDate)
      return projection ? <RangeProjection title={projection.label} days={projection.days} /> : <MissingBoundary label="No quarter contains this date." />
    }
    case 'Semester': {
      const projection = projectSemester(calendar, anchorDate)
      return projection ? <RangeProjection title={projection.label} days={projection.days} /> : <MissingBoundary label="No semester contains this date." />
    }
    case 'Year Map': {
      const projection = projectYearMap(calendar)
      return <RangeProjection title={calendar.schoolYearLabel} days={projection.days} compact />
    }
  }
}

function DayStrip({ title, days, single = false }: { title: string; days: ProjectedDay[]; single?: boolean }) {
  return (
    <section className="projection-section" aria-label={title}>
      <p className="projection-range-label">{title}</p>
      <div className={single ? 'projection-day-strip projection-day-strip--single' : 'projection-day-strip'}>
        {days.map((day) => <CalendarDayCell key={day.date} day={day} />)}
      </div>
    </section>
  )
}

function RangeProjection({ title, days, compact = false }: { title: string; days: ProjectedDay[]; compact?: boolean }) {
  return (
    <section className="projection-section" aria-label={title}>
      <p className="projection-range-label">{title}</p>
      <div className={compact ? 'projection-range projection-range--compact' : 'projection-range'}>
        {days.map((day) => <CalendarDayCell key={day.date} day={day} compact={compact} />)}
      </div>
    </section>
  )
}

function CalendarDayCell({ day, compact = false }: { day: ProjectedDay; compact?: boolean }) {
  const classes = [
    'calendar-day-cell',
    `calendar-day-cell--${day.kind}`,
    day.isWeekend ? 'calendar-day-cell--weekend' : '',
    day.inSchoolYear ? '' : 'calendar-day-cell--outside-year',
    compact ? 'calendar-day-cell--compact' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} data-date={day.date} data-kind={day.kind}>
      <span className="calendar-day-date">{day.date.slice(8)}</span>
      {!compact && day.label ? <span className="calendar-day-label">{day.label}</span> : null}
      {!compact && day.kind === 'unknown' ? <span className="calendar-day-status">Unknown</span> : null}
    </div>
  )
}

function MissingBoundary({ label }: { label: string }) {
  return <p className="projection-empty-state">{label}</p>
}
