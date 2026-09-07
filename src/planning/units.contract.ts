import { hydrateSchoolCalendar, type CalendarHydrationInput } from '../calendar/hydration'
import { createUnit, placeUnit, summarizeUnitPlacement, unplaceUnit, validateUnitPlacement } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendarInput: CalendarHydrationInput = {
  id: 'calendar-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2026-08-31',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-08-17', kind: 'holiday', label: 'No school', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [{ id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-08-31' }],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-08-31' }],
}

const calendar = hydrateSchoolCalendar(calendarInput)
const unit = createUnit({ id: 'unit-identity', calendarId: calendar.id, courseId: 'course-art-history', title: ' Ancient Mesopotamia ' })
assert(unit.id === 'unit-identity', 'Unit identity must be stable and explicit when supplied.')
assert(unit.title === 'Ancient Mesopotamia', 'Unit titles must be normalized without changing meaning.')
assert(unit.placement === null, 'A Unit may exist before it is placed on the calendar.')

const placed = placeUnit(unit, calendar, { startDate: '2026-08-14', endDate: '2026-08-18' })
assert(placed.id === unit.id, 'Placing a Unit must not change its identity.')
assert(placed.courseId === unit.courseId, 'Placing a Unit must not change its course ownership.')
assert(unit.placement === null, 'Unit placement must be immutable; placing a copy cannot mutate the original.')

const summary = summarizeUnitPlacement(placed, calendar)
assert(summary?.instructionalDates.join(',') === '2026-08-14,2026-08-18', 'Unit pacing must count confirmed instructional days, not weekends or holidays.')
assert(summary?.quarterIds.join(',') === 'q1', 'Quarter membership must be derived from current calendar truth.')
assert(summary?.semesterIds.join(',') === 's1', 'Semester membership must be derived from current calendar truth.')

const unplaced = unplaceUnit(placed)
assert(unplaced.id === placed.id && unplaced.placement === null, 'Unplacing a Unit must preserve identity and remove only placement.')

const weekendOnlyErrors = validateUnitPlacement(unit, calendar, { startDate: '2026-08-15', endDate: '2026-08-16' })
assert(weekendOnlyErrors.some((error) => error.includes('at least one confirmed instructional day')), 'A Unit cannot be placed entirely on non-instructional time.')

const outsideErrors = validateUnitPlacement(unit, calendar, { startDate: '2026-08-01', endDate: '2026-08-12' })
assert(outsideErrors.some((error) => error.includes('outside the school-year bounds')), 'Unit placement must remain inside the loaded school year.')

const otherCalendar = hydrateSchoolCalendar({ ...calendarInput, id: 'other-calendar' })
const mismatchErrors = validateUnitPlacement(unit, otherCalendar, { startDate: '2026-08-14', endDate: '2026-08-18' })
assert(mismatchErrors.some((error) => error.includes('different school calendar')), 'A Unit cannot be placed against a different calendar identity.')

const uncertainCalendar = hydrateSchoolCalendar({ ...calendarInput, patternConfidence: 'mixed' })
const uncertainErrors = validateUnitPlacement(unit, uncertainCalendar, { startDate: '2026-08-14', endDate: '2026-08-18' })
assert(uncertainErrors.some((error) => error.includes('not ready for structural planning')), 'Unit placement must remain blocked when calendar truth is not confirmed.')

const changedTermCalendar = hydrateSchoolCalendar({
  ...calendarInput,
  quarters: [{ id: 'q-renamed-source', label: 'Opening Term', startDate: '2026-08-10', endDate: '2026-08-31' }],
})
const changedSummary = summarizeUnitPlacement(placed, changedTermCalendar)
assert(changedSummary?.quarterIds.join(',') === 'q-renamed-source', 'Units must derive term relationships from the current calendar instead of storing stale term IDs.')

console.log('unit domain contract passed')
