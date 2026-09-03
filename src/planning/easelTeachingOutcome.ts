import { isConfirmedInstructionalDay } from '../calendar/schoolCalendar'
import type { SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import { effectiveLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import type { EaselSessionProjection } from './easelSessionProjection'
import type { Lesson } from './lessons'

export type EaselTeachingOutcome =
  | { kind: 'completed' }
  | { kind: 'stopped'; resumeNote: string }
  | { kind: 'skipped' }

export function applyEaselTeachingOutcome(input: {
  session: EaselSessionProjection
  calendar: SchoolCalendar
  lesson: Lesson
  section: Section
  deliveryStates: LessonDeliveryState[]
  outcome: EaselTeachingOutcome
}): LessonDeliveryState {
  const { session, calendar, lesson, section, deliveryStates, outcome } = input
  validateSessionIdentity(session, calendar, lesson, section)

  const current = effectiveLessonDeliveryState(deliveryStates, lesson, section)
  validateSessionFreshness(session, current)
  validateOutcomeTransition(current, outcome)

  if ((outcome.kind === 'completed' || outcome.kind === 'stopped') && !isConfirmedInstructionalDay(calendar, session.date)) {
    throw new Error('Easel cannot record teaching progress on a date that is not a confirmed instructional day.')
  }

  if (outcome.kind === 'stopped') {
    return updateLessonDeliveryState(current, lesson, section, {
      status: 'in-progress',
      taughtDate: session.date,
      resumeNote: outcome.resumeNote,
    })
  }
  if (outcome.kind === 'completed') {
    return updateLessonDeliveryState(current, lesson, section, {
      status: 'completed',
      taughtDate: session.date,
      resumeNote: null,
    })
  }
  return updateLessonDeliveryState(current, lesson, section, {
    status: 'skipped',
    taughtDate: null,
    resumeNote: null,
  })
}

function validateSessionIdentity(
  session: EaselSessionProjection,
  calendar: SchoolCalendar,
  lesson: Lesson,
  section: Section,
): void {
  const errors: string[] = []
  if (session.lessonId !== lesson.id) errors.push('Easel session belongs to a different Lesson.')
  if (session.sectionId !== section.id) errors.push('Easel session belongs to a different Section.')
  if (session.courseId !== lesson.courseId || session.courseId !== section.courseId) errors.push('Easel session Course ownership no longer matches Arc.')
  if (session.unitId !== lesson.unitId) errors.push('Easel session Unit ownership no longer matches Arc.')
  if (lesson.calendarId !== section.calendarId || lesson.calendarId !== calendar.id) errors.push('Easel session calendar ownership no longer matches Arc.')
  if (errors.length > 0) throw new Error(`Easel refused the teaching outcome. ${errors.join(' ')}`)
}

function validateSessionFreshness(session: EaselSessionProjection, current: LessonDeliveryState): void {
  if (
    current.status !== session.deliveryStatus
    || current.taughtDate !== session.taughtDate
    || current.resumeNote !== session.resumeNote
  ) {
    throw new Error('Easel refused to overwrite newer Arc teaching state. Return to Day and reopen the Lesson.')
  }
}

function validateOutcomeTransition(current: LessonDeliveryState, outcome: EaselTeachingOutcome): void {
  if (current.status === 'completed' || current.status === 'skipped') {
    throw new Error('Easel cannot rewrite completed or skipped teaching history. Return to Arc to review the record.')
  }
  if (current.status === 'in-progress' && outcome.kind === 'skipped') {
    throw new Error('Easel cannot mark already-started teaching as skipped. Save where the class stopped or complete the Lesson.')
  }
}
