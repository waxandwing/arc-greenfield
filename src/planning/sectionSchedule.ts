import { getCalendarDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import type { Lesson } from './lessons'
import type { Unit } from './units'

export type SectionLessonDateOverride = {
  sectionId: string
  lessonId: string
  plannedDate: ISODate
}

export function effectiveLessonDate(
  lesson: Lesson,
  sectionId: string,
  overrides: SectionLessonDateOverride[],
): ISODate | null {
  return overrides.find((override) => override.sectionId === sectionId && override.lessonId === lesson.id)?.plannedDate ?? lesson.plannedDate
}

export function validateSectionLessonOverride(input: {
  override: SectionLessonDateOverride
  section: Section
  lesson: Lesson
  unit: Unit
  calendar: SchoolCalendar
}): string[] {
  const { override, section, lesson, unit, calendar } = input
  const errors: string[] = []
  if (override.sectionId !== section.id) errors.push('Schedule override belongs to a different Section.')
  if (override.lessonId !== lesson.id) errors.push('Schedule override belongs to a different Lesson.')
  if (section.courseId !== lesson.courseId) errors.push('Section and Lesson belong to different Courses.')
  if (section.calendarId !== lesson.calendarId || lesson.calendarId !== calendar.id) errors.push('Schedule override belongs to a different school calendar.')
  if (lesson.unitId !== unit.id) errors.push('Lesson belongs to a different Unit.')
  if (lesson.datePolicy === 'fixed' && override.plannedDate !== lesson.plannedDate) errors.push('Fixed Lesson dates cannot be overridden.')

  if (!unit.placement) {
    errors.push('Lesson Unit must be placed before a Section date override can be used.')
  } else if (override.plannedDate < unit.placement.startDate || override.plannedDate > unit.placement.endDate) {
    errors.push('Section Lesson date override must stay inside its Unit placement.')
  }

  const day = getCalendarDay(calendar, override.plannedDate)
  if (day.kind !== 'instructional' || day.confidence !== 'confirmed') {
    errors.push('Section Lesson date override must use a confirmed instructional day.')
  }

  return [...new Set(errors)]
}

export function setSectionLessonOverride(
  overrides: SectionLessonDateOverride[],
  next: SectionLessonDateOverride,
): SectionLessonDateOverride[] {
  return [
    ...overrides.filter((override) => !(override.sectionId === next.sectionId && override.lessonId === next.lessonId)),
    { ...next },
  ]
}

export function removeSectionLessonOverride(
  overrides: SectionLessonDateOverride[],
  sectionId: string,
  lessonId: string,
): SectionLessonDateOverride[] {
  return overrides.filter((override) => !(override.sectionId === sectionId && override.lessonId === lessonId))
}
