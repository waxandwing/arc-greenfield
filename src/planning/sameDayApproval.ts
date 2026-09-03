import { assertISODate } from '../calendar/dateMath'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import type { Lesson } from './lessons'

export type SameDayLessonApproval = {
  sectionId: string
  date: ISODate
  lessonIds: string[]
}

export function createSameDayLessonApproval(input: {
  sectionId: string
  date: ISODate
  lessonIds: string[]
}): SameDayLessonApproval {
  const approval: SameDayLessonApproval = {
    sectionId: input.sectionId,
    date: input.date,
    lessonIds: [...input.lessonIds].sort(),
  }
  const structuralErrors = validateSameDayApprovalShape(approval)
  if (structuralErrors.length > 0) throw new Error(`Cannot approve same-day Lessons. ${structuralErrors.join(' ')}`)
  return approval
}

export function validateSameDayLessonApproval(input: {
  approval: SameDayLessonApproval
  calendar: SchoolCalendar
  section: Section
  lessons: Lesson[]
}): string[] {
  const { approval, calendar, section, lessons } = input
  const errors = validateSameDayApprovalShape(approval)
  if (approval.sectionId !== section.id) errors.push('Same-day approval belongs to a different Section.')

  const day = calendar.days[approval.date]
  if (!day || day.kind !== 'instructional' || day.confidence !== 'confirmed') {
    errors.push('Same-day approval requires a confirmed instructional date.')
  }

  for (const lessonId of approval.lessonIds) {
    const lesson = lessons.find((candidate) => candidate.id === lessonId)
    if (!lesson) {
      errors.push(`Same-day approval references a Lesson that does not exist: ${lessonId}.`)
      continue
    }
    if (lesson.courseId !== section.courseId || lesson.calendarId !== section.calendarId) {
      errors.push(`${lesson.title} does not belong to the approved Section's Course and calendar.`)
    }
  }

  return [...new Set(errors)]
}

export function sameDayApprovalCovers(
  approval: SameDayLessonApproval,
  sectionId: string,
  date: ISODate,
  lessonIds: string[],
): boolean {
  if (approval.sectionId !== sectionId || approval.date !== date) return false
  return sameStringSet(approval.lessonIds, lessonIds)
}

export function sameDayApprovalKey(approval: SameDayLessonApproval): string {
  return `${approval.sectionId}:${approval.date}:${[...approval.lessonIds].sort().join(',')}`
}

function validateSameDayApprovalShape(approval: SameDayLessonApproval): string[] {
  const errors: string[] = []
  if (!approval.sectionId.trim()) errors.push('Same-day approval Section ID is required.')
  try { assertISODate(approval.date) } catch (error) { errors.push(error instanceof Error ? error.message : String(error)) }
  if (approval.lessonIds.length < 2) errors.push('Same-day approval must name at least two Lessons.')
  if (approval.lessonIds.some((lessonId) => !lessonId.trim())) errors.push('Same-day approval Lesson IDs must be non-empty.')
  if (new Set(approval.lessonIds).size !== approval.lessonIds.length) errors.push('Same-day approval cannot repeat a Lesson ID.')
  return errors
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((value, index) => value === b[index])
}
