import type { ISODate, SchoolCalendar } from '../calendar/types'
import { effectiveLessonDeliveryState } from './deliveryState'
import type { LessonWorkspace } from './lessonWorkspace'
import { effectiveLessonDate, validateSectionLessonOverride, type SectionLessonDateOverride } from './sectionSchedule'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'

export type SectionScheduleWorkspace = {
  calendarId: string
  overrides: SectionLessonDateOverride[]
}

export function validateSectionScheduleWorkspace(
  workspace: SectionScheduleWorkspace,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): string[] {
  const errors: string[] = []
  if (workspace.calendarId !== calendar.id) errors.push('Section schedule belongs to a different school calendar.')
  if (planning.calendarId !== calendar.id) errors.push('Class workspace belongs to a different school calendar.')
  if (units.calendarId !== calendar.id) errors.push('Unit workspace belongs to a different school calendar.')
  if (lessons.calendarId !== calendar.id) errors.push('Lesson workspace belongs to a different school calendar.')

  const keys = new Set<string>()
  for (const override of workspace.overrides) {
    const key = `${override.sectionId}:${override.lessonId}`
    if (keys.has(key)) {
      errors.push(`Duplicate Section schedule override for ${override.lessonId} in ${override.sectionId}.`)
      continue
    }
    keys.add(key)

    const section = planning.sections.find((candidate) => candidate.id === override.sectionId)
    const lesson = lessons.lessons.find((candidate) => candidate.id === override.lessonId)
    if (!section) {
      errors.push(`Section schedule references a Section that does not exist: ${override.sectionId}.`)
      continue
    }
    if (!lesson) {
      errors.push(`Section schedule references a Lesson that does not exist: ${override.lessonId}.`)
      continue
    }
    const unit = units.units.find((candidate) => candidate.id === lesson.unitId)
    if (!unit) {
      errors.push(`${lesson.title} references a Unit that does not exist.`)
      continue
    }

    errors.push(...validateSectionLessonOverride({ override, section, lesson, unit, calendar }).map((error) => `${section.name} / ${lesson.title}: ${error}`))
  }

  for (const section of planning.sections) {
    const byDate = new Map<ISODate, string[]>()
    const sectionLessons = lessons.lessons.filter((candidate) => candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)
    for (const lesson of sectionLessons) {
      const delivery = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, section)
      if (delivery.status === 'completed' || delivery.status === 'skipped') continue

      const date = effectiveLessonDate(lesson, section.id, workspace.overrides)
      if (!date) continue
      const titles = byDate.get(date) ?? []
      titles.push(lesson.title)
      byDate.set(date, titles)
    }
    for (const [date, titles] of byDate) {
      if (titles.length > 1) errors.push(`${section.name} has multiple live Lessons on ${date}: ${titles.join(', ')}.`)
    }
  }

  return [...new Set(errors)]
}
