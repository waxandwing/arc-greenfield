import type { ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap, type ProjectedDay } from '../calendar/projections'
import type { PlanNavigationContext } from '../calendar/navigationContext'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { PLAN_WEEKDAY_LABELS } from '../calendar/dateMath'
import { projectDayContinuity } from '../planning/dayContinuityProjection'
import { projectPlanningRange } from '../planning/planningProjection'
import { projectMonthPlanning } from '../planning/monthPlanningProjection'
import type { CaptureWorkspace, DayContinuityLesson, LessonWorkspace, PlanningPeriodAttentionItem, PlanningWorkspace, ShiftPersistenceInput, TeachingDayRailItem, UnitWorkspace } from '../planning'
import { PlanningDayContinuityView } from './PlanningDayContinuityView'
import { PlanningMonthView } from './PlanningMonthView'
import { PlanningWeekDayView } from './PlanningWeekDayView'
import { PlanningYearView } from './PlanningYearView'
import { SchoolYearDeskView } from './SchoolYearDeskView'
import { CalendarDayNotes, type CalendarDayNoteHandlers } from './CalendarDayNotes'
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
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
  onSelectDate?: (date: ISODate, view: CalendarView) => void
  onSelectYearUnit?: (input: { date: ISODate; courseId: string; unitId: string }) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onFollowPlanningAttention?: (item: PlanningPeriodAttentionItem) => void
  onReturnToPlanningPeriod?: () => void
  planningPeriodReturnPending?: boolean
  captureWorkspace?: CaptureWorkspace | null
  dayNotes?: CalendarDayNoteHandlers
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  onMoveCaptureToDate?: (captureId: string, anchorDate: ISODate | null) => boolean
}

