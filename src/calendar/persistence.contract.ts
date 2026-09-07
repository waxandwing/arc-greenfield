import { deserializeCalendarInput, restoreCalendarFromRaw, serializeCalendarInput } from './persistence'
import type { CalendarHydrationInput } from './hydration'

function equal(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`)
}

function truthy(value: unknown, label: string) {
  if (!value) throw new Error(`${label}: expected truthy value`)
}

const input: CalendarHydrationInput = {
  id: 'manual-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' },
    { date: '2026-10-17', kind: 'instructional', label: 'Saturday session', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-10-09' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-10-12', endDate: '2026-12-18' },
  ],
  semesters: [
    { id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-12-18' },
  ],
}

const raw = serializeCalendarInput(input)
const restoredInput = deserializeCalendarInput(raw)
truthy(restoredInput, 'valid declaration deserializes')
equal(restoredInput?.schoolYearLabel, '2026–27', 'label survives round trip')
equal(restoredInput?.exceptions?.[1]?.kind, 'instructional', 'exception survives round trip')
equal(restoredInput?.quarters?.[0]?.id, 'q1', 'quarter identity survives round trip')
equal(restoredInput?.semesters?.[0]?.label, 'Semester 1', 'semester label survives round trip')

const restored = restoreCalendarFromRaw(raw)
truthy(restored, 'valid declaration rehydrates')
equal(restored?.calendar.days['2026-09-07']?.kind, 'holiday', 'holiday survives rehydration')
equal(restored?.calendar.days['2026-10-17']?.kind, 'instructional', 'weekend override survives rehydration')
equal(restored?.calendar.quarters[1]?.id, 'q2', 'quarter boundaries survive rehydration')
equal(restored?.calendar.semesters[0]?.id, 's1', 'semester boundaries survive rehydration')

equal(deserializeCalendarInput('{bad json'), null, 'malformed json is rejected')
equal(deserializeCalendarInput(JSON.stringify({ schemaVersion: 2, input })), null, 'unknown schema version is rejected')
equal(deserializeCalendarInput(JSON.stringify({ schemaVersion: 1, input: { ...input, instructionalWeekdays: [1, 9] } })), null, 'invalid weekday is rejected')
equal(deserializeCalendarInput(JSON.stringify({ schemaVersion: 1, input: { ...input, exceptions: [input.exceptions?.[0], input.exceptions?.[0]] } })), null, 'duplicate exception is rejected')
equal(restoreCalendarFromRaw(JSON.stringify({ schemaVersion: 1, input: { ...input, quarters: [{ id: 'q1', label: 'Q1', startDate: '2027-01-01', endDate: '2026-12-01' }] } })), null, 'structurally invalid boundary is rejected')

console.log('calendar persistence contract passed')
