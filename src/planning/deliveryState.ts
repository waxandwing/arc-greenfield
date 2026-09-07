import type { ISODate } from '../calendar/types'
import type { Section } from './courses'
import type { Lesson } from './lessons'

export type DeliveryStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped'

export type LessonDeliveryState = {
  lessonId: string
  sectionId: string
  status: DeliveryStatus
  taughtDate: ISODate | null
  resumeNote: string | null
}

export function createLessonDeliveryState(input: {
  lesson: Lesson
  section: Section
}): LessonDeliveryState {
  const state: LessonDeliveryState = {
    lessonId: input.lesson.id,
    sectionId: input.section.id,
    status: 'not-started',
    taughtDate: null,
    resumeNote: null,
  }
  const errors = validateDeliveryOwnership(state, input.lesson, input.section)
  if (errors.length > 0) throw new Error(`Cannot create delivery state. ${errors.join(' ')}`)
  return state
}

export function effectiveLessonDeliveryState(
  states: LessonDeliveryState[],
  lesson: Lesson,
  section: Section,
): LessonDeliveryState {
  return deliveryStateFor(states, lesson.id, section.id) ?? createLessonDeliveryState({ lesson, section })
}

export function updateLessonDeliveryState(
  current: LessonDeliveryState,
  lesson: Lesson,
  section: Section,
  update: {
    status: DeliveryStatus
    taughtDate?: ISODate | null
    resumeNote?: string | null
  },
): LessonDeliveryState {
  const next: LessonDeliveryState = {
    ...current,
    status: update.status,
    taughtDate: update.taughtDate === undefined ? current.taughtDate : update.taughtDate,
    resumeNote: update.resumeNote === undefined ? current.resumeNote : normalizeNote(update.resumeNote),
  }

  if (next.status === 'not-started') {
    next.taughtDate = null
    next.resumeNote = null
  }
  if (next.status === 'completed' || next.status === 'skipped') {
    next.resumeNote = null
  }
  if (next.status === 'skipped') {
    next.taughtDate = null
  }

  const errors = validateLessonDeliveryState(next, lesson, section)
  if (errors.length > 0) throw new Error(`Cannot update delivery state. ${errors.join(' ')}`)
  return next
}

export function validateLessonDeliveryState(
  state: LessonDeliveryState,
  lesson: Lesson,
  section: Section,
): string[] {
  const errors = validateDeliveryOwnership(state, lesson, section)
  if (state.status === 'in-progress' && !state.resumeNote) {
    errors.push('An in-progress Lesson needs a resume note so Arc can hold the teacher’s place.')
  }
  if ((state.status === 'in-progress' || state.status === 'completed') && !state.taughtDate) {
    errors.push('An in-progress or completed Lesson needs the actual teaching date.')
  }
  if (state.status === 'not-started' && (state.taughtDate || state.resumeNote)) {
    errors.push('A not-started Lesson cannot carry teaching progress.')
  }
  return [...new Set(errors)]
}

export function deliveryStateFor(
  states: LessonDeliveryState[],
  lessonId: string,
  sectionId: string,
): LessonDeliveryState | null {
  return states.find((state) => state.lessonId === lessonId && state.sectionId === sectionId) ?? null
}

function validateDeliveryOwnership(
  state: LessonDeliveryState,
  lesson: Lesson,
  section: Section,
): string[] {
  const errors: string[] = []
  if (state.lessonId !== lesson.id) errors.push('Delivery state belongs to a different Lesson.')
  if (state.sectionId !== section.id) errors.push('Delivery state belongs to a different Section.')
  if (section.courseId !== lesson.courseId) errors.push('Section and Lesson belong to different Courses.')
  if (section.calendarId !== lesson.calendarId) errors.push('Section and Lesson belong to different school calendars.')
  return errors
}

function normalizeNote(note: string | null): string | null {
  if (note === null) return null
  const trimmed = note.trim()
  return trimmed.length > 0 ? trimmed : null
}