export function CalendarProjectionView({ view, calendar, anchorDate, planningContext, planContext, showWeekends = false, onStartClass, onSelectDate, onSelectYearUnit, onSelectTeachingBlock, onSelectLesson, onRetreatPlanFocus, onOpenWorkspace, onFollowPlanningAttention, onReturnToPlanningPeriod, planningPeriodReturnPending = false, captureWorkspace = null, dayNotes, onSetLessonImportant, onBeginPlanLessonMove, onOpenRecoveryForSection, onMoveCaptureToDate }: Props) {
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
          onFollowPlanningAttention={onFollowPlanningAttention}
          onReturnToPlanningPeriod={onReturnToPlanningPeriod}
          planningPeriodReturnPending={planningPeriodReturnPending}
          captureWorkspace={captureWorkspace}
          dayNotes={dayNotes}
          onSetLessonImportant={onSetLessonImportant}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
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
          onReturnToPlanningPeriod={onReturnToPlanningPeriod}
          planningPeriodReturnPending={planningPeriodReturnPending}
          onSetLessonImportant={onSetLessonImportant}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
          onStartClass={onStartClass}
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
        <section
          className="projection-section month-section planning-month-stage"
          aria-label={`${formatMonth(anchorDate)} calendar`}
          data-plan-view="Month"
          data-plan-date={anchorDate}
          data-plan-course={planContext?.courseId ?? ''}
          data-plan-section={planContext?.sectionId ?? ''}
          data-plan-lesson={planContext?.lessonId ?? ''}
        >
          <div className="projection-heading-row">
            <p className="projection-range-label">{formatMonth(anchorDate)}</p>
            <TermContext quarters={projection.quarters} semesters={projection.semesters} />
          </div>
          {monthPlanning ? (
            <div className="planning-scroll-frame">
              <PlanningMonthView
                month={projection}
                planning={monthPlanning}
                notes={planningContext?.planning.notes ?? []}
                monthDateBounds={{ min: calendar.firstDay, max: calendar.lastDay }}
                focusDate={planContext?.anchorDate ?? anchorDate}
                planContext={planContext}
                lessons={planningContext?.lessons ?? null}
                onSelectDate={(date) => onSelectDate?.(date, 'Day')}
                onSelectUnit={onSelectYearUnit}
                onBeginPlanLessonMove={onBeginPlanLessonMove}
                onSetLessonImportant={onSetLessonImportant}
                dayNotes={dayNotes}
                captureWorkspace={captureWorkspace}
                onMoveCaptureToDate={onMoveCaptureToDate}
              />
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
      if (planningContext) {
        return (
          <section
            className="projection-section year-section planning-year-stage"
            aria-label={`${calendar.schoolYearLabel} course and unit progression`}
            data-plan-view="Year Map"
            data-plan-date={anchorDate}
            data-plan-course={planContext?.courseId ?? ''}
            data-plan-section={planContext?.sectionId ?? ''}
            data-plan-unit={planContext?.unitId ?? ''}
            data-plan-lesson={planContext?.lessonId ?? ''}
          >
            <div className="projection-heading-row projection-heading-row--year">
              <div>
                <p className="projection-range-label">{calendar.schoolYearLabel}</p>
                <p className="projection-subtitle">{formatDateRange(projection.startDate, projection.endDate)}</p>
              </div>
              <TermContext quarters={projection.quarters} semesters={projection.semesters} detailed />
            </div>
            <div className="planning-scroll-frame planning-scroll-frame--year-desk">
              <SchoolYearDeskView
                calendar={calendar}
                anchorDate={anchorDate}
                onSelectDate={(date) => onSelectDate?.(date, 'Month')}
              />
              <details className="planning-year-progression" open>
                <summary>Course & unit progression</summary>
                <PlanningYearView calendar={calendar} planning={planningContext.planning} units={planningContext.units} onSelectUnit={(input) => onSelectYearUnit?.(input)} />
              </details>
            </div>
          </section>
        )
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

function PlanningDayStrip({ title, day, planningContext, planContext, termContext, onStartClass, onSelectTeachingBlock, onSelectLesson, onRetreatPlanFocus, onFollowPlanningAttention, onReturnToPlanningPeriod, planningPeriodReturnPending, captureWorkspace, dayNotes, onSetLessonImportant, onBeginPlanLessonMove, onOpenRecoveryForSection }: {
  title: string
  day: ProjectedDay
  planningContext?: PlanningContext | null
  planContext?: PlanNavigationContext | null
  termContext?: ReactNode
  onStartClass?: (sectionId: string, lessonId: string, liveDate?: ISODate) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onFollowPlanningAttention?: (item: import('../planning').PlanningPeriodAttentionItem) => void
  onReturnToPlanningPeriod?: () => void
  planningPeriodReturnPending?: boolean
  captureWorkspace?: import('../planning').CaptureWorkspace | null
  dayNotes?: CalendarDayNoteHandlers
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onBeginPlanLessonMove?: Props['onBeginPlanLessonMove']
  onOpenRecoveryForSection?: Props['onOpenRecoveryForSection']
}) {
  const noteHandlers: CalendarDayNoteHandlers = {
    onAdd: dayNotes?.onAdd,
    onUpdateText: dayNotes?.onUpdateText,
    onMove: dayNotes?.onMove,
    onRemove: dayNotes?.onRemove,
    onSetImportant: dayNotes?.onSetImportant,
  }

  return (
    <section className="projection-section" aria-label={title}>
      {planningContext ? null : <ProjectionHeading title={title} termContext={termContext} />}
      {planningContext ? (
        <>
          <div className="day-continuity-day-notes">
            <CalendarDayNotes notes={planningContext.planning.notes ?? []} date={day.date} handlers={noteHandlers} />
          </div>
          <PlanningDayContinuityView
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
          onFollowAttention={onFollowPlanningAttention}
          onReturnToPlanningPeriod={onReturnToPlanningPeriod}
          planningReturnPending={planningPeriodReturnPending}
          units={planningContext.units}
          captures={captureWorkspace ?? null}
          overrides={planningContext.shiftState?.overrides ?? []}
          onStartClass={onStartClass}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onSetLessonImportant={onSetLessonImportant}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
        />
        </>
      ) : (
        <div className="projection-day-strip projection-day-strip--single">
          <CalendarDayCell day={day} showWeekday />
        </div>
      )}
    </section>
  )
}

function PlanningWeekStrip({ title, days, focusDate, planningContext, planContext, termContext, onSelectDate, onReturnToPlanningPeriod, planningPeriodReturnPending, onSetLessonImportant, onBeginPlanLessonMove, onOpenRecoveryForSection, onStartClass }: {
  title: string
  days: ProjectedDay[]
  focusDate: ISODate
  planningContext?: PlanningContext | null
  planContext?: PlanNavigationContext | null
  termContext?: ReactNode
  onSelectDate?: (date: ISODate) => void
  onReturnToPlanningPeriod?: () => void
  planningPeriodReturnPending?: boolean
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onBeginPlanLessonMove?: Props['onBeginPlanLessonMove']
  onOpenRecoveryForSection?: Props['onOpenRecoveryForSection']
  onStartClass?: Props['onStartClass']
}) {
  return (
    <section
      className="projection-section planning-week"
      aria-label="Teaching week calendar"
      data-plan-view="Week"
      data-plan-calendar-surface="teaching-week"
      data-plan-date={focusDate}
      data-plan-course={planContext?.courseId ?? ''}
      data-plan-section={planContext?.sectionId ?? ''}
      data-plan-lesson={planContext?.lessonId ?? ''}
    >
      <span className="sr-only">{title}</span>
      {termContext ? <div className="projection-heading-row projection-heading-row--terms-only">{termContext}</div> : null}
      {planningPeriodReturnPending && onReturnToPlanningPeriod ? (
        <p className="planning-week-actions"><button type="button" className="plan-back-link" onClick={onReturnToPlanningPeriod}>Back to Planning period</button></p>
      ) : null}
      {planningContext ? (
        <>
          <div className="planning-scroll-frame">
            <PlanningWeekDayView
              days={days}
              planning={planningForDays(days, planningContext)}
              focusDate={focusDate}
              planContext={planContext}
              onSelectDate={onSelectDate}
              onBeginPlanLessonMove={onBeginPlanLessonMove}
              onOpenRecoveryForSection={onOpenRecoveryForSection}
              onSetLessonImportant={onSetLessonImportant}
              onStartClass={onStartClass}
              lessonImportantById={(lessonId) => planningContext.lessons.lessons.find((lesson) => lesson.id === lessonId)?.important === true}
            />
          </div>
        </>
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
        {PLAN_WEEKDAY_LABELS.map((weekday) => <span key={weekday}>{weekday}</span>)}
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
