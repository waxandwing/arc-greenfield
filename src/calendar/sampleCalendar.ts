import type { SchoolCalendar } from './types'

// Render-only fixture for verifying projection consistency. Never ship as user workspace data.
export const sampleCalendar: SchoolCalendar = {
  id: 'render-fixture',
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
