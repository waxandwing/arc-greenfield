import type { ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectSundayFirstWeek, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { projectDayContinuity } from '../planning/dayContinuityProjection'
import { projectPlanningRange } from '../planning/planningProjection'
import { projectMonthPlanning } from '../planning/monthPlanningProjection'
import type { LessonWorkspace, PlanningWorkspace, ShiftPersistenceInput, UnitWorkspace } from '../planning'
import { PlanningDayContinuityView } from './PlanningDayContinuityView'
import { PlanningMonthView } from './PlanningMonthView'
import { PlanningWeekDayView } from './PlanningWeekDayView'
import { CalendarDayCell, MissingBoundary, ProjectionHeading, RangeProjection, TermContext, WeekdayAlignedRange } from './CalendarProjectionPrimitives'
import { formatDateRange, formatLongDate, formatMonth } from './dateLabels'

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
  showWeekends?: boolean
  onLaunchLive?: (sectionId: string, lessonId: string) => void
  dayFocusSectionId?: string | null
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarProjectionView({ view, calendar, anchorDate, planningContext, showWeekends = false, onLaunchLive, dayFocusSectionId = null }: Props) {
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
        <PlanningDayStrip
          title={formatLongDate(projection.date)}
          day={projection.day}
          planningContext={planningContext}
          onLaunchLive={onLaunchLive}
          dayFocusSectionId={dayFocusSectionId}
          termContext={<TermContext quarters={projection.quarter ? [projection.quarter] : []} semesters={projection.semester ? [projection.semester] : []} />}
        />
      )
    }
    case 'Week': {
      const projection = showWeekends ? projectSundayFirstWeek(calendar, anchorDate) : projectWeek(calendar, anchorDate)
      const visibleDays = showWeekends ? projection.days : projection.days.filter((day) => !day.isWeekend)
      return (
        <PlanningWeekStrip
          title={formatDateRange(visibleDays[0]?.date ?? projection.startDate, visibleDays[visibleDays.length - 1]?.date ?? projection.endDate)}
          days={visibleDays}
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
            <CalendarOnlyMonth projection={projection} label={formatMonth(anchorDate)} />
          )}
        </section>
      )
    }
    case 'Quarter': {
      const projection = projectQuarter(calendar, anchorDate)
      return projection
        ? <RangeProjection title={projection.label} subtitle={formatDateRange(projection.startDate, projection.endDate)} days={projection.days} />
        : <MissingBoundary label="Quarter dates are not configured for this part of the school year." />
    }
    case 'Semester': {
      const projection = projectSemester(calendar, anchorDate)
      return projection
        ? <RangeProjection title={projection.label} subtitle={formatDateRange(projection.startDate, projection.endDate)} days={projection.days} />
        : <MissingBoundary label="Semester dates are not configured for this part of the school year." />
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
          <WeekdayAlignedRange days={projection.days} compact />
        </section>
      )
    }
  }
}

function PlanningDayStrip({
  title,
  day,
  planningContext,
  termContext,
  onLaunchLive,
  dayFocusSectionId,
}: {
  title: string
  day: ProjectedDay
  planningContext?: PlanningContext | null
  termContext?: ReactNode
  onLaunchLive?: (sectionId: string, lessonId: string) => void
  dayFocusSectionId?: string | null
}) {
  return (
    <section className="projection-section" aria-label={title}>
      <ProjectionHeading title={title} termContext={termContext} />
      {planningContext ? (
        <PlanningDayContinuityView
          day={day}
          continuity={projectDayContinuity({
            date: day.date,
            planning: planningContext.planning,
            units: planningContext.units,
            lessons: planningContext.lessons,
            overrides: planningContext.shiftState?.overrides ?? [],
          })}
          onLaunchLive={onLaunchLive}
          initialFocusedSectionId={dayFocusSectionId}
        />
      ) : (
        <div className="projection-day-strip projection-day-strip--single">
          <CalendarDayCell day={day} showWeekday />
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

function CalendarOnlyMonth({ projection, label }: { projection: ReturnType<typeof projectMonth>; label: string }) {
  return (
    <>
      <div className="month-weekday-row" aria-hidden="true">
        {WEEKDAY_LABELS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="month-projection" role="region" aria-label={`${label} calendar grid`}>
        {projection.weeks.map((week) => (
          <div className="month-week" key={week.startDate}>
            {week.days.map((day) => <CalendarDayCell key={day.date} day={day} />)}
          </div>
        ))}
      </div>
    </>
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
