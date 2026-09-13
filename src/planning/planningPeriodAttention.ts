import { compareISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'
import type { PlanNavigationContext } from '../calendar/navigationContext'
import type { CalendarView } from '../navigation/calendarViews'
import { effectiveLessonDeliveryState } from './deliveryState'
import type { DayContinuityProjection } from './dayContinuityProjection'
import type { CaptureWorkspace } from './captureWorkspace'
import type { Lesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

export type PlanningPeriodAttentionBucket = 'now' | 'needs-attention' | 'next-planned'

export type PlanningPeriodAttentionKind =
  | 'scheduled-today'
  | 'stopped-lesson'
  | 'section-behind'
  | 'next-planned-lesson'

export type PlanningPeriodAttentionTarget = {
  view: CalendarView
  anchorDate: ISODate
  focus: PlanNavigationContext['focus']
  courseId: string
  sectionId?: string
  unitId?: string
  lessonId?: string
}

export type PlanningPeriodAttentionItem = {
  id: string
  bucket: PlanningPeriodAttentionBucket
  kind: PlanningPeriodAttentionKind
  courseId: string
  courseTitle: string
  sectionId: string | null
  sectionName: string | null
  lessonId: string | null
  lessonTitle: string | null
  reason: string
  target: PlanningPeriodAttentionTarget
}

export type PlanningPeriodAttentionProjection = {
  date: ISODate
  buckets: Record<PlanningPeriodAttentionBucket, PlanningPeriodAttentionItem[]>
}

export function projectPlanningPeriodAttention(input: {
  date: ISODate
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  captures: CaptureWorkspace | null
  overrides: SectionLessonDateOverride[]
  continuity: DayContinuityProjection
}): PlanningPeriodAttentionProjection {
  const { date, planning, lessons, overrides, continuity } = input
  const buckets: PlanningPeriodAttentionProjection['buckets'] = {
    'now': [],
    'needs-attention': [],
    'next-planned': [],
  }
  const seen = new Set<string>()

  function push(item: PlanningPeriodAttentionItem) {
    if (seen.has(item.id)) return
    seen.add(item.id)
    buckets[item.bucket].push(item)
  }

  for (const course of continuity.courses) {
    const courseSections = planning.sections.filter((section) => section.courseId === course.courseId)
    const courseLessons = lessons.lessons
      .filter((lesson) => lesson.courseId === course.courseId)
      .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id))

    for (const sectionRow of course.sections) {
      for (const lesson of sectionRow.scheduledLessons) {
        push({
          id: `now:${sectionRow.sectionId}:${lesson.lessonId}`,
          bucket: 'now',
          kind: 'scheduled-today',
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          sectionId: sectionRow.sectionId,
          sectionName: sectionRow.sectionName,
          lessonId: lesson.lessonId,
          lessonTitle: lesson.title,
          reason: `On today’s plan for ${sectionRow.sectionName}.`,
          target: dayClassTarget(date, course.courseId, sectionRow.sectionId, lesson.unitId),
        })
      }

      for (const lesson of sectionRow.carryovers) {
        if (lesson.deliveryStatus !== 'in-progress' || !lesson.resumeNote?.trim()) continue
        push({
          id: `stopped:${sectionRow.sectionId}:${lesson.lessonId}`,
          bucket: 'needs-attention',
          kind: 'stopped-lesson',
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          sectionId: sectionRow.sectionId,
          sectionName: sectionRow.sectionName,
          lessonId: lesson.lessonId,
          lessonTitle: lesson.title,
          reason: lesson.resumeNote.trim(),
          target: dayLessonTarget(date, course.courseId, sectionRow.sectionId, lesson.lessonId, lesson.unitId),
        })
      }
    }

    for (const section of courseSections) {
      const behind = sectionBehindCoursePlan({
        date,
        section,
        courseSections,
        courseLessons,
        lessons,
        overrides,
      })
      if (!behind) continue
      push({
        id: `behind:${section.id}:${behind.lesson.id}`,
        bucket: 'needs-attention',
        kind: 'section-behind',
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        sectionId: section.id,
        sectionName: section.name,
        lessonId: behind.lesson.id,
        lessonTitle: behind.lesson.title,
        reason: `${section.name} is still on ${behind.lesson.title} while the course plan moved to ${behind.leadingTitle}.`,
        target: weekClassTarget(date, course.courseId, section.id, behind.lesson.unitId),
      })
    }

    for (const section of courseSections) {
      const next = nextPlannedLessonForSection({
        date,
        section,
        courseLessons,
        lessons,
        overrides,
      })
      if (!next) continue
      push({
        id: `next:${section.id}:${next.lesson.id}`,
        bucket: 'next-planned',
        kind: 'next-planned-lesson',
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        sectionId: section.id,
        sectionName: section.name,
        lessonId: next.lesson.id,
        lessonTitle: next.lesson.title,
        reason: next.whenLabel,
        target: dayLessonTarget(next.anchorDate, course.courseId, section.id, next.lesson.id, next.lesson.unitId),
      })
    }
  }

  for (const bucket of Object.keys(buckets) as PlanningPeriodAttentionBucket[]) {
    buckets[bucket].sort(compareAttentionItems)
  }

  return { date, buckets }
}

