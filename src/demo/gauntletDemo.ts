import type { ISODate } from '../calendar/types'
import type { CalendarHydrationInput } from '../calendar/hydration'
import type { PlanNavigationContext } from '../calendar/navigationContext'
import { PLAN_NAVIGATION_SCHEMA_VERSION } from '../calendar/navigationContext'
import type { LessonWorkspaceInput } from '../planning/lessonWorkspace'
import type { UnitWorkspaceInput } from '../planning/unitWorkspace'
import type { ShiftPersistenceInput } from '../planning/shiftPersistence'
import type { CaptureWorkspace } from '../planning/captureWorkspace'
import type { PlanningWorkspaceInput } from '../planning/workspace'
import type { ViewPreferences } from '../navigation/viewPreferences'

export const GAUNTLET_DEMO_CALENDAR_ID = 'arc-plan-gauntlet-2026'
export const GAUNTLET_DEMO_ANCHOR_DATE = '2026-09-15'

export type GauntletDemoBundle = {
  calendarInput: CalendarHydrationInput
  planningInput: PlanningWorkspaceInput
  unitsInput: UnitWorkspaceInput
  lessonsInput: LessonWorkspaceInput
  shiftInput: ShiftPersistenceInput
  captures: CaptureWorkspace
  planContext: PlanNavigationContext
  viewPreferences: ViewPreferences
}

/** Prefilled teaching week used by plan smokes — AP / 2D / 3D, Period 5 planning gap, real lesson grid. */
export function buildGauntletDemoBundle(): GauntletDemoBundle {
  const calendarId = GAUNTLET_DEMO_CALENDAR_ID
  const courses = [
    { id: 'course-apah', title: 'AP Art History' },
    { id: 'course-2d', title: '2D Art 1' },
    { id: 'course-3d', title: '3D Art 1' },
  ]
  const sections = [
    ['section-p1', 'course-apah', 'Period 1'],
    ['section-p2', 'course-2d', 'Period 2'],
    ['section-p3', 'course-3d', 'Period 3'],
    ['section-p4', 'course-apah', 'Period 4'],
    ['section-p6', 'course-2d', 'Period 6'],
    ['section-p7', 'course-3d', 'Period 7'],
  ].map(([id, courseId, name]) => ({ id, courseId, calendarId, name: name as string }))

  const unitSpecs: Record<string, string[]> = {
    'course-apah': ['Looking & Meaning', 'Power & Place', 'Ritual & Memory'],
    'course-2d': ['Line as Language', 'Value & Form', 'Color Systems'],
    'course-3d': ['Mass & Balance', 'Joinery & Structure', 'Site & Scale'],
  }
  const spans: [ISODate, ISODate][] = [
    ['2026-09-01', '2026-09-11'],
    ['2026-09-14', '2026-09-25'],
    ['2026-09-28', '2026-10-09'],
  ]
  const units = courses.flatMap((course) =>
    unitSpecs[course.id].map((title, index) => ({
      id: `unit-${course.id.slice(7)}-${index + 1}`,
      calendarId,
      courseId: course.id,
      title,
      placement: { startDate: spans[index][0], endDate: spans[index][1] },
    })),
  )

  const dates: ISODate[][] = [
    ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-08'],
    ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-18'],
    ['2026-09-28', '2026-09-29', '2026-10-01', '2026-10-06'],
  ]
  const titles: Record<string, string[]> = {
    'course-apah': ['Reading an image', 'Formal analysis relay', 'Context evidence', 'Comparative claim', 'Temple threshold', 'Power in public space', 'Patron and audience', 'Fixed visual analysis assessment', 'Ritual sequence', 'Memory and monument', 'Comparison studio', 'Unit synthesis'],
    'course-2d': ['Blind contour', 'Line quality lab', 'Gesture sequence', 'Critique language', 'Value scale', 'Multi-day still life', 'Edge hierarchy', 'Value checkpoint', 'Color mixing map', 'Limited palette study', 'Color critique', 'Portfolio reflection'],
    'course-3d': ['Balance tests', 'Mass and void', 'Armature lab', 'Material behavior', 'Joinery sampler', 'Load and span', 'Structure critique', 'Prototype checkpoint', 'Site reading', 'Scale intervention', 'Installation plan', 'Gallery walk'],
  }

  const lessons: LessonWorkspaceInput['lessons'] = []
  for (const course of courses) {
    let sequence = 0
    for (let unitIndex = 0; unitIndex < 3; unitIndex += 1) {
      for (let lessonIndex = 0; lessonIndex < 4; lessonIndex += 1) {
        sequence += 1
        lessons.push({
          id: `${course.id.replace('course-', 'lesson-')}-${sequence}`,
          calendarId,
          courseId: course.id,
          unitId: `unit-${course.id.slice(7)}-${unitIndex + 1}`,
          title: titles[course.id][sequence - 1],
          sequence,
          plannedDate: dates[unitIndex][lessonIndex],
          datePolicy: course.id === 'course-apah' && sequence === 8 ? 'fixed' : 'flexible',
          directions: [`Open with ${titles[course.id][sequence - 1].toLowerCase()}.`],
          materials: ['Sketchbook'],
          phases: ['Look', 'Make'],
          resources: [],
        })
      }
    }
  }

  const planningInput: PlanningWorkspaceInput = { calendarId, courses, sections, notes: [] }
  const lessonsInput: LessonWorkspaceInput = {
    calendarId,
    lessons,
    deliveryStates: [{
      lessonId: 'lesson-apah-5',
      sectionId: 'section-p4',
      status: 'in-progress',
      taughtDate: '2026-09-14',
      resumeNote: 'Stopped after the threshold comparison. Resume with patron evidence.',
    }],
  }
  const shiftInput: ShiftPersistenceInput = {
    calendarId,
    overrides: [
      { sectionId: 'section-p6', lessonId: 'lesson-2d-5', plannedDate: '2026-09-15' },
      { sectionId: 'section-p6', lessonId: 'lesson-2d-6', plannedDate: '2026-09-14' },
    ],
    undo: null,
  }
  const calendarInput: CalendarHydrationInput = {
    id: calendarId,
    schoolYearLabel: '2026–27',
    firstDay: '2026-09-01',
    lastDay: '2027-05-28',
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'manual',
    patternConfidence: 'confirmed',
    exceptions: [],
    quarters: [],
    semesters: [],
    provenance: [],
  }

  return {
    calendarInput,
    planningInput,
    unitsInput: { calendarId, units },
    lessonsInput,
    shiftInput,
    captures: {
      calendarId,
      captures: [{
        id: 'capture-seed-1',
        calendarId,
        text: 'Museum label mini-lesson',
        createdAt: '2026-09-01T12:00:00.000Z',
      }],
    },
    planContext: {
      schemaVersion: PLAN_NAVIGATION_SCHEMA_VERSION,
      calendarId,
      view: 'Week',
      anchorDate: GAUNTLET_DEMO_ANCHOR_DATE,
      focus: 'day',
    },
    viewPreferences: {
      home: { mode: 'fixed', view: 'Week' },
      lastUsedView: 'Week',
      showWeekends: false,
    },
  }
}
