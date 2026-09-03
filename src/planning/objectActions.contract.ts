import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLesson, createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson as makeLesson } from './lessons'
import { deleteLesson, deleteUnit, moveLesson, moveUnit, unplaceLessonFromCalendar, unplaceUnitFromCalendar } from './objectActions'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function expectThrow(run: () => unknown, fragment: string) {
  let message = ''
  try { run() } catch (error) { message = error instanceof Error ? error.message : String(error) }
  assert(message.includes(fragment), `Expected failure containing “${fragment}”, got “${message || 'no error'}”.`)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-actions',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})
const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const p2 = createSection({ id: 'section-p2', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const emptyUnit = placeUnit(createUnit({ id: 'unit-empty', calendarId: calendar.id, courseId: course.id, title: 'Empty Unit' }), calendar, { startDate: '2026-10-05', endDate: '2026-10-09' })
const lesson = makeLesson({ id: 'lesson-1', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Temple lesson', sequence: 1, plannedDate: '2026-09-16', datePolicy: 'flexible' })
const fixed = makeLesson({ id: 'lesson-fixed', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Fixed assessment', sequence: 2, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit, emptyUnit] }
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson, fixed], deliveryStates: [] }
const overrides: SectionLessonDateOverride[] = []

const movedLessonWorkspace = moveLesson({ calendar, units, lessons, overrides, lessonId: lesson.id, plannedDate: '2026-09-17' })
assert(movedLessonWorkspace.lessons.find((item) => item.id === lesson.id)?.plannedDate === '2026-09-17', 'Move Lesson must change only planned placement.')
assert(movedLessonWorkspace.lessons.find((item) => item.id === lesson.id)?.id === lesson.id, 'Move Lesson must preserve identity.')
assert(lessons.lessons.find((item) => item.id === lesson.id)?.plannedDate === '2026-09-16', 'Move Lesson must not mutate its input workspace.')
expectThrow(() => moveLesson({ calendar, units, lessons, overrides, lessonId: lesson.id, plannedDate: '2026-09-27' }), 'Cannot move Lesson')
expectThrow(() => moveLesson({ calendar, units, lessons, overrides, lessonId: lesson.id, plannedDate: '2026-09-19' }), 'confirmed instructional day')

const unplacedFixed = unplaceLessonFromCalendar({ calendar, units, lessons, overrides, lessonId: fixed.id })
const unplacedFixedLesson = unplacedFixed.lessons.lessons.find((item) => item.id === fixed.id)
assert(unplacedFixedLesson?.plannedDate === null, 'Unplace Lesson must clear its shared calendar date.')
assert(unplacedFixedLesson?.datePolicy === 'flexible', 'Unplacing a fixed Lesson must remove contradictory fixed-with-no-date state.')
assert(unplacedFixed.lessons.deliveryStates.length === 0, 'Unplace Lesson must preserve teaching-history collection untouched.')

const sectionOverride: SectionLessonDateOverride = { sectionId: p2.id, lessonId: lesson.id, plannedDate: '2026-09-17' }
const unplacedWithOverride = unplaceLessonFromCalendar({ calendar, units, lessons, overrides: [sectionOverride], lessonId: lesson.id })
assert(unplacedWithOverride.overrides.length === 0, 'Unplace Lesson must clear its Section-specific placements so it is truly off-calendar.')
assert(unplacedWithOverride.lessons.lessons.find((item) => item.id === lesson.id)?.id === lesson.id, 'Unplace Lesson must preserve Lesson identity.')

expectThrow(() => deleteLesson({ calendar, units, lessons, overrides: [sectionOverride], lessonId: lesson.id }), 'Section-specific schedule placements')
let taught = createLessonDeliveryState({ lesson, section: p2 })
taught = updateLessonDeliveryState(taught, lesson, p2, { status: 'completed', taughtDate: '2026-09-16', resumeNote: null })
const withHistory: LessonWorkspace = { ...lessons, deliveryStates: [taught] }
expectThrow(() => deleteLesson({ calendar, units, lessons: withHistory, overrides, lessonId: lesson.id }), 'teaching history')
const deletedLessonWorkspace = deleteLesson({ calendar, units, lessons, overrides, lessonId: fixed.id })
assert(!deletedLessonWorkspace.lessons.some((item) => item.id === fixed.id), 'Delete Lesson must remove the requested Lesson when no history/override blocks it.')
assert(deletedLessonWorkspace.lessons.some((item) => item.id === lesson.id), 'Delete Lesson must not remove neighboring Lessons.')

const movedUnitWorkspace = moveUnit({ calendar, units, lessons, overrides, unitId: unit.id, placement: { startDate: '2026-09-14', endDate: '2026-09-30' } })
assert(movedUnitWorkspace.units.find((item) => item.id === unit.id)?.placement?.endDate === '2026-09-30', 'Move Unit must update its span.')
assert(movedUnitWorkspace.units.find((item) => item.id === unit.id)?.id === unit.id, 'Move Unit must preserve Unit identity.')
expectThrow(() => moveUnit({ calendar, units, lessons, overrides, unitId: unit.id, placement: { startDate: '2026-09-21', endDate: '2026-09-25' } }), 'would become invalid')
expectThrow(() => moveUnit({ calendar, units, lessons, overrides: [{ sectionId: p2.id, lessonId: lesson.id, plannedDate: '2026-09-25' }], unitId: unit.id, placement: { startDate: '2026-09-14', endDate: '2026-09-19' } }), 'Section-specific Lesson placement')

expectThrow(() => unplaceUnitFromCalendar({ calendar, units, lessons, overrides, unitId: unit.id }), 'scheduled Lessons')
const unscheduledLessons: LessonWorkspace = { ...lessons, lessons: lessons.lessons.map((item) => ({ ...item, plannedDate: null, datePolicy: 'flexible' as const })) }
expectThrow(() => unplaceUnitFromCalendar({ calendar, units, lessons: unscheduledLessons, overrides: [sectionOverride], unitId: unit.id }), 'Section-specific Lesson placements')
const unplacedUnitWorkspace = unplaceUnitFromCalendar({ calendar, units, lessons: unscheduledLessons, overrides, unitId: unit.id })
assert(unplacedUnitWorkspace.units.find((item) => item.id === unit.id)?.placement === null, 'Unplace Unit must clear Unit placement once downstream dates are safe.')
assert(unplacedUnitWorkspace.units.find((item) => item.id === unit.id)?.id === unit.id, 'Unplace Unit must preserve Unit identity.')

expectThrow(() => deleteUnit({ calendar, units, lessons, overrides, unitId: unit.id }), 'Move or delete its Lessons first')
const deletedUnitWorkspace = deleteUnit({ calendar, units, lessons, overrides, unitId: emptyUnit.id })
assert(!deletedUnitWorkspace.units.some((item) => item.id === emptyUnit.id), 'Delete Unit must remove an empty Unit.')
assert(deletedUnitWorkspace.units.some((item) => item.id === unit.id), 'Delete Unit must not remove neighboring Units.')

expectThrow(() => deleteLesson({ calendar, units, lessons, overrides, lessonId: 'missing-lesson' }), 'does not exist')
expectThrow(() => deleteUnit({ calendar, units, lessons, overrides, unitId: 'missing-unit' }), 'does not exist')

console.log('Object action hostile contract passed')