export function resolvePlanningAttentionTarget(
  context: PlanNavigationContext,
  target: PlanningPeriodAttentionTarget,
): PlanNavigationContext {
  return {
    schemaVersion: context.schemaVersion,
    calendarId: context.calendarId,
    view: target.view,
    anchorDate: target.anchorDate,
    focus: target.focus,
    courseId: target.courseId,
    sectionId: target.sectionId,
    unitId: target.unitId,
    lessonId: target.lessonId,
  }
}

function sectionBehindCoursePlan(input: {
  date: ISODate
  section: PlanningWorkspace['sections'][number]
  courseSections: PlanningWorkspace['sections']
  courseLessons: Lesson[]
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
}): { lesson: Lesson; leadingTitle: string } | null {
  const { date, section, courseSections, courseLessons, lessons, overrides } = input
  let leading: Lesson | null = null
  for (const lesson of courseLessons) {
    if (!lesson.plannedDate || compareISODate(lesson.plannedDate, date) > 0) continue
    const completedSomewhere = courseSections.some((candidate) => {
      const delivery = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, candidate)
      return delivery.status === 'completed'
    })
    if (completedSomewhere && (!leading || lesson.sequence > leading.sequence)) leading = lesson
  }
  if (!leading) return null

  const sectionLeadingDelivery = effectiveLessonDeliveryState(lessons.deliveryStates, leading, section)
  if (sectionLeadingDelivery.status === 'completed' || sectionLeadingDelivery.status === 'skipped') return null

  for (const lesson of courseLessons) {
    if (lesson.sequence > leading.sequence) break
    const delivery = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, section)
    if (delivery.status === 'completed' || delivery.status === 'skipped') continue
    const effectiveDate = effectiveLessonDate(lesson, section.id, overrides)
    const stillDue = effectiveDate === null || compareISODate(effectiveDate, date) <= 0
    if (!stillDue) continue
    return { lesson, leadingTitle: leading.title }
  }

  return null
}

function nextPlannedLessonForSection(input: {
  date: ISODate
  section: PlanningWorkspace['sections'][number]
  courseLessons: Lesson[]
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
}): { lesson: Lesson; anchorDate: ISODate; whenLabel: string } | null {
  const candidates = input.courseLessons
    .map((lesson) => ({
      lesson,
      effectiveDate: effectiveLessonDate(lesson, input.section.id, input.overrides),
      delivery: effectiveLessonDeliveryState(input.lessons.deliveryStates, lesson, input.section),
    }))
    .filter(({ delivery }) => delivery.status !== 'completed' && delivery.status !== 'skipped')
    .filter(({ effectiveDate }) => effectiveDate !== null && compareISODate(effectiveDate, input.date) > 0)
    .sort((a, b) => compareISODate(a.effectiveDate!, b.effectiveDate!) || a.lesson.sequence - b.lesson.sequence)

  const next = candidates[0]
  if (!next?.effectiveDate) return null
  return {
    lesson: next.lesson,
    anchorDate: next.effectiveDate,
    whenLabel: `Planned ${next.effectiveDate}.`,
  }
}

function dayClassTarget(date: ISODate, courseId: string, sectionId: string, unitId: string): PlanningPeriodAttentionTarget {
  return { view: 'Day', anchorDate: date, focus: 'class', courseId, sectionId, unitId }
}

function dayLessonTarget(date: ISODate, courseId: string, sectionId: string, lessonId: string, unitId: string): PlanningPeriodAttentionTarget {
  return { view: 'Day', anchorDate: date, focus: 'lesson', courseId, sectionId, lessonId, unitId }
}

function weekClassTarget(date: ISODate, courseId: string, sectionId: string, unitId: string): PlanningPeriodAttentionTarget {
  return { view: 'Week', anchorDate: date, focus: 'class', courseId, sectionId, unitId }
}

function compareAttentionItems(a: PlanningPeriodAttentionItem, b: PlanningPeriodAttentionItem): number {
  return a.courseTitle.localeCompare(b.courseTitle)
    || (a.sectionName ?? '').localeCompare(b.sectionName ?? '')
    || (a.lessonTitle ?? '').localeCompare(b.lessonTitle ?? '')
    || a.id.localeCompare(b.id)
}
