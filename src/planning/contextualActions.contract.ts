import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse } from './courses'
import { createLessonOnWeek, createPlanningNoteOnWeek, createUnitOnWeek, movePlanningNote } from './contextualActions'
import type { LessonWorkspace } from './lessonWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function expectThrow(run: () => unknown, fragment: string) {
  let message = ''
  try { run() } catch (error) { message = error instanceof Error ? error.message : String(error) }
  assert(message.includes(fragment), `Expected failure containing “${fragment}”, got “${message || 'no error'}”.`)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-week-actions', schoolYearLabel: '2026–27', firstDay: '2026-08-10', lastDay: '2027-05-28',
  instructionalWeekdays: [1,2,3,4,5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [],
})
const course = createCourse({ id: 'course-art', title: 'Studio Art' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [], notes: [] }
const emptyUnits: UnitWorkspace = { calendarId: calendar.id, units: [] }
const emptyLessons: LessonWorkspace = { calendarId: calendar.id, lessons: [], deliveryStates: [] }

const units = createUnitOnWeek({ calendar, workspace: emptyUnits, courseId: course.id, title: 'Color', startDate: '2026-09-14', endDate: '2026-09-18' })
assert(units.units.length === 1, 'Week quick-add must create exactly one Unit.')
assert(units.units[0].id.startsWith('unit-'), 'Week quick-add Unit must receive a stable Unit identity.')
assert(units.units[0].placement?.startDate === '2026-09-14' && units.units[0].placement?.endDate === '2026-09-18', 'Week quick-add Unit must use the requested range.')
expectThrow(() => createUnitOnWeek({ calendar, workspace: { calendarId: 'other-calendar', units: [] }, courseId: course.id, title: 'Wrong owner', startDate: '2026-09-14', endDate: '2026-09-18' }), 'different school calendar')

const lessons = createLessonOnWeek({ calendar, units, workspace: emptyLessons, unitId: units.units[0].id, title: 'Mixing lab', plannedDate: '2026-09-16' })
assert(lessons.lessons.length === 1, 'Week quick-add must create exactly one Lesson.')
assert(lessons.lessons[0].id.startsWith('lesson-'), 'Week quick-add Lesson must receive a stable Lesson identity.')
assert(lessons.lessons[0].courseId === course.id && lessons.lessons[0].unitId === units.units[0].id, 'Week quick-add Lesson must inherit Course/Unit ownership.')
assert(lessons.lessons[0].plannedDate === '2026-09-16', 'Week quick-add Lesson must use the requested day.')
expectThrow(() => createLessonOnWeek({ calendar, units, workspace: lessons, unitId: units.units[0].id, title: 'Saturday', plannedDate: '2026-09-19' }), 'confirmed instructional day')
expectThrow(() => createLessonOnWeek({ calendar, units: { ...units, calendarId: 'other-calendar' }, workspace: emptyLessons, unitId: units.units[0].id, title: 'Wrong owner', plannedDate: '2026-09-16' }), 'different school calendar')
expectThrow(() => createLessonOnWeek({ calendar, units, workspace: { ...emptyLessons, calendarId: 'other-calendar' }, unitId: units.units[0].id, title: 'Wrong owner', plannedDate: '2026-09-16' }), 'different school calendar')

const withNote = createPlanningNoteOnWeek({ workspace: planning, calendarId: calendar.id, date: '2026-09-17', text: 'Make copies', placement: 'calendar', important: true })
const note = withNote.notes?.[0]
assert(note?.id.startsWith('note-'), 'Week quick-add Note must receive a stable Note identity.')
assert(note?.text === 'Make copies' && note.important, 'Week quick-add Note must preserve text and Important meaning.')
const moved = movePlanningNote(withNote, note!.id, '2026-09-18', 'after-school')
assert(moved.notes?.[0].id === note!.id, 'Move Note must preserve stable identity.')
assert(moved.notes?.[0].date === '2026-09-18' && moved.notes?.[0].placement === 'after-school', 'Move Note must change date/placement only.')
expectThrow(() => createPlanningNoteOnWeek({ workspace: planning, calendarId: 'other-calendar', date: '2026-09-17', text: 'Wrong owner' }), 'different school calendar')

console.log('Contextual Week action contract passed')
