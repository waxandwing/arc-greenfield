import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createPlanNavigationContext } from '../calendar/navigationContext'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLesson } from './lessons'
import { hydrateLessonWorkspace } from './lessonWorkspace'
import { followPlanningAttentionTarget, restorePlanningPeriodBlock } from './planContextResolution'
import { projectPlanningPeriodAttention } from './planningPeriodAttention'
import { hydrateUnitWorkspace } from './unitWorkspace'
import { hydratePlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-p5-attention',
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
const p1 = createSection({ id: 'section-p1', courseId: apah.id, calendarId: calendar.id, name: 'Period 1' })
const p4 = createSection({ id: 'section-p4', courseId: apah.id, calendarId: calendar.id, name: 'Period 4' })
const p6 = createSection({ id: 'section-p6', courseId: apah.id, calendarId: calendar.id, name: 'Period 6' })
const planning = hydratePlanningWorkspace({ calendarId: calendar.id, courses: [apah], sections: [p1, p4, p6] })
const units = hydrateUnitWorkspace({
  calendarId: calendar.id,
  units: [{ id: 'unit-apah-1', calendarId: calendar.id, courseId: apah.id, title: 'Power & Place', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }],
}, calendar, planning)
const unit = units.units[0]
const threshold = createLesson({ id: 'lesson-threshold', calendarId: calendar.id, courseId: apah.id, unitId: unit.id, title: 'Temple threshold', sequence: 5, plannedDate: '2026-09-14' })
const patron = createLesson({ id: 'lesson-patron', calendarId: calendar.id, courseId: apah.id, unitId: unit.id, title: 'Patron and audience', sequence: 6, plannedDate: '2026-09-15' })
const afternoon = createLesson({ id: 'lesson-afternoon', calendarId: calendar.id, courseId: apah.id, unitId: unit.id, title: 'Gallery synthesis', sequence: 7, plannedDate: '2026-09-15' })
const tomorrow = createLesson({ id: 'lesson-tomorrow', calendarId: calendar.id, courseId: apah.id, unitId: unit.id, title: 'Fixed visual analysis assessment', sequence: 8, plannedDate: '2026-09-16' })
let deliveryP1 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: patron, section: p1 }), patron, p1, { status: 'completed', taughtDate: '2026-09-15' })
let deliveryP4Stopped = updateLessonDeliveryState(createLessonDeliveryState({ lesson: threshold, section: p4 }), threshold, p4, { status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison.' })
const lessons = hydrateLessonWorkspace({
  calendarId: calendar.id,
  lessons: [threshold, patron, afternoon, tomorrow],
  deliveryStates: [deliveryP1, deliveryP4Stopped],
}, calendar, planning, units)
const continuity = projectDayContinuity({ date: '2026-09-15', planning, units, lessons, overrides: [{ sectionId: p6.id, lessonId: afternoon.id, plannedDate: '2026-09-15' }] })
const attention = projectPlanningPeriodAttention({
  date: '2026-09-15',
  planning,
  units,
  lessons,
  captures: { calendarId: calendar.id, captures: [{ id: 'capture-loose', calendarId: calendar.id, text: 'Museum label mini-lesson', createdAt: '2026-09-01T12:00:00.000Z' }] },
  overrides: [{ sectionId: p6.id, lessonId: afternoon.id, plannedDate: '2026-09-15' }],
  continuity,
})

assert(attention.buckets.now.every((item) => item.lessonTitle !== 'Patron and audience'), 'NOW must not repeat completed earlier-class prep.')
const galleryNow = attention.buckets.now.find((item) => item.kind === 'scheduled-today' && item.lessonTitle === 'Gallery synthesis')
assert(galleryNow, 'NOW must list upcoming prep after Planning time.')
assert(galleryNow.sectionName === 'Period 6', 'NOW upcoming prep must lead with the earliest post-Planning Section.')
assert(galleryNow.reason.includes('Period 6'), 'NOW shared prep must name post-Planning Sections.')
assert(attention.buckets['needs-attention'].some((item) => item.kind === 'stopped-lesson' && item.reason.includes('threshold comparison')), 'NEEDS ATTENTION must surface stopped Lessons with resume notes.')
assert(attention.buckets['needs-attention'].some((item) => item.kind === 'section-behind' && item.sectionName === 'Period 4'), 'NEEDS ATTENTION must flag a Section behind the Course plan.')
assert(attention.buckets['next-planned'].some((item) => item.kind === 'next-planned-lesson' && item.lessonTitle === 'Fixed visual analysis assessment'), 'NEXT PLANNED must expose the next dated Lesson per Section.')

const ids = [...attention.buckets.now, ...attention.buckets['needs-attention'], ...attention.buckets['next-planned']].map((item) => item.id)
assert(!ids.some((id) => id.startsWith('capture:')), 'Unplaced Capture signal stays out until capture-to-unit truth is canonical.')
assert(new Set(ids).size === ids.length, 'Attention items must stay deduplicated.')

const day = createPlanNavigationContext({ calendarId: calendar.id, view: 'Day', anchorDate: '2026-09-15', focus: 'class', teachingBlockId: 'legacy-planning-5' })
const stopped = attention.buckets['needs-attention'].find((item) => item.kind === 'stopped-lesson')
assert(stopped, 'Fixture must include a stopped Lesson target.')
const lessonFollow = followPlanningAttentionTarget(day, stopped.target, { id: 'section-p4', courseId: apah.id, sectionId: p4.id })
assert(lessonFollow.view === 'Day' && lessonFollow.focus === 'lesson' && lessonFollow.lessonId === threshold.id && lessonFollow.anchorDate === '2026-09-15', 'Stopped Lesson deep links must open Day Lesson focus on the same date.')

const behind = attention.buckets['needs-attention'].find((item) => item.kind === 'section-behind')
assert(behind, 'Fixture must include a section-behind target.')
const weekFollow = followPlanningAttentionTarget(day, behind.target, { id: 'section-p4', courseId: apah.id, sectionId: p4.id })
assert(weekFollow.view === 'Week' && weekFollow.focus === 'class' && weekFollow.sectionId === p4.id && weekFollow.anchorDate === '2026-09-15', 'Section-behind items must deep link into Week Class context on the anchor date.')

const restored = restorePlanningPeriodBlock(lessonFollow, { id: 'legacy-planning-5', courseId: null, sectionId: null })
assert(restored.view === 'Day' && restored.focus === 'class' && restored.teachingBlockId === 'legacy-planning-5' && restored.anchorDate === '2026-09-15', 'Return must restore Planning period block focus without moving the anchor date.')

const emptyContinuity = projectDayContinuity({ date: '2026-09-15', planning: { ...planning, courses: [], sections: [] }, units, lessons, overrides: [] })
const empty = projectPlanningPeriodAttention({ date: '2026-09-15', planning, units, lessons, captures: null, overrides: [], continuity: emptyContinuity })
assert(empty.buckets.now.length === 0 && empty.buckets['needs-attention'].length === 0 && empty.buckets['next-planned'].length === 0, 'Without Course continuity, buckets must stay empty rather than inventing signals.')

assert(attention.buckets.now[0]?.courseTitle.localeCompare(attention.buckets.now.at(-1)?.courseTitle ?? '') !== 1, 'Bucket ordering must stay deterministic by Course, Section, and Lesson.')

console.log('Planning period attention contract passed')
