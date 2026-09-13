import { compareISODate } from '../calendar/dateMath'
import { createPlanNavigationContext, sparsePlanContext, type PlanNavigationContext } from '../calendar/navigationContext'
import type { SchoolCalendar } from '../calendar/types'
import { DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import { projectDayContinuity } from './dayContinuityProjection'
import type { LessonWorkspace } from './lessonWorkspace'
import { buildTeachingDayRail } from './teachingDayRail'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { SectionLessonDateOverride } from './sectionSchedule'

export type PlanContextAuthority = {
  calendar: SchoolCalendar
  planning?: PlanningWorkspace | null
  units?: UnitWorkspace | null
  lessons?: LessonWorkspace | null
  overrides?: SectionLessonDateOverride[]
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
    next = { ...next, lessonId: undefined, unitId: undefined, focus: next.sectionId ? 'class' : 'day' }
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

  if (next.focus === 'lesson' && !next.lessonId) next = { ...next, focus: next.sectionId || next.teachingBlockId ? 'class' : 'day' }
  if (next.focus === 'class' && !next.sectionId && !next.teachingBlockId) next = dropToDay(next)
  if (next.focus === 'day') {
    next = { ...next, courseId: next.view === 'Day' ? undefined : next.courseId, sectionId: next.view === 'Day' ? undefined : next.sectionId, unitId: undefined, lessonId: undefined, teachingBlockId: next.view === 'Day' ? undefined : next.teachingBlockId }
  }
  if (next.focus !== 'lesson') {
    next = { ...next, unitId: next.focus === 'class' ? undefined : next.unitId, lessonId: undefined }
  }

  return sparsePlanContext(next)
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

function availableView(view: CalendarView, calendar: SchoolCalendar): CalendarView {
  if (view === 'Quarter' && calendar.quarters.length === 0) return DEFAULT_HOME_VIEW
  if (view === 'Semester' && calendar.semesters.length === 0) return DEFAULT_HOME_VIEW
  return view
}

function inCalendar(date: PlanNavigationContext['anchorDate'], calendar: SchoolCalendar): boolean {
  return compareISODate(date, calendar.firstDay) >= 0 && compareISODate(date, calendar.lastDay) <= 0
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
