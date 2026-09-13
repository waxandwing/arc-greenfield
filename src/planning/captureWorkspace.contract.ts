import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createPlanningCapture, promoteCaptureToLesson, validateCaptureWorkspace } from './captureWorkspace'
import { deserializeCaptures, serializeCaptures } from './capturePersistence'
import type { LessonWorkspace } from './lessonWorkspace'
import { createUnit, placeUnit } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({ id: 'capture-calendar', schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] })
const unit = placeUnit(createUnit({ id: 'unit-2d', calendarId: calendar.id, courseId: 'course-2d', title: 'Line' }), calendar, { startDate: '2026-09-01', endDate: '2026-09-30' })
const capture = createPlanningCapture(calendar.id, '  Blind contour warm-up  ', new Date('2026-09-03T14:00:00.000Z'))
assert(capture.text === 'Blind contour warm-up', 'Capture must normalize text without requiring Course or date.')

const captures = { calendarId: calendar.id, captures: [capture] }
assert(validateCaptureWorkspace(captures).length === 0, 'Valid Capture workspace must pass.')
const restored = deserializeCaptures(serializeCaptures(captures))
assert(restored?.captures[0].id === capture.id, 'Capture identity must survive persistence round trip.')
assert(deserializeCaptures('{"schemaVersion":1,"workspace":{"calendarId":"x","captures":[{"id":"same","calendarId":"x","text":"a","createdAt":"bad"}]}}') === null, 'Malformed Capture persistence must fail closed.')
assert(validateCaptureWorkspace({ ...captures, captures: [capture, capture] }).some((error) => error.includes('Duplicate Capture ID')), 'Duplicate Capture IDs must be rejected.')

const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [], deliveryStates: [] }
const promoted = promoteCaptureToLesson({ capture, captures, lessons, units: { calendarId: calendar.id, units: [unit] }, unitId: unit.id, plannedDate: '2026-09-08' })
assert(promoted.captures.captures.length === 0, 'Promotion must remove the Capture from loose Workspace truth.')
assert(promoted.lessons.lessons.length === 1, 'Promotion must create exactly one Lesson.')
assert(promoted.lessons.lessons[0].id === capture.id, 'Capture → Lesson must preserve object identity.')
assert(promoted.lessons.lessons[0].title === capture.text, 'Capture → Lesson must preserve content.')

console.log('Capture → organize → place continuity contract passed')
