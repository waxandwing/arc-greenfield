import { currentLocalISODate, moveAnchor, todayAnchor } from './navigation'
import type { SchoolCalendar } from './types'

function equal(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`)
}

const calendar: SchoolCalendar = {
  id: 'nav-contract',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  days: {},
  quarters: [
    { id: 'q1', label: 'Q1', startDate: '2026-08-10', endDate: '2026-10-09' },
    { id: 'q2', label: 'Q2', startDate: '2026-10-12', endDate: '2026-12-18' },
    { id: 'q3', label: 'Q3', startDate: '2027-01-04', endDate: '2027-03-12' },
    { id: 'q4', label: 'Q4', startDate: '2027-03-15', endDate: '2027-05-28' },
  ],
  semesters: [
    { id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-12-18' },
    { id: 's2', label: 'Semester 2', startDate: '2027-01-04', endDate: '2027-05-28' },
  ],
}

equal(moveAnchor(calendar, 'Day', '2026-09-02', 'next'), '2026-09-03', 'day next')
equal(moveAnchor(calendar, 'Day', '2026-08-10', 'previous'), null, 'day cannot move before year')
equal(moveAnchor(calendar, 'Week', '2026-09-02', 'next'), '2026-09-09', 'week next')
equal(moveAnchor(calendar, 'Month', '2026-08-31', 'next'), '2026-09-30', 'month clamps day safely')
equal(moveAnchor(calendar, 'Quarter', '2026-09-02', 'next'), '2026-10-12', 'quarter next boundary')
equal(moveAnchor(calendar, 'Quarter', '2026-10-12', 'previous'), '2026-08-10', 'quarter previous boundary')
equal(moveAnchor(calendar, 'Semester', '2026-09-02', 'next'), '2027-01-04', 'semester next boundary')
equal(moveAnchor(calendar, 'Year Map', '2026-09-02', 'next'), null, 'year map does not fake unloaded year')
equal(todayAnchor(calendar, '2026-09-02'), '2026-09-02', 'today inside school year')
equal(todayAnchor(calendar, '2027-07-01'), null, 'today outside school year')
equal(currentLocalISODate(new Date(2026, 8, 2, 23, 30)), '2026-09-02', 'today uses local date fields')

console.log('calendar navigation contract passed')
