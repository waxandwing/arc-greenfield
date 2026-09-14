import { compareISODate } from '../calendar/dateMath'
import { createPlanNavigationContext, sparsePlanContext, type PlanNavigationContext } from '../calendar/navigationContext'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import { projectDayContinuity } from './dayContinuityProjection'
import type { LessonWorkspace } from './lessonWorkspace'
import { buildTeachingDayRail } from './teachingDayRail'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { PlanningPeriodAttentionTarget } from './planningPeriodAttention'
import type { SectionLessonDateOverride } from './sectionSchedule'

export type PlanContextAuthority = {
  calendar: SchoolCalendar
  planning?: PlanningWorkspace | null
  units?: UnitWorkspace | null
  lessons?: LessonWorkspace | null
  overrides?: SectionLessonDateOverride[]
}

export function followPlanningAttentionTarget(
  context: PlanNavigationContext,
  target: PlanningPeriodAttentionTarget,
  block: { id: string; courseId: string | null; sectionId: string | null } | null,
): PlanNavigationContext {
  if (target.view !== 'Day') {
    return sparsePlanContext({
      ...enterPlanView(context, target.view, target.anchorDate),
      courseId: target.courseId,
      sectionId: target.sectionId,
      unitId: target.unitId,
      focus: target.sectionId ? 'class' : 'day',
    })
  }

  let next = sparsePlanContext({ ...context, view: 'Day', anchorDate: target.anchorDate })
  if (target.sectionId && block) {
    next = focusTeachingBlock(next, block)
  }
  if (target.focus === 'lesson' && target.lessonId && target.unitId && target.sectionId) {
    next = focusLesson(next, { lessonId: target.lessonId, unitId: target.unitId, courseId: target.courseId })
  }
  return next
}

export function restorePlanningPeriodBlock(
  context: PlanNavigationContext,
  block: { id: string; courseId: string | null; sectionId: string | null },
): PlanNavigationContext {
  return focusTeachingBlock(sparsePlanContext({ ...context, view: 'Day' }), block)
}

export function resolvePlanContext(context: PlanNavigationContext, authority: PlanContextAuthority): PlanNavigationContext {
  if (context.calendarId !== authority.calendar.id) {
    return createPlanNavigationContext({ calendarId: authority.calendar.id, anchorDate: authority.calendar.firstDay, view: DEFAULT_HOME_VIEW, focus: 'day' })
  }

  const dateInYear = inCalendar(context.anchorDate, authority.calendar)
  const anchorDate = dateInYear ? context.anchorDate : authority.calendar.firstDay
  const view = availableView(context.view, authority.calendar)
  const planning = authority.planning?.calendarId === authority.calendar.id ? authority.planning : null
  const units = authority.units?.calendarId === authority.calendar.id ? authority.units : null
  const lessons = authority.lessons?.calendarId === authority.calendar.id ? authority.lessons : null

  let next = sparsePlanContext({
    ...context,
    calendarId: authority.calendar.id,
    view,
    anchorDate,
    focus: dateInYear ? context.focus : 'day',
  })
  if (!dateInYear) next = dayOnly(next)

  if (!planning) return dayOnly(next)

  const section = next.sectionId ? planning.sections.find((item) => item.id === next.sectionId) : null
  const course = next.courseId
    ? planning.courses.find((item) => item.id === next.courseId)
    : section
      ? planning.courses.find((item) => item.id === section.courseId) ?? null
      : null

  if (next.sectionId && !section) next = dropToDay(next)
  else if (section && course && section.courseId !== course.id) next = dropToDay(next)
  else if (next.courseId && !course) next = dropToDay(next)
  else {
    if (section) next = { ...next, sectionId: section.id, courseId: course?.id ?? section.courseId }
  }

  const lesson = next.lessonId && lessons ? lessons.lessons.find((item) => item.id === next.lessonId) : null
  if (next.lessonId && !lesson) {
    const preservedUnitId = next.unitId
    next = { ...next, lessonId: undefined, unitId: undefined, focus: next.sectionId ? 'class' : 'day' }
    if (next.view === 'Year Map' && preservedUnitId && units?.units.some((item) => item.id === preservedUnitId && (!next.courseId || item.courseId === next.courseId))) {
      next = { ...next, unitId: preservedUnitId }
    }
  } else if (lesson) {
    if (next.courseId && lesson.courseId !== next.courseId) {
      next = { ...next, lessonId: undefined, unitId: undefined, focus: next.sectionId ? 'class' : 'day' }
    } else {
      const unit = units?.units.find((item) => item.id === lesson.unitId)
      next = { ...next, unitId: unit?.id, lessonId: lesson.id, courseId: next.courseId ?? lesson.courseId }
    }
  }

  if (view === 'Day' && planning && units && lessons) {
    const continuity = projectDayContinuity({
      date: next.anchorDate,
      planning,
      units,
      lessons,
      overrides: authority.overrides ?? [],
    })
    const rail = buildTeachingDayRail(planning, continuity)
    if (next.teachingBlockId) {
      const block = rail.find((item) => item.id === next.teachingBlockId)
        ?? (next.sectionId ? rail.find((item) => item.sectionId === next.sectionId) : undefined)
      if (!block) {
        next = { ...next, teachingBlockId: undefined }
        if (!next.sectionId) next = dropToDay(next)
      } else {
        next = {
          ...next,
          teachingBlockId: block.id,
          sectionId: block.sectionId ?? next.sectionId,
          courseId: block.courseId ?? next.courseId,
        }
      }
    } else if (next.sectionId) {
      const block = rail.find((item) => item.sectionId === next.sectionId)
      if (block) next = { ...next, teachingBlockId: block.id }
    }
  }

  return sparsePlanContext(pruneIdsForView(next, units))
}

