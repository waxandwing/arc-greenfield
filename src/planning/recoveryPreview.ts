import { nextInstructionalDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import { effectiveLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import type { Lesson } from './lessons'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'

export type RecoveryAffectedLesson = {
  lessonId: string
  title: string
  effectiveDate: ISODate
  reason: 'resume-date-collision' | 'before-fixed-anchor'
}

export type RecoveryFixedAnchor = {
  lessonId: string
  title: string
  effectiveDate: ISODate
}

export type RecoveryPreview = {
  sectionId: string
  interruptedLessonId: string
  resumeDate: ISODate | null
  resumeNote: string
  affectedFlexibleLessons: RecoveryAffectedLesson[]
  fixedAnchor: RecoveryFixedAnchor | null
  blockedReason: string | null
  mutationApplied: false
}

export function createRecoveryPreview(input: {
  calendar: SchoolCalendar
  section: Section
  lesson: Lesson
  state: LessonDeliveryState
  lessons: Lesson[]
  deliveryStates?: LessonDeliveryState[]
  overrides?: SectionLessonDateOverride[]
}): RecoveryPreview {
  const { calendar, section, lesson, state, lessons, deliveryStates = [], overrides = [] } = input
  const ownershipErrors = validateRecoverySource(section, lesson, state)
  if (ownershipErrors.length > 0) throw new Error(`Cannot preview recovery. ${ownershipErrors.join(' ')}`)

  const resumeDate = state.taughtDate ? nextInstructionalDay(calendar, state.taughtDate) : null
  if (!resumeDate) {
    return {
      sectionId: section.id,
      interruptedLessonId: lesson.id,
      resumeDate: null,
      resumeNote: state.resumeNote!,
      affectedFlexibleLessons: [],
      fixedAnchor: null,
      blockedReason: 'There is no confirmed instructional day after the interruption inside the loaded school year.',
      mutationApplied: false,
    }
  }

  const futureCoursePlan = lessons
    .filter((candidate) => candidate.id !== lesson.id && candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)
    .filter((candidate) => {
      const delivery = effectiveLessonDeliveryState(deliveryStates, candidate, section)
      return delivery.status !== 'completed' && delivery.status !== 'skipped'
    })
    .map((candidate) => ({ lesson: candidate, date: effectiveLessonDate(candidate, section.id, overrides) }))
    .filter((entry): entry is { lesson: Lesson; date: ISODate } => Boolean(entry.date && entry.date >= resumeDate))
    .sort((a, b) => a.date.localeCompare(b.date) || a.lesson.sequence - b.lesson.sequence || a.lesson.title.localeCompare(b.lesson.title))

  const fixedEntry = futureCoursePlan.find((entry) => entry.lesson.datePolicy === 'fixed') ?? null
  const fixedAnchor: RecoveryFixedAnchor | null = fixedEntry ? {
    lessonId: fixedEntry.lesson.id,
    title: fixedEntry.lesson.title,
    effectiveDate: fixedEntry.date,
  } : null

  const affectedFlexibleLessons = futureCoursePlan
    .filter((entry) => entry.lesson.datePolicy === 'flexible')
    .filter((entry) => !fixedAnchor || entry.date <= fixedAnchor.effectiveDate)
    .map((entry): RecoveryAffectedLesson => ({
      lessonId: entry.lesson.id,
      title: entry.lesson.title,
      effectiveDate: entry.date,
      reason: entry.date === resumeDate ? 'resume-date-collision' : 'before-fixed-anchor',
    }))

  return {
    sectionId: section.id,
    interruptedLessonId: lesson.id,
    resumeDate,
    resumeNote: state.resumeNote!,
    affectedFlexibleLessons,
    fixedAnchor,
    blockedReason: null,
    mutationApplied: false,
  }
}

function validateRecoverySource(
  section: Section,
  lesson: Lesson,
  state: LessonDeliveryState,
): string[] {
  const errors: string[] = []
  if (state.status !== 'in-progress') errors.push('Recovery preview requires an in-progress Lesson.')
  if (!state.taughtDate) errors.push('Recovery preview requires the actual interruption date.')
  if (!state.resumeNote?.trim()) errors.push('Recovery preview requires the saved resume note.')
  if (state.lessonId !== lesson.id) errors.push('Delivery state belongs to a different Lesson.')
  if (state.sectionId !== section.id) errors.push('Delivery state belongs to a different Section.')
  if (lesson.courseId !== section.courseId) errors.push('Lesson and Section belong to different Courses.')
  if (lesson.calendarId !== section.calendarId) errors.push('Lesson and Section belong to different school calendars.')
  return errors
}
