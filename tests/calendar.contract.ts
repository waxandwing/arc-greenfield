import { addCalendarDays, assertISODate, mondayFirstWeekdayIndex } from '../src/calendar/dateMath'
import { assessCalendarReadiness } from '../src/calendar/readiness'
import {
  getCalendarDay,
  instructionalDaysBetween,
  nextInstructionalDay,
  previousInstructionalDay,
} from '../src/calendar/schoolCalendar'
import type { SchoolCalendar } from '../src/calendar/types'

function equal(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`)
}

function deepEqual(actual: unknown, expected: unknown, label: string) {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) throw new Error(`${label}: expected ${expectedJson}, got ${actualJson}`)
}

function throws(fn: () => void, label: string) {
  let threw = false
  try { fn() } catch { threw = true }
  if (!threw) throw new Error(`${label}: expected function to throw`)
}

const calendar: SchoolCalendar = {
  id: 'contract-calendar',
  schoolYearLabel: 'contract-test',
  firstDay: '2026-09-01',
  lastDay: '2026-09-07',
  days: {
    '2026-09-01': { date: '2026-09-01', kind: 'instructional', confidence: 'confirmed' },
    '2026-09-02': { date: '2026-09-02', kind: 'instructional', confidence: 'confirmed' },
    '2026-09-03': { date: '2026-09-03', kind: 'teacher-workday', confidence: 'confirmed' },
    '2026-09-04': { date: '2026-09-04', kind: 'instructional', confidence: 'confirmed' },
    '2026-09-05': { date: '2026-09-05', kind: 'no-school', confidence: 'confirmed' },
    '2026-09-06': { date: '2026-09-06', kind: 'no-school', confidence: 'confirmed' },
  },
  quarters: [],
  semesters: [],
}

equal(addCalendarDays('2026-02-28', 1), '2026-03-01', 'month rollover')
equal(addCalendarDays('2028-02-28', 1), '2028-02-29', 'leap day')
throws(() => assertISODate('2026-02-30'), 'invalid calendar date')
equal(mondayFirstWeekdayIndex('2026-08-31'), 0, 'Monday stays in first calendar column')
equal(mondayFirstWeekdayIndex('2026-09-02'), 2, 'Wednesday maps to third calendar column')
equal(mondayFirstWeekdayIndex('2026-09-06'), 6, 'Sunday stays in seventh calendar column')
equal(getCalendarDay(calendar, '2026-09-07').kind, 'unknown', 'missing day stays unknown')
equal(nextInstructionalDay(calendar, '2026-09-02'), '2026-09-04', 'next instructional skips workday')
equal(previousInstructionalDay(calendar, '2026-09-04'), '2026-09-02', 'previous instructional skips workday')
deepEqual(
  instructionalDaysBetween(calendar, '2026-09-01', '2026-09-07'),
  ['2026-09-01', '2026-09-02', '2026-09-04'],
  'instructional range',
)

const readiness = assessCalendarReadiness(calendar)
equal(readiness.ready, false, 'unknown day blocks structural readiness')
deepEqual(readiness.unknownDates, ['2026-09-07'], 'unknown date is surfaced')
assertIncludes(readiness.unconfirmedDates, '2026-09-07', 'unknown date is also unconfirmed')

const mixedCalendar: SchoolCalendar = {
  ...calendar,
  lastDay: '2026-09-06',
  days: {
    ...calendar.days,
    '2026-09-02': { date: '2026-09-02', kind: 'instructional', confidence: 'mixed' },
  },
}
const mixedReadiness = assessCalendarReadiness(mixedCalendar)
equal(mixedReadiness.ready, false, 'mixed confidence blocks structural readiness')
deepEqual(mixedReadiness.unknownDates, [], 'mixed confidence need not be unknown')
assertIncludes(mixedReadiness.unconfirmedDates, '2026-09-02', 'mixed-confidence date is surfaced')

console.log('calendar truth contract passed')

function assertIncludes(values: string[], expected: string, label: string) {
  if (!values.includes(expected)) throw new Error(`${label}: expected ${expected} in ${JSON.stringify(values)}`)
}
