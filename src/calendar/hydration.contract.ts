import { assessCalendarReadiness } from './readiness'
import { getCalendarDay } from './schoolCalendar'
import { hydrateSchoolCalendar, validateHydrationInput, type CalendarHydrationInput } from './hydration'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const input: CalendarHydrationInput = {
  id: 'hydration-contract',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2026-09-07',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-09-03', kind: 'teacher-workday', label: 'Planning day' },
    { date: '2026-09-05', kind: 'instructional', label: 'Saturday makeup day', source: 'district-source', confidence: 'confirmed' },
  ],
  quarters: [{ id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-09-07' }],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2026-09-07' }],
}

const calendar = hydrateSchoolCalendar(input)
assert(Object.keys(calendar.days).length === 7, 'Hydration must create one explicit record for every school-year date.')
assert(getCalendarDay(calendar, '2026-09-01').kind === 'instructional', 'Declared weekday pattern must create instructional days.')
assert(getCalendarDay(calendar, '2026-09-06').kind === 'no-school', 'Declared weekday pattern must create explicit non-instructional weekends.')
assert(getCalendarDay(calendar, '2026-09-03').kind === 'teacher-workday', 'Exception must override weekday pattern.')
assert(getCalendarDay(calendar, '2026-09-03').source === 'manual', 'Exception without provenance must inherit pattern source.')
assert(getCalendarDay(calendar, '2026-09-05').kind === 'instructional', 'Explicit exception must be able to make a weekend instructional.')
assert(getCalendarDay(calendar, '2026-09-05').source === 'district-source', 'Explicit exception provenance must be preserved.')
assert(assessCalendarReadiness(calendar).ready, 'A complete confirmed hydrated calendar must be structurally ready.')

const duplicateExceptionErrors = validateHydrationInput({
  ...input,
  exceptions: [
    { date: '2026-09-03', kind: 'holiday' },
    { date: '2026-09-03', kind: 'teacher-workday' },
  ],
})
assert(duplicateExceptionErrors.some((error) => error.includes('duplicated')), 'Duplicate exceptions must be rejected.')

const outOfBoundsErrors = validateHydrationInput({
  ...input,
  exceptions: [{ date: '2026-09-08', kind: 'holiday' }],
})
assert(outOfBoundsErrors.some((error) => error.includes('outside the school-year bounds')), 'Out-of-range exceptions must be rejected.')

const duplicateWeekdayErrors = validateHydrationInput({ ...input, instructionalWeekdays: [1, 1, 2] })
assert(duplicateWeekdayErrors.some((error) => error.includes('duplicated')), 'Duplicate instructional weekdays must be rejected.')

const unknownCalendar = hydrateSchoolCalendar({
  ...input,
  exceptions: [{ date: '2026-09-04', kind: 'unknown', confidence: 'mixed' }],
})
assert(!assessCalendarReadiness(unknownCalendar).ready, 'Explicit unknown exception must keep structural operations blocked.')

console.log('calendar hydration contract passed')
