import type { ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { PlanNavigationContext } from '../calendar/navigationContext'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { projectDayContinuity } from '../planning/dayContinuityProjection'
import { projectPlanningRange } from '../planning/planningProjection'
import { projectMonthPlanning } from '../planning/monthPlanningProjection'
import type { DayContinuityLesson, LessonWorkspace, PlanningWorkspace, ShiftPersistenceInput, TeachingDayRailItem, UnitWorkspace } from '../planning'
import { PlanningDayContinuityView } from './PlanningDayContinuityView'
import { PlanningMonthView } from './PlanningMonthView'
import { PlanningWeekDayView } from './PlanningWeekDayView'
import { PlanningYearView } from './PlanningYearView'
import { PlanningNotes } from './PlanningNotes'
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
  planContext?: PlanNavigationContext | null
  showWeekends?: boolean
  onStartClass?: (sectionId: string, lessonId: string) => void
  onSelectDate?: (date: ISODate, view: CalendarView) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onAddNote?: (date: ISODate, text: string) => boolean
  onDeleteNote?: (noteId: string) => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarProjectionView({ view, calendar, anchorDate, planningContext, planContext, showWeekends = false, onStartClass, onSelectDate, onSelectTeachingBlock, onSelectLesson, onRetreatPlanFocus, onOpenWorkspace, onAddNote, onDeleteNote }: Props) {
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
          planContext={planContext}
          onStartClass={onStartClass}
          onSelectTeachingBlock={onSelectTeachingBlock}
          onSelectLesson={onSelectLesson}
          onRetreatPlanFocus={onRetreatPlanFocus}
          onOpenWorkspace={onOpenWorkspace}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          termContext={<TermContext quarters={projection.quarter ? [projection.quarter] : []} semesters={projection.semester ? [projection.semester] : []} />}
        />
      )
    }
    case 'Week': {
      const projection = projectWeek(calendar, anchorDate)
      const visibleDays = showWeekends ? projection.days : projection.days.filter((day) => !day.isWeekend)
      return (
        <PlanningWeekStrip
          title={formatDateRange(visibleDays[0]?.date ?? projection.startDate, visibleDays[visibleDays.length - 1]?.date ?? projection.endDate)}
          days={visibleDays}
          focusDate={planContext?.anchorDate ?? anchorDate}
          planningContext={planningContext}
          planContext={planContext}
          onSelectDate={(date) => onSelectDate?.(date, 'Day')}
          onOpenWorkspace={onOpenWorkspace}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
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
            <><PlanningNotes notes={planningContext?.planning.notes ?? []} dates={projection.weeks.flatMap((week) => week.days.map((day) => day.date))} focusDate={anchorDate} onAdd={onAddNote} onDelete={onDeleteNote} /><div className="planning-scroll-frame"><PlanningMonthView month={projection} planning={monthPlanning} onSelectDate={(date) => onSelectDate?.(date, 'Day')} /></div></>
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
      if (planningContext) {
        return <PlanningYearView calendar={calendar} planning={planningContext.planning} units={planningContext.units} onSelectUnit={(date) => onSelectDate?.(date, 'Month')} />
      }
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

function PlanningDayStrip({ title, day, planningContext, planContext, termContext, onStartClass, onSelectTeachingBlock, onSelectLesson, onRetreatPlanFocus, onOpenWorkspace, onAddNote, onDeleteNote }: {
  title: string
  day: ProjectedDay
  planningContext?: PlanningContext | null
  planContext?: PlanNavigationContext | null
  termContext?: ReactNode
  onStartClass?: (sectionId: string, lessonId: string) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onAddNote?: (date: ISODate, text: string) => boolean
  onDeleteNote?: (noteId: string) => void
}) {
  return (
    <section className="projection-section" aria-label={title}>
      <ProjectionHeading title={title} termContext={termContext} />
      {planningContext ? (
        <><PlanningNotes notes={planningContext.planning.notes ?? []} dates={[day.date]} focusDate={day.date} onAdd={onAddNote} onDelete={onDeleteNote} /><PlanningDayContinuityView
          day={day}
          continuity={projectDayContinuity({
            date: day.date,
            planning: planningContext.planning,
            units: planningContext.units,
            lessons: planningContext.lessons,
            overrides: planningContext.shiftState?.overrides ?? [],
          })}
          lessons={planningContext.lessons}
          planning={planningContext.planning}
          planFocus={planContext?.focus ?? 'day'}
          selectedBlockId={planContext?.teachingBlockId}
          selectedLessonId={planContext?.lessonId}
          onSelectBlock={onSelectTeachingBlock}
          onSelectLesson={onSelectLesson}
          onRetreat={onRetreatPlanFocus}
          onOpenWorkspace={onOpenWorkspace}
          onStartClass={onStartClass}
        /></>
      ) : (
        <div className="projection-day-strip projection-day-strip--single">
          <CalendarDayCell day={day} showWeekday />
        </div>
      )}
    </section>
  )
}

function PlanningWeekStrip({ title, days, focusDate, planningContext, planContext, termContext, onSelectDate, onOpenWorkspace, onAddNote, onDeleteNote }: {
  title: string
  days: ProjectedDay[]
  focusDate: ISODate
  planningContext?: PlanningContext | null
  planContext?: PlanNavigationContext | null
  termContext?: ReactNode
  onSelectDate?: (date: ISODate) => void
  onOpenWorkspace?: () => void
  onAddNote?: (date: ISODate, text: string) => boolean
  onDeleteNote?: (noteId: string) => void
}) {
  return (
    <section
      className="projection-section planning-week"
      aria-label={title}
      data-plan-view="Week"
      data-plan-date={focusDate}
      data-plan-course={planContext?.courseId ?? ''}
      data-plan-section={planContext?.sectionId ?? ''}
      data-plan-lesson={planContext?.lessonId ?? ''}
    >
      <ProjectionHeading title={title} termContext={termContext} />
      {onOpenWorkspace ? (
        <p className="planning-week-actions">
          <button type="button" className="text-button" onClick={onOpenWorkspace}>Open Workspace</button>
        </p>
      ) : null}
      {planningContext ? (
        <><PlanningNotes notes={planningContext.planning.notes ?? []} dates={days.map((day) => day.date)} focusDate={focusDate} onAdd={onAddNote} onDelete={onDeleteNote} /><div className="planning-scroll-frame"><PlanningWeekDayView days={days} planning={planningForDays(days, planningContext)} focusDate={focusDate} onSelectDate={onSelectDate} /></div></>
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
