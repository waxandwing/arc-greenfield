import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createUnit, placeUnit } from './units'
import { hydratePlanningWorkspace } from './workspace'
import { deserializeUnits, serializeUnits } from './unitPersistence'
import { courseIdsProtectedByUnits, hydrateUnitWorkspace, validateUnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const planning = hydratePlanningWorkspace({
  calendarId: calendar.id,
  courses: [course],
  sections: [createSection({ id: 'section-p2', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })],
})

const baseUnit = createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' })
const placedUnit = placeUnit(baseUnit, calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const workspace = hydrateUnitWorkspace({ calendarId: calendar.id, units: [placedUnit] }, calendar, planning)
assert(workspace.units[0]?.id === 'unit-egypt', 'Unit identity must survive workspace hydration.')
assert(workspace.units[0]?.placement?.startDate === '2026-09-14', 'Unit placement must survive workspace hydration.')
assert(validateUnitWorkspace(workspace, calendar, planning).length === 0, 'Valid Unit workspace must pass validation.')
assert(courseIdsProtectedByUnits(workspace).has(course.id), 'A Course referenced by a Unit must be protected from destructive class edits.')

const raw = serializeUnits(workspace)
const restored = deserializeUnits(raw)
assert(restored?.units[0]?.id === 'unit-egypt', 'Unit identity must survive persistence serialization.')
assert(restored?.units[0]?.placement?.endDate === '2026-09-25', 'Unit placement must survive persistence serialization.')

const shortenedCalendar = hydrateSchoolCalendar({
  id: calendar.id,
  schoolYearLabel: calendar.schoolYearLabel,
  firstDay: calendar.firstDay,
  lastDay: '2026-09-18',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})
assert(validateUnitWorkspace(workspace, shortenedCalendar, planning).some((error) => error.includes('outside the school-year bounds')), 'Calendar edits must be rejected when they would strand an existing Unit placement outside the school year.')

const noInstructionCalendar = hydrateSchoolCalendar({
  id: calendar.id,
  schoolYearLabel: calendar.schoolYearLabel,
  firstDay: calendar.firstDay,
  lastDay: calendar.lastDay,
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-09-14', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-15', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-16', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-17', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-18', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-21', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-22', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-23', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-24', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
    { date: '2026-09-25', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [],
  semesters: [],
})
assert(validateUnitWorkspace(workspace, noInstructionCalendar, planning).some((error) => error.includes('at least one confirmed instructional day')), 'Calendar edits must be rejected when they would remove every instructional day from an existing Unit placement.')

const orphanWorkspace = { ...workspace, units: [{ ...placedUnit, courseId: 'course-missing' }] }
assert(validateUnitWorkspace(orphanWorkspace, calendar, planning).some((error) => error.includes('does not exist')), 'Units cannot silently survive without their Course.')

const duplicateWorkspace = { ...workspace, units: [placedUnit, { ...placedUnit }] }
assert(validateUnitWorkspace(duplicateWorkspace, calendar, planning).some((error) => error.includes('Duplicate Unit ID')), 'Duplicate Unit identities must be rejected.')

assert(deserializeUnits('{bad json') === null, 'Malformed Unit persistence must be rejected.')
assert(deserializeUnits(JSON.stringify({ schemaVersion: 2, input: workspace })) === null, 'Unknown Unit persistence versions must be rejected.')

console.log('unit workspace contract passed')
