import { hydrateSchoolCalendar } from './hydration'
import { loadPlanningAnchor, savePlanningAnchor } from './navigationContext'

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

console.log('Planning navigation context persistence contract passed')
