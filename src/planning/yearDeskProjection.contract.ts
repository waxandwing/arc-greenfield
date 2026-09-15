import { hydrateSchoolCalendar } from '../calendar/hydration'
import { buildYearDeskSnapshot, groupProjectedDaysByMonth, isInstructionalSchoolDay, quarterToneForDate } from './yearDeskProjection'
import { projectYearMap } from '../calendar/projections'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'year-desk',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2026-08-31',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-08-14', kind: 'no-school', label: 'Holiday' }],
  quarters: [{ id: 'q1', label: 'Q1', startDate: '2026-08-10', endDate: '2026-08-31' }],
  semesters: [],
})

const projection = projectYearMap(calendar)
const months = groupProjectedDaysByMonth(projection.days)
assert(months.length === 1, 'Year desk must group in-school-year days by month.')
assert(quarterToneForDate('2026-08-12', calendar.quarters) === 'q1', 'Quarter tone must map to q1–q4 slots.')

const instructionalCount = projection.days.filter(isInstructionalSchoolDay).length
const snapshot = buildYearDeskSnapshot(calendar, '2026-08-12')
assert(snapshot.totalInstructionalDays === instructionalCount, 'Instructional day count must stay canonical.')
assert(snapshot.remainingSchoolDays <= instructionalCount, 'Remaining school days must not exceed instructional total.')

console.log('Year desk projection contract passed')
