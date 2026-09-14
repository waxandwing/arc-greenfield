import type { ISODate } from '../calendar/types'
import { getCalendarDay, isPlannableDayKind } from '../calendar/schoolCalendar'
import type { Lesson } from './lessons'
import { moveLesson, type LessonActionContext } from './objectActions'
import type { PlanningWorkspace } from './workspace'

export type LessonMovePreview = {
  lessonId: string
  title: string
  fromDate: ISODate | null
  toDate: ISODate
  datePolicy: Lesson['datePolicy']
  blockedReason: string | null
  sectionOverridesOnLesson: { sectionId: string; sectionName: string; plannedDate: ISODate }[]
  dayKind: 'instructional' | 'blocked-day' | null
  mutationApplied: false
}

export function createLessonMovePreview(
  input: LessonActionContext & { lessonId: string; plannedDate: ISODate; planning: PlanningWorkspace },
): LessonMovePreview {
  const lesson = input.lessons.lessons.find((candidate) => candidate.id === input.lessonId)
  if (!lesson) throw new Error('Cannot preview Lesson move. That Lesson no longer exists.')

  const day = getCalendarDay(input.calendar, input.plannedDate)
  const dayKind = !day || !isPlannableDayKind(day.kind) || day.confidence !== 'confirmed' ? 'blocked-day' : 'instructional'

  const sectionOverridesOnLesson = input.overrides
    .filter((override) => override.lessonId === input.lessonId)
    .map((override) => ({
      sectionId: override.sectionId,
      sectionName: input.planning.sections.find((section) => section.id === override.sectionId)?.name ?? override.sectionId,
      plannedDate: override.plannedDate,
    }))

  let blockedReason: string | null = null
  if (dayKind === 'blocked-day') {
    blockedReason = day?.label
      ? `Arc cannot move this Lesson to ${input.plannedDate}. ${day.label} is not a confirmed instructional day.`
      : 'Arc cannot move this Lesson to that date because it is not a confirmed instructional day.'
  } else {
    try {
      moveLesson({
        calendar: input.calendar,
        units: input.units,
        lessons: input.lessons,
        overrides: input.overrides,
        lessonId: input.lessonId,
        plannedDate: input.plannedDate,
      })
    } catch (error) {
      blockedReason = error instanceof Error ? error.message : String(error)
    }
  }

  return {
    lessonId: lesson.id,
    title: lesson.title,
    fromDate: lesson.plannedDate,
    toDate: input.plannedDate,
    datePolicy: lesson.datePolicy,
    blockedReason,
    sectionOverridesOnLesson,
    dayKind,
    mutationApplied: false,
  }
}
