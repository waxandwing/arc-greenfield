import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLesson } from './lessons'
import { createLessonDeliveryState, effectiveLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createUnit, placeUnit } from './units'
import { hydratePlanningWorkspace } from './workspace'
import { hydrateUnitWorkspace } from './unitWorkspace'
import { deserializeLessons, serializeLessons } from './lessonPersistence'
import { hydrateLessonWorkspace, sectionIdsProtectedByDelivery, unitIdsProtectedByLessons, validateLessonWorkspace } from './lessonWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-2026-27',
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
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const p7 = createSection({ id: 'section-p7', courseId: course.id, calendarId: calendar.id, name: 'Period 7' })
const planning = hydratePlanningWorkspace({ calendarId: calendar.id, courses: [course], sections: [p2, p5, p7] })

const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = hydrateUnitWorkspace({ calendarId: calendar.id, units: [unit] }, calendar, planning)

const lesson = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const p2Done = updateLessonDeliveryState(createLessonDeliveryState({ lesson, section: p2 }), lesson, p2, { status: 'completed', taughtDate: '2026-09-16' })
const p5Stopped = updateLessonDeliveryState(createLessonDeliveryState({ lesson, section: p5 }), lesson, p5, { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after the demo. Start with guided comparison.' })

const workspace = hydrateLessonWorkspace({ calendarId: calendar.id, lessons: [lesson], deliveryStates: [p2Done, p5Stopped] }, calendar, planning, units)
assert(validateLessonWorkspace(workspace, calendar, planning, units).length === 0, 'Canonical continuity workspace must validate.')
assert(effectiveLessonDeliveryState(workspace.deliveryStates, lesson, p7).status === 'not-started', 'Missing delivery state must derive as not-started.')
assert(unitIdsProtectedByLessons(workspace).has(unit.id), 'A Unit containing Lessons must be protected from destructive removal.')
assert(sectionIdsProtectedByDelivery(workspace).has(p5.id), 'A Section with teaching history must be protected from destructive removal.')

const raw = serializeLessons(workspace)
const restoredInput = deserializeLessons(raw)
assert(restoredInput?.lessons[0]?.id === lesson.id, 'Lesson identity must survive persistence.')
assert(restoredInput?.deliveryStates.find((state) => state.sectionId === p5.id)?.resumeNote === p5Stopped.resumeNote, 'Interrupted resume note must survive persistence.')
const restored = hydrateLessonWorkspace(restoredInput!, calendar, planning, units)
assert(restored.deliveryStates.length === 2, 'Sparse delivery state must remain sparse after restore.')

const duplicateDelivery = { ...workspace, deliveryStates: [p5Stopped, { ...p5Stopped }] }
assert(validateLessonWorkspace(duplicateDelivery, calendar, planning, units).some((error) => error.includes('Duplicate delivery state')), 'Duplicate Section/Lesson delivery records must be rejected.')

const orphanLesson = { ...workspace, lessons: [{ ...lesson, unitId: 'unit-missing' }] }
assert(validateLessonWorkspace(orphanLesson, calendar, planning, units).some((error) => error.includes('Unit that does not exist')), 'Lessons cannot survive without their Unit.')

const invalidTeachingDate = { ...workspace, deliveryStates: [{ ...p2Done, taughtDate: '2026-09-19' as const }] }
assert(validateLessonWorkspace(invalidTeachingDate, calendar, planning, units).some((error) => error.includes('not a confirmed instructional day')), 'Actual Lesson progress cannot be recorded on a non-instructional day.')

assert(deserializeLessons('{bad json') === null, 'Malformed Lesson persistence must be rejected.')
assert(deserializeLessons(JSON.stringify({ schemaVersion: 2, input: workspace })) === null, 'Unknown Lesson persistence versions must be rejected.')

console.log('lesson workspace contract passed')
