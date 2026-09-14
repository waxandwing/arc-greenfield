import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { updateLessonDeliveryState, createLessonDeliveryState } from './deliveryState'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLesson } from './lessons'
import { hydrateLessonWorkspace } from './lessonWorkspace'
import { projectPlanningPeriodAttention } from './planningPeriodAttention'
import { hydrateUnitWorkspace } from './unitWorkspace'
import { hydratePlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-now-law',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

const apah = createCourse({ id: 'course-apah', title: 'AP Art History' })
const twoD = createCourse({ id: 'course-2d', title: '2D Art 1' })
const threeD = createCourse({ id: 'course-3d', title: '3D Art 1' })
const p1 = createSection({ id: 'section-p1', courseId: apah.id, calendarId: calendar.id, name: 'Period 1' })
const p2 = createSection({ id: 'section-p2', courseId: twoD.id, calendarId: calendar.id, name: 'Period 2' })
const p3 = createSection({ id: 'section-p3', courseId: threeD.id, calendarId: calendar.id, name: 'Period 3' })
const p4 = createSection({ id: 'section-p4', courseId: apah.id, calendarId: calendar.id, name: 'Period 4' })
const p6 = createSection({ id: 'section-p6', courseId: twoD.id, calendarId: calendar.id, name: 'Period 6' })
const p7 = createSection({ id: 'section-p7', courseId: threeD.id, calendarId: calendar.id, name: 'Period 7' })

const planning = hydratePlanningWorkspace({
  calendarId: calendar.id,
  courses: [apah, twoD, threeD],
  sections: [p1, p2, p3, p4, p6, p7],
})

const units = hydrateUnitWorkspace({
  calendarId: calendar.id,
  units: [
    { id: 'unit-apah', calendarId: calendar.id, courseId: apah.id, title: 'Power & Place', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } },
    { id: 'unit-2d', calendarId: calendar.id, courseId: twoD.id, title: 'Value & Form', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } },
    { id: 'unit-3d', calendarId: calendar.id, courseId: threeD.id, title: 'Mass & Balance', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } },
  ],
}, calendar, planning)

const lessonP1 = createLesson({ id: 'lesson-p1-done', calendarId: calendar.id, courseId: apah.id, unitId: 'unit-apah', title: 'Morning AP done', sequence: 1, plannedDate: '2026-09-15' })
const lessonP4Stopped = createLesson({ id: 'lesson-p4-stop', calendarId: calendar.id, courseId: apah.id, unitId: 'unit-apah', title: 'Threshold stopped', sequence: 2, plannedDate: '2026-09-15' })
const lessonShared = createLesson({ id: 'lesson-2d-shared', calendarId: calendar.id, courseId: twoD.id, unitId: 'unit-2d', title: 'Value scale', sequence: 3, plannedDate: '2026-09-15' })
const lessonP6Only = createLesson({ id: 'lesson-2d-p6', calendarId: calendar.id, courseId: twoD.id, unitId: 'unit-2d', title: 'Edge hierarchy', sequence: 4, plannedDate: '2026-09-15' })
const lessonP7 = createLesson({ id: 'lesson-3d-p7', calendarId: calendar.id, courseId: threeD.id, unitId: 'unit-3d', title: 'Armature lab', sequence: 5, plannedDate: '2026-09-15' })
const lessonNext = createLesson({ id: 'lesson-next', calendarId: calendar.id, courseId: threeD.id, unitId: 'unit-3d', title: 'Future 3D', sequence: 6, plannedDate: '2026-09-18' })

const deliveryStates = [
  updateLessonDeliveryState(createLessonDeliveryState({ lesson: lessonP1, section: p1 }), lessonP1, p1, { status: 'completed', taughtDate: '2026-09-15' }),
  updateLessonDeliveryState(createLessonDeliveryState({ lesson: lessonP4Stopped, section: p4 }), lessonP4Stopped, p4, { status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Resume threshold work.' }),
]

const lessons = hydrateLessonWorkspace({
  calendarId: calendar.id,
  lessons: [lessonP1, lessonP4Stopped, lessonShared, lessonP6Only, lessonP7, lessonNext],
  deliveryStates,
}, calendar, planning, units)

const overrides = [
  { sectionId: p6.id, lessonId: lessonP6Only.id, plannedDate: '2026-09-15' as const },
]

const date = '2026-09-15' as const
const continuity = projectDayContinuity({ date, planning, units, lessons, overrides })
const attention = projectPlanningPeriodAttention({ date, planning, units, lessons, captures: null, overrides, continuity })

assert(!attention.buckets.now.some((item) => item.lessonTitle === 'Morning AP done'), 'TEST F: completed earlier class must not appear in Now.')
assert(attention.buckets['needs-attention'].some((item) => item.kind === 'stopped-lesson' && item.lessonTitle === 'Threshold stopped'), 'TEST D: stopped Lesson belongs in Needs Attention.')
assert(!attention.buckets.now.some((item) => item.lessonTitle === 'Threshold stopped'), 'TEST D: stopped Lesson must not appear in Now.')

const sharedNow = attention.buckets.now.filter((item) => item.lessonTitle === 'Value scale')
assert(sharedNow.length === 1, 'TEST B: shared canonical Lesson prep must dedupe to one Now item.')

const divergedNow = attention.buckets.now.filter((item) => item.courseId === twoD.id)
assert(divergedNow.some((item) => item.lessonTitle === 'Value scale') && divergedNow.some((item) => item.lessonTitle === 'Edge hierarchy'), 'TEST C: diverged Section lessons remain separate Now items.')

const nowIds = attention.buckets.now.map((item) => item.lessonId)
const nextIds = attention.buckets['next-planned'].map((item) => item.lessonId)
assert(!nowIds.some((id) => nextIds.includes(id)), 'Now and Next Planned must not duplicate the same Lesson.')

const periodOrder = attention.buckets.now.map((item) => Number(item.sectionName?.match(/\d+/)?.[0] ?? 999))
for (let index = 1; index < periodOrder.length; index += 1) {
  assert(periodOrder[index] >= periodOrder[index - 1], 'TEST G: Now must sort by next teaching period order.')
}

assert(attention.buckets.now.some((item) => item.sectionName === 'Period 6' || item.sectionName === 'Period 7'), 'TEST A: Now must prioritize upcoming periods after Planning time.')

assert(attention.buckets['needs-attention'].some((item) => item.kind === 'section-behind'), 'TEST E: canonical Section-behind belongs in Needs Attention.')
assert(!attention.buckets.now.some((item) => item.kind === 'section-behind'), 'TEST E: Section-behind must not appear in Now.')

console.log('Planning period Now law contract passed')
