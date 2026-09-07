import { replaceTermBoundaries, sortTermBoundaries, validateTermConfiguration } from './terms'
import type { CalendarHydrationInput } from './hydration'
import type { TermBoundary } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const base: CalendarHydrationInput = {
  id: 'term-contract-calendar',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' }],
}

const quarters: TermBoundary[] = [
  { id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-10-09' },
  { id: 'q2', label: 'Quarter 2', startDate: '2026-10-12', endDate: '2026-12-18' },
  { id: 'q3', label: 'Quarter 3', startDate: '2027-01-04', endDate: '2027-03-12' },
  { id: 'q4', label: 'Quarter 4', startDate: '2027-03-15', endDate: '2027-05-28' },
]

const semesters: TermBoundary[] = [
  { id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-12-18' },
  { id: 's2', label: 'Semester 2', startDate: '2027-01-04', endDate: '2027-05-28' },
]

assert(validateTermConfiguration(base, quarters, semesters).length === 0, 'A valid nested quarter/semester structure must pass.')

const replaced = replaceTermBoundaries(base, quarters, semesters)
assert(replaced.id === base.id, 'Editing terms must preserve calendar identity.')
assert(replaced.exceptions?.[0]?.date === '2026-09-07', 'Editing terms must preserve date exceptions.')
assert(replaced.quarters?.[0]?.id === 'q1', 'Term IDs must survive replacement unchanged.')

const overlapping = validateTermConfiguration(base, [
  quarters[0],
  { id: 'q2', label: 'Quarter 2', startDate: '2026-10-01', endDate: '2026-12-18' },
], semesters)
assert(overlapping.some((error) => error.includes('overlaps')), 'Overlapping quarters must be rejected.')

const crossingSemester = validateTermConfiguration(base, [
  { id: 'q1', label: 'Quarter 1', startDate: '2026-11-02', endDate: '2027-01-15' },
], semesters)
assert(crossingSemester.some((error) => error.includes('fit entirely inside one semester')), 'A quarter crossing semesters must be rejected.')

const outOfYear = validateTermConfiguration(base, [
  { id: 'q1', label: 'Quarter 1', startDate: '2026-08-01', endDate: '2026-10-09' },
], semesters)
assert(outOfYear.some((error) => error.includes('outside the school-year bounds')), 'Out-of-year term boundaries must be rejected.')

const sorted = sortTermBoundaries([quarters[2], quarters[0], quarters[1]])
assert(sorted.map((term) => term.id).join(',') === 'q1,q2,q3', 'Term boundaries must sort chronologically without changing IDs.')

console.log('calendar term configuration contract passed')
