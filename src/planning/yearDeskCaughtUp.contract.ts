import { hydrateSchoolCalendar } from '../calendar/hydration'
import {
  canToggleYearDeskDayCaughtUp,
  clearYearDeskCaughtUp,
  countRemainingSchoolDays,
  isYearDeskDayCaughtUp,
  markYearDeskCaughtUpThroughToday,
  toggleYearDeskDayCaughtUp,
} from './yearDeskCaughtUp'
import { emptyYearDeskState } from './yearDeskPersistence'
import { buildYearDeskSnapshot, isInstructionalSchoolDay } from './yearDeskProjection'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'year-desk-caught',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2026-08-21',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-08-14', kind: 'no-school', label: 'Holiday' }],
  quarters: [{ id: 'q1', label: 'Q1', startDate: '2026-08-10', endDate: '2026-08-21' }],
  semesters: [],
})

const today = '2026-08-18'
const snapshot = buildYearDeskSnapshot(calendar, today)
const instructionalDates = snapshot.months.flatMap((month) => month.days).filter(isInstructionalSchoolDay).map((day) => day.date)

assert(!canToggleYearDeskDayCaughtUp('2026-08-20', today, true), 'Future instructional days must not toggle.')
assert(canToggleYearDeskDayCaughtUp('2026-08-17', today, true), 'Past instructional days must toggle.')
assert(!canToggleYearDeskDayCaughtUp('2026-08-14', today, false), 'Non-instructional days must not toggle.')

let state = emptyYearDeskState(calendar.id)
assert(countRemainingSchoolDays(instructionalDates, today, state) === instructionalDates.length, 'With nothing caught up, every instructional day remains.')

state = toggleYearDeskDayCaughtUp(state, '2026-08-11', today, true)
assert(isYearDeskDayCaughtUp('2026-08-11', today, true, state), 'Toggled day must be caught up.')
assert(!isYearDeskDayCaughtUp('2026-08-12', today, true, state), 'Sibling past day stays open until toggled or bulk-marked.')
assert(countRemainingSchoolDays(instructionalDates, today, state) === instructionalDates.length - 1, 'Remain must drop by one after a per-day mark.')

state = markYearDeskCaughtUpThroughToday(state, today)
assert(isYearDeskDayCaughtUp('2026-08-12', today, true, state), 'Bulk caught-up covers past instructional days through today.')
assert(isYearDeskDayCaughtUp(today, today, true, state), 'Bulk caught-up includes today.')
assert(!isYearDeskDayCaughtUp('2026-08-19', today, true, state), 'Bulk caught-up must not mark future days.')

const afterBulkRemain = countRemainingSchoolDays(instructionalDates, today, state)
assert(afterBulkRemain === instructionalDates.filter((date) => date > today).length, 'After bulk catch-up, only future instructional days remain.')

state = toggleYearDeskDayCaughtUp(state, '2026-08-12', today, true)
assert(!isYearDeskDayCaughtUp('2026-08-12', today, true, state), 'Per-day toggle must clear a watermark-covered day.')
assert(countRemainingSchoolDays(instructionalDates, today, state) === afterBulkRemain + 1, 'Clearing one day must increase remain.')

state = clearYearDeskCaughtUp(state)
assert(!isYearDeskDayCaughtUp('2026-08-11', today, true, state), 'Undo caught up clears per-day and bulk marks.')
assert(countRemainingSchoolDays(instructionalDates, today, state) === instructionalDates.length, 'Undo restores full remain count.')

const blocked = toggleYearDeskDayCaughtUp(state, '2026-08-20', today, true)
assert(blocked === state, 'Future day toggle must be a no-op.')

console.log('Year desk caught-up contract passed')
