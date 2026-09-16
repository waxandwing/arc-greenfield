import { hydrateSchoolCalendar } from '../calendar/hydration'
import {
  buildLessonCreateSeed,
  createLessonFromSeed,
  isOffDayPlaceSlot,
  offDayPlaceNotice,
  resolveUnitForPlaceLesson,
  unscheduledLessonsForCourse,
  type PlanPlaceLessonIntent,
} from './planPlaceLesson'
import { createLesson } from './lessons'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'plan-place',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

const units: UnitWorkspace = {
  calendarId: calendar.id,
  units: [
    {
      id: 'unit-2d',
      calendarId: calendar.id,
      courseId: 'course-2d',
      title: 'Value',
      placement: { startDate: '2026-09-01', endDate: '2026-10-15' },
    },
    {
      id: 'unit-other',
      calendarId: calendar.id,
      courseId: 'course-apah',
      title: 'Egypt',
      placement: { startDate: '2026-09-01', endDate: '2026-10-15' },
    },
  ],
}

const instructionalIntent: PlanPlaceLessonIntent = {
  courseId: 'course-2d',
  sectionId: 'section-p2',
  date: '2026-09-14',
  dayKind: 'instructional',
  dayLabel: null,
}

const noSchoolIntent: PlanPlaceLessonIntent = {
  courseId: 'course-2d',
  sectionId: 'section-p2',
  date: '2026-09-13',
  dayKind: 'no-school',
  dayLabel: 'No school',
}

assert(!isOffDayPlaceSlot('instructional'), 'Instructional slots must be plannable.')
assert(isOffDayPlaceSlot('no-school'), 'No-school slots must be off-day place targets.')
assert(offDayPlaceNotice(noSchoolIntent).includes('No school'), 'Off-day notice must name the day kind.')
assert(offDayPlaceNotice(noSchoolIntent).includes('Unscheduled'), 'Off-day notice must explain Unscheduled destination.')

const instructionalSeed = buildLessonCreateSeed(instructionalIntent, calendar)
assert(instructionalSeed.plannedDate === '2026-09-14', 'Instructional click must seed the clicked date.')
assert(instructionalSeed.offDayNotice === null, 'Instructional click must not show an off-day notice.')

const noSchoolSeed = buildLessonCreateSeed(noSchoolIntent, calendar)
assert(noSchoolSeed.plannedDate === null, 'No-school click must not seed a blocked calendar date.')
assert(Boolean(noSchoolSeed.offDayNotice), 'No-school click must carry a visible off-day notice.')

const unit = resolveUnitForPlaceLesson(units, 'course-2d', '2026-09-14')
assert(unit?.id === 'unit-2d', 'Place seed must resolve the Course Unit covering the date.')

const created = createLessonFromSeed({
  calendarId: calendar.id,
  units,
  existingLessons: [],
  seed: instructionalSeed,
})
assert(created?.courseId === 'course-2d' && created.plannedDate === '2026-09-14', 'Create-from-seed must attach Course and date.')

const existing = [
  createLesson({
    id: 'loose-1',
    calendarId: calendar.id,
    courseId: 'course-2d',
    unitId: 'unit-2d',
    title: 'Loose sketch',
    sequence: 1,
    plannedDate: null,
  }),
  createLesson({
    id: 'loose-other',
    calendarId: calendar.id,
    courseId: 'course-apah',
    unitId: 'unit-other',
    title: 'Other course',
    sequence: 1,
    plannedDate: null,
  }),
]
const fridge = unscheduledLessonsForCourse(existing, 'course-2d')
assert(fridge.length === 1 && fridge[0].id === 'loose-1', 'Place-from-library list must stay Course-scoped.')

console.log('planPlaceLesson.contract.ts: ok')
