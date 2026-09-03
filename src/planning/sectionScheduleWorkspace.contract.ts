import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { validateSectionScheduleWorkspace, type SectionScheduleWorkspace } from './sectionScheduleWorkspace'
import { createUnit, placeUnit } from './units'

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
const planning = { calendarId: calendar.id, courses: [course], sections: [p2, p5] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = { calendarId: calendar.id, units: [unit] }
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const lessons = { calendarId: calendar.id, lessons: [lesson17, lesson18, test], deliveryStates: [] }

const valid: SectionScheduleWorkspace = {
  calendarId: calendar.id,
  overrides: [
    { sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-17' },
    { sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
  ],
}
assert(validateSectionScheduleWorkspace(valid, calendar, planning, units, lessons).length === 0, 'Canonical P5 Shift overrides should form a valid Section schedule workspace.')

const duplicate: SectionScheduleWorkspace = { calendarId: calendar.id, overrides: [valid.overrides[0]!, { ...valid.overrides[0]! }] }
assert(validateSectionScheduleWorkspace(duplicate, calendar, planning, units, lessons).some((error) => error.includes('Duplicate Section schedule override')), 'Duplicate Section/Lesson overrides must be rejected.')

const orphanSection: SectionScheduleWorkspace = { calendarId: calendar.id, overrides: [{ sectionId: 'missing-section', lessonId: lesson17.id, plannedDate: '2026-09-17' }] }
assert(validateSectionScheduleWorkspace(orphanSection, calendar, planning, units, lessons).some((error) => error.includes('Section that does not exist')), 'Orphaned Section overrides must be rejected.')

const fixedMove: SectionScheduleWorkspace = { calendarId: calendar.id, overrides: [{ sectionId: p5.id, lessonId: test.id, plannedDate: '2026-09-21' }] }
assert(validateSectionScheduleWorkspace(fixedMove, calendar, planning, units, lessons).some((error) => error.includes('Fixed Lesson dates cannot be overridden')), 'Saved Section schedules must reject moved fixed Lessons.')

const collision: SectionScheduleWorkspace = { calendarId: calendar.id, overrides: [{ sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-17' }] }
assert(validateSectionScheduleWorkspace(collision, calendar, planning, units, lessons).some((error) => error.includes('multiple live Lessons')), 'Saved Section schedules must reject unresolved same-day collisions among live work.')

const completed18 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: lesson18, section: p5 }), lesson18, p5, { status: 'completed', taughtDate: '2026-09-16' })
const completedCollisionLessons = { ...lessons, deliveryStates: [completed18] }
assert(validateSectionScheduleWorkspace(collision, calendar, planning, units, completedCollisionLessons).length === 0, 'Finished work must not create false future collision pressure in a Section schedule.')

const p2Independent: SectionScheduleWorkspace = {
  calendarId: calendar.id,
  overrides: [...valid.overrides, { sectionId: p2.id, lessonId: lesson17.id, plannedDate: '2026-09-15' }],
}
assert(validateSectionScheduleWorkspace(p2Independent, calendar, planning, units, lessons).length === 0, 'A valid change in another Section must coexist with P5 recovery overrides.')

const calendarAfterClosure = hydrateSchoolCalendar({
  id: calendar.id,
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-21', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' }],
  quarters: [],
  semesters: [],
})
assert(validateSectionScheduleWorkspace(valid, calendarAfterClosure, planning, units, lessons).some((error) => error.includes('confirmed instructional day')), 'A later calendar closure must invalidate a Section override that depended on that day.')

const shortenedUnit = { ...unit, placement: { startDate: '2026-09-14' as const, endDate: '2026-09-18' as const } }
assert(validateSectionScheduleWorkspace(valid, calendar, planning, { calendarId: calendar.id, units: [shortenedUnit] }, lessons).some((error) => error.includes('inside its Unit placement')), 'A later Unit shrink must invalidate overrides now outside the Unit.')

const wrongPlanning = { ...planning, calendarId: 'other-calendar' }
assert(validateSectionScheduleWorkspace(valid, calendar, wrongPlanning, units, lessons).some((error) => error.includes('Class workspace belongs')), 'Section schedule validation must reject a mismatched Class workspace even before persistence exists.')

console.log('section schedule workspace contract passed')
