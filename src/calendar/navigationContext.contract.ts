import { hydrateSchoolCalendar } from './hydration'
import {
  createPlanNavigationContext,
  loadPlanNavigationContext,
  loadPlanningAnchor,
  savePlanNavigationContext,
  savePlanningAnchor,
} from './navigationContext'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({ id: 'context-calendar', schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] })
const values = new Map<string, string>()
const storage = { getItem(key: string) { return values.get(key) ?? null }, setItem(key: string, value: string) { values.set(key, value) } }

assert(savePlanningAnchor(calendar.id, '2026-11-12', storage), 'Planning anchor save should succeed.')
assert(loadPlanningAnchor(calendar, storage) === '2026-11-12', 'Selected planning date must survive refresh.')
values.set('arc.planning-context.v1', JSON.stringify({ schemaVersion: 1, calendarId: calendar.id, anchorDate: '2028-01-01' }))
assert(loadPlanningAnchor(calendar, storage) === null, 'Out-of-year selected dates must fail closed.')
values.set('arc.planning-context.v1', '{broken')
assert(loadPlanningAnchor(calendar, storage) === null, 'Malformed planning context must not crash startup.')

values.set('arc.planning-context.v1', JSON.stringify({ schemaVersion: 1, calendarId: calendar.id, anchorDate: '2026-11-12' }))
const v1 = loadPlanNavigationContext(calendar, storage)
assert(v1?.context.anchorDate === '2026-11-12' && v1.viewWasPersisted === false, 'v1 context must restore date without claiming an explicit view.')
assert(!v1?.context.lessonId && !v1?.context.sectionId, 'v1 context must not invent teaching IDs.')

const saved = createPlanNavigationContext({
  calendarId: calendar.id,
  view: 'Day',
  anchorDate: '2026-09-16',
  focus: 'lesson',
  courseId: 'course-2d',
  sectionId: 'section-p6',
  unitId: 'unit-2d-1',
  lessonId: 'lesson-collage',
  teachingBlockId: 'block-p6',
})
assert(savePlanNavigationContext(saved, storage), 'v2 plan context save should succeed.')
const restored = loadPlanNavigationContext(calendar, storage)
assert(restored?.viewWasPersisted === true, 'v2 view must be treated as explicitly persisted.')
assert(restored?.context.focus === 'lesson' && restored.context.lessonId === 'lesson-collage', 'Lesson focus must survive refresh.')
assert(restored?.context.sectionId === 'section-p6' && restored.context.teachingBlockId === 'block-p6', 'Class territory must survive refresh with the Lesson.')
assert(JSON.parse(values.get('arc.planning-context.v1') ?? '{}').overlay === undefined, 'Workspace overlay must not be persisted in Plan navigation context.')
assert(JSON.parse(values.get('arc.planning-context.v1') ?? '{}').timer === undefined, 'ArcTable live controls must not be stored in Plan navigation context.')

const emptyIds = createPlanNavigationContext({ calendarId: calendar.id, anchorDate: '2026-09-16', view: 'Day', focus: 'day', courseId: '', sectionId: '  ' })
assert(savePlanNavigationContext(emptyIds, storage) && !loadPlanNavigationContext(calendar, storage)?.context.courseId && !loadPlanNavigationContext(calendar, storage)?.context.sectionId, 'Empty IDs must not be persisted.')

console.log('Planning navigation context persistence contract passed')
