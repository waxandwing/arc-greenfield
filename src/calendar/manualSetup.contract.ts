import { buildManualCalendarInput } from './manualSetup'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const base = buildManualCalendarInput({
  calendarId: 'manual-stable-id',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  exceptions: [{ date: '2026-09-07', kind: 'holiday', source: 'manual', confidence: 'confirmed' }],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-10-09' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-10-12', endDate: '2026-12-18' },
  ],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-08-10', endDate: '2026-12-18' }],
})

const edited = buildManualCalendarInput({
  calendarId: base.id,
  schoolYearLabel: '2026–2027 revised label',
  firstDay: base.firstDay,
  lastDay: base.lastDay,
  instructionalWeekdays: base.instructionalWeekdays,
  exceptions: [...(base.exceptions ?? []), { date: '2026-10-02', kind: 'teacher-workday', source: 'manual', confidence: 'confirmed' }],
  quarters: base.quarters,
  semesters: base.semesters,
})

assert(edited.id === 'manual-stable-id', 'Editing the school-year label must not change calendar identity.')
assert(edited.quarters?.length === 2, 'Date edits must preserve quarter boundaries.')
assert(edited.semesters?.length === 1, 'Date edits must preserve semester boundaries.')
assert(edited.quarters !== base.quarters, 'Preserved quarter arrays must be copied rather than shared by reference.')
assert(edited.semesters !== base.semesters, 'Preserved semester arrays must be copied rather than shared by reference.')
assert(edited.exceptions?.length === 2, 'Manual date edits must preserve prior exceptions while adding new ones.')

console.log('calendar manual setup contract passed')
