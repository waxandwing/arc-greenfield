import { nextInstructionalDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import type { LessonDeliveryState } from './deliveryState'
import { lessonsForUnit, type Lesson } from './lessons'

export type RecoveryAffectedLesson = {
  lessonId: string
  title: string
  plannedDate: ISODate
  datePolicy: 'flexible' | 'fixed'
  reason: 'resume-date-collision' | 'before-fixed-anchor'
}

export type RecoveryFixedAnchor = {
  lessonId: string
  title: string
  plannedDate: ISODate
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
}): RecoveryPreview {
  const { calendar, section, lesson, state, lessons } = input
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

  const laterLessons = lessonsForUnit(lessons, lesson.unitId)
    .filter((candidate) => candidate.sequence > lesson.sequence && candidate.plannedDate)

  const fixedAnchorLesson = laterLessons.find((candidate) => candidate.datePolicy === 'fixed' && candidate.plannedDate! >= resumeDate) ?? null
  const fixedAnchor: RecoveryFixedAnchor | null = fixedAnchorLesson && fixedAnchorLesson.plannedDate ? {
    lessonId: fixedAnchorLesson.id,
    title: fixedAnchorLesson.title,
    plannedDate: fixedAnchorLesson.plannedDate,
  } : null

  const affectedFlexibleLessons = laterLessons
    .filter((candidate) => candidate.datePolicy === 'flexible' && candidate.plannedDate)
    .filter((candidate) => !fixedAnchor || candidate.plannedDate! <= fixedAnchor.plannedDate)
    .map((candidate): RecoveryAffectedLesson => ({
      lessonId: candidate.id,
      title: candidate.title,
      plannedDate: candidate.plannedDate!,
      datePolicy: 'flexible',
      reason: candidate.plannedDate === resumeDate ? 'resume-date-collision' : 'before-fixed-anchor',
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