export function focusTeachingBlock(context: PlanNavigationContext, block: { id: string; courseId: string | null; sectionId: string | null }): PlanNavigationContext {
  return sparsePlanContext({
    ...context,
    view: 'Day',
    focus: 'class',
    teachingBlockId: block.id,
    courseId: block.courseId ?? undefined,
    sectionId: block.sectionId ?? undefined,
    unitId: undefined,
    lessonId: undefined,
  })
}

export function focusLesson(context: PlanNavigationContext, input: { lessonId: string; unitId: string; courseId: string }): PlanNavigationContext {
  return sparsePlanContext({
    ...context,
    view: 'Day',
    focus: 'lesson',
    lessonId: input.lessonId,
    unitId: input.unitId,
    courseId: input.courseId,
  })
}

export function retreatPlanFocus(context: PlanNavigationContext): PlanNavigationContext {
  if (context.focus === 'lesson') {
    return sparsePlanContext({ ...context, view: 'Day', focus: 'class', unitId: undefined, lessonId: undefined })
  }
  if (context.focus === 'class') {
    return dayOnly({ ...context, view: 'Day' })
  }
  return dayOnly(context)
}

export function goPlanHome(context: PlanNavigationContext): PlanNavigationContext {
  return createPlanNavigationContext({
    calendarId: context.calendarId,
    view: 'Day',
    anchorDate: context.anchorDate,
    focus: 'day',
  })
}

/** Keeps v2 Plan spine valid after a governed shared-Lesson move (not Section Shift). */
export function contextAfterSharedLessonMove(
  context: PlanNavigationContext,
  input: { lessonId: string; fromDate: ISODate | null; toDate: ISODate },
): PlanNavigationContext {
  const movedAwayFromAnchor = input.fromDate !== null
    && context.anchorDate === input.fromDate
    && input.toDate !== input.fromDate

  if (context.view === 'Day') {
    if (context.focus === 'lesson' && context.lessonId === input.lessonId) {
      return sparsePlanContext({
        ...context,
        view: 'Day',
        anchorDate: input.toDate,
        focus: 'lesson',
      })
    }
    if (context.focus === 'lesson' && movedAwayFromAnchor) {
      return sparsePlanContext({
        ...context,
        lessonId: undefined,
        unitId: undefined,
        focus: context.sectionId || context.teachingBlockId ? 'class' : 'day',
      })
    }
    if (context.focus === 'class' && movedAwayFromAnchor && context.lessonId === input.lessonId) {
      return sparsePlanContext({
        ...context,
        lessonId: undefined,
        unitId: undefined,
      })
    }
    return context
  }

  if (context.view === 'Week' || context.view === 'Month') {
    return sparsePlanContext({
      ...context,
      lessonId: undefined,
      teachingBlockId: undefined,
      focus: context.sectionId ? 'class' : 'day',
    })
  }

  if (context.view === 'Year Map') {
    return sparsePlanContext({
      ...context,
      lessonId: undefined,
      sectionId: undefined,
      teachingBlockId: undefined,
      focus: 'day',
    })
  }

  return context
}

