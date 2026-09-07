import { getCalendarDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Unit } from './units'

export type LessonId = string
export type LessonDatePolicy = 'flexible' | 'fixed'

export type Lesson = {
  id: LessonId
  calendarId: string
  courseId: string
  unitId: string
  title: string
  sequence: number
  plannedDate: ISODate | null
  datePolicy: LessonDatePolicy
}

export function createLessonId(): LessonId {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `lesson-${token}`
}

export function createLesson(input: {
  id?: LessonId
  calendarId: string
  courseId: string
  unitId: string
  title: string
  sequence: number
  plannedDate?: ISODate | null
  datePolicy?: LessonDatePolicy
}): Lesson {
  const lesson: Lesson = {
    id: input.id ?? createLessonId(),
    calendarId: input.calendarId,
    courseId: input.courseId,
    unitId: input.unitId,
    title: input.title.trim(),
    sequence: input.sequence,
    plannedDate: input.plannedDate ?? null,
    datePolicy: input.datePolicy ?? 'flexible',
  }

  const errors = validateLesson(lesson)
  if (errors.length > 0) throw new Error(`Cannot create Lesson. ${errors.join(' ')}`)
  return lesson
}

export function validateLesson(lesson: Lesson): string[] {
  const errors: string[] = []
  if (!lesson.id.trim()) errors.push('Lesson ID is required.')
  if (!lesson.calendarId.trim()) errors.push('Lesson calendar ID is required.')
  if (!lesson.courseId.trim()) errors.push('Lesson course ID is required.')
  if (!lesson.unitId.trim()) errors.push('Lesson Unit ID is required.')
  if (!lesson.title.trim()) errors.push('Lesson title is required.')
  if (!Number.isInteger(lesson.sequence) || lesson.sequence < 1) errors.push('Lesson sequence must be a positive whole number.')
  if (lesson.datePolicy !== 'flexible' && lesson.datePolicy !== 'fixed') errors.push('Lesson date policy must be flexible or fixed.')
  if (lesson.datePolicy === 'fixed' && !lesson.plannedDate) errors.push('A fixed Lesson needs a planned date.')
  return errors
}

export function validateLessonAgainstUnit(
  lesson: Lesson,
  unit: Unit,
  calendar: SchoolCalendar,
): string[] {
  const errors = validateLesson(lesson)
  if (lesson.unitId !== unit.id) errors.push('Lesson belongs to a different Unit.')
  if (lesson.courseId !== unit.courseId) errors.push('Lesson belongs to a different Course than its Unit.')
  if (lesson.calendarId !== unit.calendarId || lesson.calendarId !== calendar.id) errors.push('Lesson belongs to a different school calendar.')

  if (lesson.plannedDate) {
    if (!unit.placement) {
      errors.push('A Lesson cannot have a planned date until its Unit is placed.')
    } else if (lesson.plannedDate < unit.placement.startDate || lesson.plannedDate > unit.placement.endDate) {
      errors.push('Lesson planned date must stay inside its Unit placement.')
    }

    const day = getCalendarDay(calendar, lesson.plannedDate)
    if (!day || day.kind !== 'instructional' || day.confidence !== 'confirmed') {
      errors.push('Lesson planned date must be a confirmed instructional day.')
    }
  }

  return [...new Set(errors)]
}

export function lessonsForUnit(lessons: Lesson[], unitId: string): Lesson[] {
  return lessons
    .filter((lesson) => lesson.unitId === unitId)
    .slice()
    .sort((a, b) => a.sequence - b.sequence || a.title.localeCompare(b.title))
}
