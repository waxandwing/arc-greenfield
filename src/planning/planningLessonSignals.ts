import type { ISODate } from '../calendar/types'
import type { LessonDatePolicy } from './lessons'
import type { PlanningLessonPlacement, PlanningRangeProjection } from './planningProjection'

export type PlanningLessonSectionScope = {
  sectionId: string
  sectionName: string
  isSectionOverride: boolean
  deliveryStatus: PlanningLessonPlacement['deliveryStatus']
}

export type PlanningLessonSignal = {
  lessonId: string
  courseId: string
  courseTitle: string
  title: string
  datePolicy: LessonDatePolicy
  sections: PlanningLessonSectionScope[]
}

export function projectPlanningLessonSignals(range: PlanningRangeProjection, date: ISODate): PlanningLessonSignal[] {
  if (!range.dates.includes(date)) throw new Error(`Cannot project Lesson signals outside visible planning range: ${date}.`)
  const grouped = new Map<string, PlanningLessonSignal>()

  for (const courseGroup of range.courses) {
    for (const sectionRow of courseGroup.sections) {
      const day = sectionRow.days.find((candidate) => candidate.date === date)
      if (!day) continue
      for (const lesson of day.lessons) {
        const key = `${lesson.courseId}:${lesson.lessonId}`
        const signal = grouped.get(key) ?? {
          lessonId: lesson.lessonId,
          courseId: lesson.courseId,
          courseTitle: courseGroup.course.title,
          title: lesson.title,
          datePolicy: lesson.datePolicy,
          sections: [],
        }
        if (signal.sections.some((scope) => scope.sectionId === sectionRow.section.id)) {
          throw new Error(`Planning signal received duplicate Section placement for ${sectionRow.section.id}, ${lesson.lessonId}, ${date}.`)
        }
        signal.sections.push({
          sectionId: sectionRow.section.id,
          sectionName: sectionRow.section.name,
          isSectionOverride: lesson.isSectionOverride,
          deliveryStatus: lesson.deliveryStatus,
        })
        grouped.set(key, signal)
      }
    }
  }

  return [...grouped.values()]
    .map((signal) => ({
      ...signal,
      sections: [...signal.sections].sort((a, b) => a.sectionName.localeCompare(b.sectionName) || a.sectionId.localeCompare(b.sectionId)),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.title.localeCompare(b.title))
}
