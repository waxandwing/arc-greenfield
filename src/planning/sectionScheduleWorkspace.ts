import type { ISODate, SchoolCalendar } from '../calendar/types'
import { effectiveLessonDeliveryState } from './deliveryState'
import type { LessonWorkspace } from './lessonWorkspace'
import { effectiveLessonDate, validateSectionLessonOverride, type SectionLessonDateOverride } from './sectionSchedule'
import { sameDayApprovalCovers, sameDayApprovalKey, validateSameDayLessonApproval, type SameDayLessonApproval } from './sameDayApproval'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'

export type SectionScheduleWorkspace = {
  calendarId: string
  overrides: SectionLessonDateOverride[]
  sameDayApprovals?: SameDayLessonApproval[]
}

export function validateSectionScheduleWorkspace(
  workspace: SectionScheduleWorkspace,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): string[] {
  const errors: string[] = []
  const approvals = workspace.sameDayApprovals ?? []
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

  const approvalKeys = new Set<string>()
  for (const approval of approvals) {
    const key = sameDayApprovalKey(approval)
    if (approvalKeys.has(key)) {
      errors.push(`Duplicate same-day approval for ${approval.sectionId} on ${approval.date}.`)
      continue
    }
    approvalKeys.add(key)

    const section = planning.sections.find((candidate) => candidate.id === approval.sectionId)
    if (!section) {
      errors.push(`Same-day approval references a Section that does not exist: ${approval.sectionId}.`)
      continue
    }
    errors.push(...validateSameDayLessonApproval({ approval, calendar, section, lessons: lessons.lessons }).map((error) => `${section.name}: ${error}`))
  }

  const usedApprovalKeys = new Set<string>()
  for (const section of planning.sections) {
    const byDate = new Map<ISODate, Array<{ id: string; title: string }>>()
    const sectionLessons = lessons.lessons.filter((candidate) => candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)
    for (const lesson of sectionLessons) {
      const delivery = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, section)
      if (delivery.status === 'completed' || delivery.status === 'skipped') continue

      const date = effectiveLessonDate(lesson, section.id, workspace.overrides)
      if (!date) continue
      const sameDate = byDate.get(date) ?? []
      sameDate.push({ id: lesson.id, title: lesson.title })
      byDate.set(date, sameDate)
    }
    for (const [date, sameDate] of byDate) {
      if (sameDate.length <= 1) continue
      const approval = approvals.find((candidate) => sameDayApprovalCovers(candidate, section.id, date, sameDate.map((lesson) => lesson.id)))
      if (!approval) {
        errors.push(`${section.name} has multiple live Lessons on ${date}: ${sameDate.map((lesson) => lesson.title).join(', ')}.`)
      } else {
        usedApprovalKeys.add(sameDayApprovalKey(approval))
      }
    }
  }

  for (const approval of approvals) {
    const key = sameDayApprovalKey(approval)
    if (!usedApprovalKeys.has(key)) {
      errors.push(`Same-day approval for ${approval.sectionId} on ${approval.date} no longer matches a current live Lesson collision.`)
    }
  }

  return [...new Set(errors)]
}