/** Keeps Week/Class recovery context after a governed Section Shift apply. */
export function contextAfterRecoveryShift(
  context: PlanNavigationContext,
  input: { sectionId: string },
): PlanNavigationContext {
  if (context.view === 'Week' && context.sectionId === input.sectionId) {
    return sparsePlanContext({
      ...context,
      lessonId: undefined,
      teachingBlockId: undefined,
      focus: 'class',
    })
  }
  if (context.view === 'Day' && context.focus === 'lesson' && context.sectionId === input.sectionId) {
    return sparsePlanContext({
      ...context,
      lessonId: undefined,
      unitId: undefined,
      focus: 'class',
    })
  }
  return sparsePlanContext({
    ...context,
    lessonId: undefined,
    teachingBlockId: undefined,
    focus: context.sectionId ? 'class' : context.focus,
  })
}

export function enterMonthFromYearUnit(
  context: PlanNavigationContext,
  input: { date: PlanNavigationContext['anchorDate']; courseId: string; unitId: string },
): PlanNavigationContext {
  return sparsePlanContext({
    ...enterPlanView(context, 'Month', input.date),
    courseId: input.courseId,
    unitId: input.unitId,
  })
}

export function enterPlanView(context: PlanNavigationContext, view: CalendarView, date?: PlanNavigationContext['anchorDate']): PlanNavigationContext {
  const anchorDate = date ?? context.anchorDate
  if (view === 'Week' || view === 'Month' || view === 'Year Map') {
    return enterCalendarDepth(context, view, anchorDate)
  }
  if (view === 'Day') {
    return goPlanHome({ ...context, anchorDate })
  }
  if (context.view === 'Day') {
    return createPlanNavigationContext({ calendarId: context.calendarId, anchorDate, view, focus: 'day' })
  }
  return enterCalendarDepth(context, view, anchorDate)
}

function availableView(view: CalendarView, calendar: SchoolCalendar): CalendarView {
  if (view === 'Quarter' && calendar.quarters.length === 0) return DEFAULT_HOME_VIEW
  if (view === 'Semester' && calendar.semesters.length === 0) return DEFAULT_HOME_VIEW
  return view
}

function inCalendar(date: PlanNavigationContext['anchorDate'], calendar: SchoolCalendar): boolean {
  return compareISODate(date, calendar.firstDay) >= 0 && compareISODate(date, calendar.lastDay) <= 0
}

function enterCalendarDepth(context: PlanNavigationContext, view: CalendarView, anchorDate: PlanNavigationContext['anchorDate']): PlanNavigationContext {
  return sparsePlanContext({
    ...context,
    view,
    anchorDate,
    lessonId: undefined,
    teachingBlockId: undefined,
    focus: context.sectionId ? 'class' : 'day',
  })
}

function pruneIdsForView(context: PlanNavigationContext, units: UnitWorkspace | null): PlanNavigationContext {
  if (context.view === 'Day') return pruneDayFocus(context)
  return pruneCalendarDepth(context, units)
}

function pruneDayFocus(context: PlanNavigationContext): PlanNavigationContext {
  let next = context
  if (next.focus === 'lesson' && !next.lessonId) next = { ...next, focus: next.sectionId || next.teachingBlockId ? 'class' : 'day' }
  if (next.focus === 'class' && !next.sectionId && !next.teachingBlockId) return dropToDay(next)
  if (next.focus === 'day') {
    return { ...next, courseId: undefined, sectionId: undefined, unitId: undefined, lessonId: undefined, teachingBlockId: undefined }
  }
  if (next.focus !== 'lesson') {
    return { ...next, unitId: undefined, lessonId: undefined }
  }
  return next
}

function pruneCalendarDepth(context: PlanNavigationContext, units: UnitWorkspace | null): PlanNavigationContext {
  const unit = context.unitId && units ? units.units.find((item) => item.id === context.unitId) : null
  const next = {
    ...context,
    lessonId: undefined,
    teachingBlockId: undefined,
    unitId: unit && (!context.courseId || unit.courseId === context.courseId) ? unit.id : undefined,
  }
  if (context.view === 'Year Map') {
    return { ...next, sectionId: undefined, focus: 'day' }
  }
  return { ...next, focus: context.sectionId ? 'class' : 'day' }
}

function dropToDay(context: PlanNavigationContext): PlanNavigationContext {
  return dayOnly({ ...context, focus: 'day' })
}

function dayOnly(context: PlanNavigationContext): PlanNavigationContext {
  return createPlanNavigationContext({
    calendarId: context.calendarId,
    view: context.view,
    anchorDate: context.anchorDate,
    focus: 'day',
  })
}
