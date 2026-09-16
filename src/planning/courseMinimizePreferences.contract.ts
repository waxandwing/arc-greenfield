import type { ProjectedDay } from '../calendar/projections'
import type { ISODate } from '../calendar/types'
import type { PlanningCourseGroup, PlanningLessonPlacement } from './planningProjection'
import {
  COURSE_MINIMIZE_STORAGE_KEY,
  courseHasWeekendTeaching,
  loadCourseMinimizePreferences,
  normalizeCourseMinimizePreferences,
  resolveCourseMinimized,
  saveCourseMinimizePreferences,
  shouldAutoMinimizeCourse,
  toggleCourseMinimized,
  weekendAutoMinimizeActive,
  weekShowsWeekendColumns,
} from './courseMinimizePreferences'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function day(date: ISODate, isWeekend: boolean): ProjectedDay {
  return {
    date,
    kind: isWeekend ? 'no-school' : 'instructional',
    inSchoolYear: true,
    isWeekend,
  }
}

function lesson(courseId: string, date: ISODate, title: string): PlanningLessonPlacement {
  return {
    lessonId: `${courseId}-${date}`,
    unitId: 'unit',
    courseId,
    title,
    sequence: 1,
    datePolicy: 'flexible',
    sharedPlannedDate: null,
    effectiveDate: date,
    isSectionOverride: false,
    deliveryStatus: 'not-started',
    taughtDate: null,
    resumeNote: null,
    directions: [],
    materials: [],
    phases: [],
    resources: [],
  }
}

function courseWithWeekendLessons(id: string, weekendDates: ISODate[]): PlanningCourseGroup {
  const dates: ISODate[] = ['2026-09-13', '2026-09-14', '2026-09-19', '2026-09-20']
  return {
    course: { id, title: id },
    unitSpans: [],
    sections: [{
      section: { id: `${id}-s1`, courseId: id, calendarId: 'cal', name: 'P1' },
      days: dates.map((date) => ({
        date,
        lessons: weekendDates.includes(date) ? [lesson(id, date, 'Weekend work')] : [],
      })),
    }],
  }
}

const weekdayOnly = [
  day('2026-09-14', false),
  day('2026-09-15', false),
  day('2026-09-16', false),
  day('2026-09-17', false),
  day('2026-09-18', false),
]
const withWeekends = [
  day('2026-09-13', true),
  day('2026-09-14', false),
  day('2026-09-15', false),
  day('2026-09-16', false),
  day('2026-09-17', false),
  day('2026-09-18', false),
  day('2026-09-19', true),
]

assert(!weekShowsWeekendColumns(weekdayOnly), 'Mon–Fri teaching week must not show weekend columns.')
assert(weekShowsWeekendColumns(withWeekends), 'Show-weekends week must include Sat/Sun columns.')
assert(!weekendAutoMinimizeActive(weekdayOnly, '2026-09-15'), 'Weekday grid without weekend focus must not auto-minimize.')
assert(weekendAutoMinimizeActive(withWeekends, '2026-09-15'), 'Visible Sat/Sun columns activate weekend auto-minimize.')
assert(weekendAutoMinimizeActive(withWeekends, '2026-09-13'), 'Focus on a visible weekend day is Sat/Sun-focused.')

const idle = courseWithWeekendLessons('course-apah', [])
const busyWeekend = courseWithWeekendLessons('course-2d', ['2026-09-19'])

assert(!courseHasWeekendTeaching(idle, withWeekends), 'Empty Sat/Sun slots mean no weekend teaching.')
assert(courseHasWeekendTeaching(busyWeekend, withWeekends), 'A lesson on Sat/Sun counts as weekend teaching.')
assert(shouldAutoMinimizeCourse(idle, withWeekends), 'Courses with empty weekend columns auto-minimize.')
assert(!shouldAutoMinimizeCourse(busyWeekend, withWeekends), 'Courses that teach the weekend stay expanded.')
assert(!shouldAutoMinimizeCourse(idle, weekdayOnly), 'No auto-minimize when weekends are hidden.')

const prefs = normalizeCourseMinimizePreferences({
  minimizedCourseIds: ['course-3d'],
  weekendExpandOverrides: ['course-apah'],
})
assert(resolveCourseMinimized('course-3d', idle, withWeekends, prefs).reason === 'manual', 'Manual minimize wins.')
assert(resolveCourseMinimized('course-apah', idle, withWeekends, prefs).minimized === false, 'Weekend expand override keeps auto candidates open.')
assert(resolveCourseMinimized('course-idle', idle, withWeekends, prefs).reason === 'weekend-auto', 'Default weekend empty courses collapse.')

const afterToggleOpen = toggleCourseMinimized(prefs, 'course-idle', true, true)
assert(afterToggleOpen.weekendExpandOverrides.includes('course-idle'), 'Expanding an auto-minimized course records an override.')
assert(!afterToggleOpen.minimizedCourseIds.includes('course-idle'), 'Expand clears manual minimize.')

const afterToggleClosed = toggleCourseMinimized(afterToggleOpen, 'course-idle', false, true)
assert(afterToggleClosed.minimizedCourseIds.includes('course-idle'), 'Manual minimize is persisted.')
assert(!afterToggleClosed.weekendExpandOverrides.includes('course-idle'), 'Minimize clears weekend expand override.')

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}
saveCourseMinimizePreferences(afterToggleClosed, storage)
assert(memory.has(COURSE_MINIMIZE_STORAGE_KEY), 'Minimize prefs write to localStorage key.')
const loaded = loadCourseMinimizePreferences(storage)
assert(loaded.minimizedCourseIds.includes('course-idle'), 'Minimize prefs round-trip through storage.')

console.log('Course minimize preferences contract passed')
