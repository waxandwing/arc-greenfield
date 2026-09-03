import { projectDay, projectMonth, projectQuarter, projectSemester, projectWeek, projectYearMap } from './projections'
import type { SchoolCalendar } from './types'

const calendar: SchoolCalendar = {
  id: 'projection-contract',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  days: {
    '2026-08-10': { date: '2026-08-10', kind: 'instructional', source: 'manual', confidence: 'confirmed' },
    '2026-08-11': { date: '2026-08-11', kind: 'instructional', source: 'manual', confidence: 'confirmed' },
    '2026-08-12': { date: '2026-08-12', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    '2026-08-13': { date: '2026-08-13', kind: 'instructional', source: 'manual', confidence: 'confirmed' },
    '2026-08-14': { date: '2026-08-14', kind: 'instructional', source: 'manual', confidence: 'confirmed' },
  },
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-10-09' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-10-12', endDate: '2026-12-18' },
  ],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-12-18' }],
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const day = projectDay(calendar, '2026-08-12')
assert(day.day.kind === 'no-school', 'Day projection must preserve canonical day kind.')
assert(day.quarter?.id === 'q1', 'Day projection must resolve containing quarter.')
assert(day.semester?.id === 's1', 'Day projection must resolve containing semester.')

const week = projectWeek(calendar, '2026-08-12')
assert(week.startDate === '2026-08-10', 'Week projection must begin Monday.')
assert(week.endDate === '2026-08-16', 'Week projection must end Sunday.')
assert(week.days.length === 7, 'Week projection must expose seven calendar days.')
assert(week.days[2].kind === 'no-school', 'Week projection must preserve no-school truth.')
assert(week.days[5].isWeekend, 'Week projection must identify Saturday as weekend.')
assert(week.days[6].isWeekend, 'Week projection must identify Sunday as weekend.')

const month = projectMonth(calendar, '2026-08-12')
assert(month.monthKey === '2026-08', 'Month projection must identify anchor month.')
assert(month.gridStartDate === '2026-07-27', 'Month projection must begin on the Monday covering the first of month.')
assert(month.gridEndDate === '2026-09-06', 'Month projection must end on the Sunday covering month end.')
assert(month.weeks.length === 6, 'August 2026 requires six Monday–Sunday grid rows.')
assert(month.weeks.every((row) => row.days.length === 7), 'Every month row must contain seven days.')

const quarter = projectQuarter(calendar, '2026-08-12')
assert(quarter?.id === 'q1', 'Quarter projection must use canonical boundary identity.')
assert(quarter?.days[0].date === '2026-08-10', 'Quarter projection must begin at canonical boundary.')
assert(quarter?.days.some((entry) => entry.kind === 'unknown'), 'Quarter projection must preserve unknown calendar gaps rather than infer school days.')

const semester = projectSemester(calendar, '2026-11-01')
assert(semester?.id === 's1', 'Semester projection must resolve canonical semester.')

const year = projectYearMap(calendar)
assert(year.startDate === calendar.firstDay && year.endDate === calendar.lastDay, 'Year Map must use school-year bounds exactly.')
assert(year.quarters === calendar.quarters || year.quarters.length === calendar.quarters.length, 'Year Map must expose quarter boundaries.')
assert(year.semesters.length === 1, 'Year Map must expose semester boundaries.')
assert(year.days[0].date === calendar.firstDay, 'Year Map first day must equal canonical first day.')
assert(year.days[year.days.length - 1].date === calendar.lastDay, 'Year Map last day must equal canonical last day.')

console.log('calendar projection contract passed')
