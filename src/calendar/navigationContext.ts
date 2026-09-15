import { compareISODate } from './dateMath'
import type { ISODate, SchoolCalendar } from './types'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'

export const PLANNING_CONTEXT_STORAGE_KEY = 'arc.planning-context.v1'
export const PLAN_NAVIGATION_SCHEMA_VERSION = 2 as const

export type PlanFocus = 'day' | 'class' | 'lesson'

export type PlanNavigationContext = {
  schemaVersion: typeof PLAN_NAVIGATION_SCHEMA_VERSION
  calendarId: string
  view: CalendarView
  anchorDate: ISODate
  focus: PlanFocus
  courseId?: string
  sectionId?: string
  unitId?: string
  lessonId?: string
  teachingBlockId?: string
}

type PersistedPlanNavigation = {
  schemaVersion?: unknown
  calendarId?: unknown
  anchorDate?: unknown
  view?: unknown
  focus?: unknown
  courseId?: unknown
  sectionId?: unknown
  unitId?: unknown
  lessonId?: unknown
  teachingBlockId?: unknown
}

export function createPlanNavigationContext(input: {
  calendarId: string
  anchorDate: ISODate
  view?: CalendarView
  focus?: PlanFocus
  courseId?: string
  sectionId?: string
  unitId?: string
  lessonId?: string
  teachingBlockId?: string
}): PlanNavigationContext {
  return sparsePlanContext({
    schemaVersion: PLAN_NAVIGATION_SCHEMA_VERSION,
    calendarId: input.calendarId,
    view: input.view ?? DEFAULT_HOME_VIEW,
    anchorDate: input.anchorDate,
    focus: input.focus ?? 'day',
    courseId: input.courseId,
    sectionId: input.sectionId,
    unitId: input.unitId,
    lessonId: input.lessonId,
    teachingBlockId: input.teachingBlockId,
  })
}

export function savePlanningAnchor(calendarId: string, anchorDate: ISODate, storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()): boolean {
  const current = readPersistedPlan(storage)
  return savePlanNavigationContext(createPlanNavigationContext({
    calendarId,
    anchorDate,
    view: isCalendarView(current?.view) ? current.view : DEFAULT_HOME_VIEW,
    focus: isPlanFocus(current?.focus) ? current.focus : 'day',
    courseId: optionalId(current?.courseId),
    sectionId: optionalId(current?.sectionId),
    unitId: optionalId(current?.unitId),
    lessonId: optionalId(current?.lessonId),
    teachingBlockId: optionalId(current?.teachingBlockId),
  }), storage)
}

export function loadPlanningAnchor(calendar: SchoolCalendar, storage: Pick<Storage, 'getItem'> | null = browserStorage()): ISODate | null {
  return loadPlanNavigationContext(calendar, storage)?.context.anchorDate ?? null
}

export function savePlanNavigationContext(context: PlanNavigationContext, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(PLANNING_CONTEXT_STORAGE_KEY, JSON.stringify(sparsePlanContext(context)))
    return true
  } catch {
    return false
  }
}

export function loadPlanNavigationContext(calendar: SchoolCalendar, storage: Pick<Storage, 'getItem'> | null = browserStorage()): { context: PlanNavigationContext; viewWasPersisted: boolean } | null {
  const parsed = readPersistedPlan(storage)
  if (!parsed || parsed.calendarId !== calendar.id || typeof parsed.anchorDate !== 'string') return null
  const anchor = parsed.anchorDate as ISODate
  if (compareISODate(anchor, calendar.firstDay) < 0 || compareISODate(anchor, calendar.lastDay) > 0) return null
  if (parsed.schemaVersion === 1) {
    return { context: createPlanNavigationContext({ calendarId: calendar.id, anchorDate: anchor }), viewWasPersisted: false }
  }
  if (parsed.schemaVersion !== PLAN_NAVIGATION_SCHEMA_VERSION) return null
  return {
    context: createPlanNavigationContext({
      calendarId: calendar.id,
      anchorDate: anchor,
      view: isCalendarView(parsed.view) ? parsed.view : DEFAULT_HOME_VIEW,
      focus: isPlanFocus(parsed.focus) ? parsed.focus : 'day',
      courseId: optionalId(parsed.courseId),
      sectionId: optionalId(parsed.sectionId),
      unitId: optionalId(parsed.unitId),
      lessonId: optionalId(parsed.lessonId),
      teachingBlockId: optionalId(parsed.teachingBlockId),
    }),
    viewWasPersisted: isCalendarView(parsed.view),
  }
}

export function sparsePlanContext(context: PlanNavigationContext): PlanNavigationContext {
  const next: PlanNavigationContext = {
    schemaVersion: PLAN_NAVIGATION_SCHEMA_VERSION,
    calendarId: context.calendarId,
    view: context.view,
    anchorDate: context.anchorDate,
    focus: context.focus,
  }
  if (context.courseId) next.courseId = context.courseId
  if (context.sectionId) next.sectionId = context.sectionId
  if (context.unitId) next.unitId = context.unitId
  if (context.lessonId) next.lessonId = context.lessonId
  if (context.teachingBlockId) next.teachingBlockId = context.teachingBlockId
  return next
}

function readPersistedPlan(storage: Pick<Storage, 'getItem'> | null): PersistedPlanNavigation | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(PLANNING_CONTEXT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedPlanNavigation
    if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== PLAN_NAVIGATION_SCHEMA_VERSION) return null
    if (typeof parsed.calendarId !== 'string' || typeof parsed.anchorDate !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function optionalId(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === 'string' && (CALENDAR_VIEWS as readonly string[]).includes(value)
}

function isPlanFocus(value: unknown): value is PlanFocus {
  return value === 'day' || value === 'class' || value === 'lesson'
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
