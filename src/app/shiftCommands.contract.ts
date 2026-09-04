import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from '../planning/courses'
import { createLesson } from '../planning/lessons'
import { createShiftOperation } from '../planning/shiftOperation'
import { createUnit, placeUnit } from '../planning/units'
import { prepareRecoveryShift, prepareUndoShift } from './shiftCommands'

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
const section = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const planning = { calendarId: calendar.id, courses: [course], sections: [section] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = { calendarId: calendar.id, units: [unit] }
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const lessons = { calendarId: calendar.id, lessons: [lesson17, lesson18], deliveryStates: [] }
const shift = { calendarId: calendar.id, overrides: [], undo: null }

const operation = createShiftOperation({
  id: 'shift-p5',
  sectionId: section.id,
  changes: [
    { lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-17' },
    { lessonId: lesson18.id, fromDate: '2026-09-17', toDate: '2026-09-18' },
  ],
})

const applied = prepareRecoveryShift({ calendar, planning, units, lessons, shift }, operation)
assert(applied.ok, 'Application command must prepare a valid Recovery Shift.')
assert(applied.value.sectionName === 'Period 5', 'Prepared Shift must retain Section presentation identity.')
assert(applied.value.shift.overrides.length === 2, 'Prepared Shift must contain exactly the validated explicit overrides.')
assert(shift.overrides.length === 0, 'Preparing a Shift must not mutate caller state.')

const undone = prepareUndoShift({ calendar, planning, units, lessons, shift: applied.value.shift })
assert(undone.ok, 'Application command must prepare a valid Shift Undo.')
assert(undone.value.shift.overrides.length === 0, 'Prepared Undo must restore the previous Section schedule.')
assert(undone.value.shift.undo === null, 'Prepared Undo must consume the Undo capability.')

const missingSection = createShiftOperation({
  id: 'missing-section',
  sectionId: 'section-missing',
  changes: [{ lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-17' }],
})
const rejectedMissing = prepareRecoveryShift({ calendar, planning, units, lessons, shift }, missingSection)
assert(!rejectedMissing.ok && rejectedMissing.message.includes('class no longer exists'), 'Application command must fail closed when its Section disappeared.')

const noUndo = prepareUndoShift({ calendar, planning, units, lessons, shift })
assert(!noUndo.ok && noUndo.message.includes('no Shift available'), 'Undo command must fail explicitly when there is no Undo capability.')

console.log('application Shift command contract passed')
