import { hydrateSchoolCalendar } from '../calendar/hydration'
import { assessSetupCapabilities, minimumPlanningSetupEstablished, nextRequiredSetupCapability } from './setupCapabilities'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }

const calendar = hydrateSchoolCalendar({ id: 'calendar', schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] })
const empty = assessSetupCapabilities({ calendar: null, planning: null, lessons: null })
assert(nextRequiredSetupCapability(empty) === 'calendarEstablished', 'Capability setup must resume at the first missing dependency.')
const planning = { calendarId: calendar.id, courses: [{ id: 'course', title: 'Art' }], sections: [{ id: 'section', courseId: 'course', calendarId: calendar.id, name: 'P1' }], teachingDay: { blocks: [{ id: 'teach', label: 'P1', type: 'teaching' as const, order: 1, sectionId: 'section', startTime: null, endTime: null }, { id: 'plan', label: 'P2', type: 'planning' as const, order: 2, sectionId: null, startTime: null, endTime: null }] } }
const partial = assessSetupCapabilities({ calendar, planning, lessons: null })
assert(minimumPlanningSetupEstablished(partial), 'Calendar, Course, Section, explicit day order, and Planning are the minimum setup.')
assert(!partial.bellTimesEstablished, 'Bell times must remain independently optional.')
assert(!partial.curriculumEstablished && !partial.profileEstablished, 'Optional capabilities must not block planning access.')

console.log('setup capability contract passed')
