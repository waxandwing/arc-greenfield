import { isConfirmedInstructionalDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { DayContinuityLesson, DayContinuityProjection } from './dayContinuityProjection'

export type LiveLaunchSource = 'scheduled' | 'carryover'

export type LiveLaunchOption = {
  sectionId: string
  lessonId: string
  title: string
  unitTitle: string
  source: LiveLaunchSource
  deliveryStatus: DayContinuityLesson['deliveryStatus']
  resumeNote: string | null
}

export type LiveClassroomSession = {
  date: ISODate
  courseId: string
  courseTitle: string
  sectionId: string
  sectionName: string
  lessonId: string
  lessonTitle: string
  unitId: string
  unitTitle: string
  source: LiveLaunchSource
  datePolicy: DayContinuityLesson['datePolicy']
  sharedPlannedDate: ISODate | null
  effectiveDate: ISODate | null
  isSectionOverride: boolean
  deliveryStatus: DayContinuityLesson['deliveryStatus']
  taughtDate: ISODate | null
  resumeNote: string | null
}

export function liveLaunchOptions(input: {
  day: DayContinuityProjection
  sectionId: string
  calendar: SchoolCalendar
  liveDate: ISODate
}): LiveLaunchOption[] {
  const { day, sectionId, calendar, liveDate } = input
  validateLiveTeachingDay(day, calendar, liveDate)
  const located = locateSection(day, sectionId)
  if (!located) throw new Error(`Arc cannot find Section ${sectionId} in the selected Day.`)

  const seen = new Set<string>()
  const options: LiveLaunchOption[] = []
  for (const [source, lessons] of [
    ['carryover', located.section.carryovers],
    ['scheduled', located.section.scheduledLessons],
  ] as const) {
    for (const lesson of lessons) {
      if (!isLiveTeachingStatus(lesson.deliveryStatus)) continue
      if (seen.has(lesson.lessonId)) throw new Error(`Live Classroom found duplicate Lesson ${lesson.lessonId} for Section ${sectionId}.`)
      seen.add(lesson.lessonId)
      options.push({
        sectionId,
        lessonId: lesson.lessonId,
        title: lesson.title,
        unitTitle: lesson.unitTitle,
        source,
        deliveryStatus: lesson.deliveryStatus,
        resumeNote: lesson.resumeNote,
      })
    }
  }
  return options
}

export function projectLiveClassroomSession(input: {
  day: DayContinuityProjection
  sectionId: string
  lessonId: string
  calendar: SchoolCalendar
  liveDate: ISODate
}): LiveClassroomSession {
  const { day, sectionId, lessonId, calendar, liveDate } = input
  validateLiveTeachingDay(day, calendar, liveDate)
  const located = locateSection(day, sectionId)
  if (!located) throw new Error(`Arc cannot find Section ${sectionId} in the selected Day.`)

  const candidates = [
    ...located.section.carryovers.map((lesson) => ({ source: 'carryover' as const, lesson })),
    ...located.section.scheduledLessons.map((lesson) => ({ source: 'scheduled' as const, lesson })),
  ].filter((candidate) => candidate.lesson.lessonId === lessonId)

  if (candidates.length === 0) throw new Error(`Live Classroom cannot open Lesson ${lessonId} because it is no longer part of Section ${sectionId} continuity for ${day.date}.`)
  if (candidates.length > 1) throw new Error(`Live Classroom cannot open duplicate Lesson ${lessonId} context for Section ${sectionId}.`)

  const { source, lesson } = candidates[0]
  if (!isLiveTeachingStatus(lesson.deliveryStatus)) throw new Error(`Live Classroom cannot reopen ${lesson.deliveryStatus} teaching history for Lesson ${lessonId}.`)

  return {
    date: day.date,
    courseId: located.course.courseId,
    courseTitle: located.course.courseTitle,
    sectionId,
    sectionName: located.section.sectionName,
    lessonId: lesson.lessonId,
    lessonTitle: lesson.title,
    unitId: lesson.unitId,
    unitTitle: lesson.unitTitle,
    source,
    datePolicy: lesson.datePolicy,
    sharedPlannedDate: lesson.sharedPlannedDate,
    effectiveDate: lesson.effectiveDate,
    isSectionOverride: lesson.isSectionOverride,
    deliveryStatus: lesson.deliveryStatus,
    taughtDate: lesson.taughtDate,
    resumeNote: lesson.resumeNote,
  }
}

function validateLiveTeachingDay(day: DayContinuityProjection, calendar: SchoolCalendar, liveDate: ISODate): void {
  if (day.date !== liveDate) throw new Error('Live Classroom can open only from the current Day. Use Arc to review past or future planning dates.')
  if (!isConfirmedInstructionalDay(calendar, liveDate)) throw new Error('Live Classroom requires a confirmed instructional day.')
}

function isLiveTeachingStatus(status: DayContinuityLesson['deliveryStatus']): boolean {
  return status === 'not-started' || status === 'in-progress'
}

function locateSection(day: DayContinuityProjection, sectionId: string) {
  for (const course of day.courses) {
    const section = course.sections.find((candidate) => candidate.sectionId === sectionId)
    if (section) return { course, section }
  }
  return null
}
