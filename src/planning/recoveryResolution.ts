import { instructionalDaysBetween, type ISODate, type SchoolCalendar } from '../calendar'
import type { Section } from './courses'
import { effectiveLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import type { Lesson } from './lessons'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'
import type { Unit } from './units'

export function recoveryDestinationDates(input: {
  calendar: SchoolCalendar
  section: Section
  lesson: Lesson
  unit: Unit
  resumeDate: ISODate
  movingLessonIds: string[]
  lessons: Lesson[]
  deliveryStates: LessonDeliveryState[]
  overrides: SectionLessonDateOverride[]
}): ISODate[] {
  const { calendar, section, lesson, unit, resumeDate, movingLessonIds, lessons, deliveryStates, overrides } = input
  if (!unit.placement) return []

  const moving = new Set(movingLessonIds)
  const occupied = new Set<ISODate>()
  for (const candidate of lessons) {
    if (candidate.courseId !== section.courseId || candidate.calendarId !== section.calendarId || moving.has(candidate.id)) continue
    const delivery = effectiveLessonDeliveryState(deliveryStates, candidate, section)
    if (delivery.status === 'completed' || delivery.status === 'skipped') continue
    const date = effectiveLessonDate(candidate, section.id, overrides)
    if (date) occupied.add(date)
  }

  const currentDate = effectiveLessonDate(lesson, section.id, overrides)
  return instructionalDaysBetween(calendar, unit.placement.startDate, unit.placement.endDate)
    .filter((date) => date > resumeDate && date !== currentDate && !occupied.has(date))
}

export function hasDuplicateRecoveryDestinations(
  interruptedLessonId: string,
  resumeDate: ISODate,
  lessonIds: string[],
  chosenDates: Record<string, ISODate>,
): boolean {
  const destinations = [resumeDate]
  for (const lessonId of lessonIds) {
    if (lessonId === interruptedLessonId) continue
    const date = chosenDates[lessonId]
    if (date) destinations.push(date)
  }
  return new Set(destinations).size !== destinations.length
}
