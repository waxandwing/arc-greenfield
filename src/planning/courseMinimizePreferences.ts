import type { ProjectedDay } from '../calendar/projections'
import type { PlanningCourseGroup } from './planningProjection'

export const COURSE_MINIMIZE_STORAGE_KEY = 'arc.planning-course-minimize.v1'

export type CourseMinimizePreferences = {
  /** Course ids the teacher manually collapsed. */
  minimizedCourseIds: string[]
  /**
   * Courses the teacher expanded while weekend auto-minimize would apply.
   * Persists so expand survives reload; cleared when they minimize again.
   */
  weekendExpandOverrides: string[]
}

export type CourseMinimizeReason = 'manual' | 'weekend-auto'

export const DEFAULT_COURSE_MINIMIZE_PREFERENCES: CourseMinimizePreferences = {
  minimizedCourseIds: [],
  weekendExpandOverrides: [],
}

export function loadCourseMinimizePreferences(
  storage: Pick<Storage, 'getItem'> | null = browserStorage(),
): CourseMinimizePreferences {
  if (!storage) return DEFAULT_COURSE_MINIMIZE_PREFERENCES
  try {
    const raw = storage.getItem(COURSE_MINIMIZE_STORAGE_KEY)
    if (!raw) return DEFAULT_COURSE_MINIMIZE_PREFERENCES
    return normalizeCourseMinimizePreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_COURSE_MINIMIZE_PREFERENCES
  }
}

export function saveCourseMinimizePreferences(
  preferences: CourseMinimizePreferences,
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(COURSE_MINIMIZE_STORAGE_KEY, JSON.stringify(normalizeCourseMinimizePreferences(preferences)))
    return true
  } catch {
    return false
  }
}

export function normalizeCourseMinimizePreferences(value: unknown): CourseMinimizePreferences {
  if (!value || typeof value !== 'object') return DEFAULT_COURSE_MINIMIZE_PREFERENCES
  const candidate = value as Partial<CourseMinimizePreferences>
  return {
    minimizedCourseIds: uniqueIds(candidate.minimizedCourseIds),
    weekendExpandOverrides: uniqueIds(candidate.weekendExpandOverrides),
  }
}

/** Visible week includes Sat/Sun columns (or is weekend-only). */
export function weekShowsWeekendColumns(days: ProjectedDay[]): boolean {
  return days.some((day) => day.isWeekend)
}

/** True when focus sits on a visible weekend day (Sat/Sun-focused week). */
export function weekIsWeekendFocused(days: ProjectedDay[], focusDate?: string | null): boolean {
  if (!focusDate) return false
  return days.some((day) => day.date === focusDate && day.isWeekend)
}

/**
 * Weekend auto-minimize applies when Sat/Sun columns are in the week grid,
 * or when the focused visible day is Sat/Sun. Teacher-sensible rule: collapse
 * courses with no lessons on those weekend days (empty Sat/Sun → tuck the row).
 */
export function weekendAutoMinimizeActive(days: ProjectedDay[], focusDate?: string | null): boolean {
  return weekShowsWeekendColumns(days) || weekIsWeekendFocused(days, focusDate)
}

export function courseHasWeekendTeaching(course: PlanningCourseGroup, days: ProjectedDay[]): boolean {
  const weekendDates = new Set(days.filter((day) => day.isWeekend).map((day) => day.date))
  if (weekendDates.size === 0) return false
  return course.sections.some((section) =>
    section.days.some((slot) => weekendDates.has(slot.date) && slot.lessons.length > 0),
  )
}

export function shouldAutoMinimizeCourse(
  course: PlanningCourseGroup,
  days: ProjectedDay[],
  focusDate?: string | null,
): boolean {
  if (!weekendAutoMinimizeActive(days, focusDate)) return false
  return !courseHasWeekendTeaching(course, days)
}

export function resolveCourseMinimized(
  courseId: string,
  course: PlanningCourseGroup,
  days: ProjectedDay[],
  preferences: CourseMinimizePreferences,
  focusDate?: string | null,
): { minimized: boolean; reason: CourseMinimizeReason | null } {
  if (preferences.minimizedCourseIds.includes(courseId)) {
    return { minimized: true, reason: 'manual' }
  }
  if (
    shouldAutoMinimizeCourse(course, days, focusDate) &&
    !preferences.weekendExpandOverrides.includes(courseId)
  ) {
    return { minimized: true, reason: 'weekend-auto' }
  }
  return { minimized: false, reason: null }
}

/** Toggle minimize; records manual collapse or weekend expand override. */
export function toggleCourseMinimized(
  preferences: CourseMinimizePreferences,
  courseId: string,
  currentlyMinimized: boolean,
  wouldAutoMinimize: boolean,
): CourseMinimizePreferences {
  const minimized = new Set(preferences.minimizedCourseIds)
  const overrides = new Set(preferences.weekendExpandOverrides)

  if (currentlyMinimized) {
    minimized.delete(courseId)
    if (wouldAutoMinimize) overrides.add(courseId)
    else overrides.delete(courseId)
  } else {
    overrides.delete(courseId)
    minimized.add(courseId)
  }

  return {
    minimizedCourseIds: [...minimized],
    weekendExpandOverrides: [...overrides],
  }
}

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim()) seen.add(entry)
  }
  return [...seen]
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
