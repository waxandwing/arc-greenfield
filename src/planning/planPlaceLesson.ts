import type { DayKind, ISODate, SchoolCalendar } from '../calendar'
import { getCalendarDay, isPlannableDayKind } from '../calendar/schoolCalendar'
import { createLessonId, lessonsForUnit, type Lesson } from './lessons'
import type { Unit } from './units'
import type { UnitWorkspace } from './unitWorkspace'

export type PlanPlaceLessonIntent = {
  courseId: string
  sectionId: string
  date: ISODate
  dayKind: DayKind
  dayLabel: string | null
}

export type LessonCreateSeed = {
  courseId: string
  plannedDate: ISODate | null
  /** Visible copy when the clicked slot is a non-instructional / off day. */
  offDayNotice: string | null
}

export function isOffDayPlaceSlot(dayKind: DayKind): boolean {
  return !isPlannableDayKind(dayKind)
}

export function offDayPlaceNotice(intent: PlanPlaceLessonIntent): string {
  const label = intent.dayLabel?.trim() || humanizeDayKind(intent.dayKind)
  return `${label} — Arc will not schedule a Lesson on this date. You can still add a Lesson for this class; it stays Unscheduled in IDEAS until you place it on an instructional day.`
}

export function humanizeDayKind(kind: DayKind): string {
  switch (kind) {
    case 'no-school':
      return 'No school'
    case 'holiday':
      return 'Holiday'
    case 'break':
      return 'Break'
    case 'teacher-workday':
      return 'Teacher workday'
    case 'early-release':
      return 'Early release'
    case 'instructional':
      return 'Instructional day'
    default:
      return 'Calendar day'
  }
}

/** Prefer a Unit on this Course whose placement covers the target date. */
export function resolveUnitForPlaceLesson(
  units: UnitWorkspace,
  courseId: string,
  date: ISODate | null,
): Unit | null {
  const courseUnits = units.units.filter((unit) => unit.courseId === courseId)
  if (courseUnits.length === 0) return null
  if (date) {
    const covering = courseUnits.find(
      (unit) => unit.placement && date >= unit.placement.startDate && date <= unit.placement.endDate,
    )
    if (covering) return covering
  }
  return courseUnits.find((unit) => unit.placement) ?? courseUnits[0] ?? null
}

export function buildLessonCreateSeed(intent: PlanPlaceLessonIntent, calendar: SchoolCalendar): LessonCreateSeed {
  const off = isOffDayPlaceSlot(intent.dayKind)
  const day = getCalendarDay(calendar, intent.date)
  const confirmedPlannable = Boolean(day && isPlannableDayKind(day.kind) && day.confidence === 'confirmed')
  return {
    courseId: intent.courseId,
    plannedDate: !off && confirmedPlannable ? intent.date : null,
    offDayNotice: off ? offDayPlaceNotice(intent) : null,
  }
}

export function createLessonFromSeed(input: {
  calendarId: string
  units: UnitWorkspace
  existingLessons: Lesson[]
  seed: LessonCreateSeed
}): Lesson | null {
  const unit = resolveUnitForPlaceLesson(input.units, input.seed.courseId, input.seed.plannedDate)
  if (!unit) return null
  const siblings = lessonsForUnit(input.existingLessons, unit.id)
  // Match LessonSetup "Add Lesson" draft: empty title is allowed until Save.
  return {
    id: createLessonId(),
    calendarId: input.calendarId,
    courseId: unit.courseId,
    unitId: unit.id,
    title: '',
    sequence: siblings.length + 1,
    plannedDate: input.seed.plannedDate,
    datePolicy: 'flexible',
    directions: [],
    materials: [],
    phases: [],
    resources: [],
  }
}

export function unscheduledLessonsForCourse(lessons: Lesson[], courseId: string): Lesson[] {
  return lessons
    .filter((lesson) => lesson.courseId === courseId && lesson.plannedDate === null)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title) || a.sequence - b.sequence)
}
