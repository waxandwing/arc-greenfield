import type { GauntletDemoBundle } from './gauntletDemo'
import { GAUNTLET_DEMO_CALENDAR_ID } from './gauntletDemo'
import { PLAN_NAVIGATION_SCHEMA_VERSION } from '../calendar/navigationContext'
import type { ISODate } from '../calendar/types'

/** Kelly Teaching week comp (Sept 7–11): AP / 2D / 3D + Mesopotamia unit grid. */
export function buildKellyDeskDemoBundle(): GauntletDemoBundle {
  const calendarId = GAUNTLET_DEMO_CALENDAR_ID
  const courses = [
    { id: 'course-apah', title: 'AP Art History' },
    { id: 'course-2d', title: '2D Art 1' },
    { id: 'course-3d', title: '3D Art 1' },
  ]
  const sections = [
    { id: 'section-p1', courseId: 'course-apah', calendarId, name: 'P1 • 8:05–9:00' },
    { id: 'section-p2', courseId: 'course-2d', calendarId, name: 'P4 • 9:05–10:00' },
    { id: 'section-p5', courseId: 'course-3d', calendarId, name: 'P5 • 10:05–11:00' },
  ]

  const unitTitle = 'UNIT 2.1 Ancient Mesopotamia'
  const units = courses.map((course) => ({
    id: `unit-${course.id.slice(7)}-meso`,
    calendarId,
    courseId: course.id,
    title: unitTitle,
    placement: { startDate: '2026-09-07' as ISODate, endDate: '2026-09-11' as ISODate },
  }))

  const weekDates: ISODate[] = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11']
  const lessonTitles: Record<string, string[]> = {
    'course-apah': ['White Temple', 'Cylinder seals', 'Standard of Ur', 'Review + compare', 'Quiz'],
    'course-2d': ['Finish boxes', 'Collage critique', 'Contour line', 'Blind contour', 'Studio day'],
    'course-3d': ['Armature build', 'Recycled fashion', 'Surface design', 'Build day', 'Build day'],
  }

  const lessons = courses.flatMap((course) => {
    const unitId = units.find((unit) => unit.courseId === course.id)?.id ?? units[0].id
    return weekDates.map((plannedDate, index) => ({
      id: `lesson-${course.id.slice(7)}-w${index + 1}`,
      calendarId,
      courseId: course.id,
      unitId,
      title: lessonTitles[course.id][index],
      sequence: index + 1,
      plannedDate,
      datePolicy: 'flexible' as const,
      directions: [],
      materials: [],
      phases: [],
      resources: [],
    }))
  })

  return {
    calendarInput: {
      id: calendarId,
      schoolYearLabel: '2026–27',
      firstDay: '2026-08-17',
      lastDay: '2027-05-28',
      instructionalWeekdays: [1, 2, 3, 4, 5],
      patternSource: 'manual',
      patternConfidence: 'confirmed',
      exceptions: [],
      quarters: [{ id: 'q1', label: 'Q1', startDate: '2026-08-17', endDate: '2026-10-16' }],
      semesters: [],
      provenance: [],
    },
    planningInput: { calendarId, courses, sections, notes: [] },
    unitsInput: { calendarId, units },
    lessonsInput: { calendarId, lessons, deliveryStates: [] },
    shiftInput: { calendarId, overrides: [], undo: null },
    captures: { calendarId, captures: [] },
    planContext: {
      schemaVersion: PLAN_NAVIGATION_SCHEMA_VERSION,
      calendarId,
      view: 'Week',
      anchorDate: '2026-09-10',
      focus: 'day',
    },
    viewPreferences: {
      home: { mode: 'fixed', view: 'Week' },
      lastUsedView: 'Week',
      showWeekends: false,
    },
  }
}
