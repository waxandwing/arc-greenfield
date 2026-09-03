import type { ISODate } from '../calendar/types'
import { effectiveLessonDeliveryState } from './deliveryState'
import type { LessonWorkspace } from './lessonWorkspace'
import { projectPlanningRange, type PlanningLessonPlacement } from './planningProjection'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

export type DayContinuityUnit = {
  unitId: string
  title: string
}

export type DayContinuityLesson = PlanningLessonPlacement & {
  unitTitle: string
}

export type DayContinuitySection = {
  sectionId: string
  sectionName: string
  scheduledLessons: DayContinuityLesson[]
  carryovers: DayContinuityLesson[]
}

export type DayContinuityCourse = {
  courseId: string
  courseTitle: string
  activeUnits: DayContinuityUnit[]
  sections: DayContinuitySection[]
}

export type DayContinuityProjection = {
  date: ISODate
  courses: DayContinuityCourse[]
}

export function projectDayContinuity(input: {
  date: ISODate
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
}): DayContinuityProjection {
  const { date, planning, units, lessons, overrides } = input
  const range = projectPlanningRange({ dates: [date], planning, units, lessons, overrides })
  const unitById = new Map(units.units.map((unit) => [unit.id, unit]))
  const lessonById = new Map(lessons.lessons.map((lesson) => [lesson.id, lesson]))

  return {
    date,
    courses: range.courses.map((courseGroup) => ({
      courseId: courseGroup.course.id,
      courseTitle: courseGroup.course.title,
      activeUnits: courseGroup.unitSpans.map((unit) => ({ unitId: unit.unitId, title: unit.title })),
      sections: courseGroup.sections.map((sectionRow) => {
        const scheduledLessons = sectionRow.days[0].lessons.map((lesson) => attachUnitTitle(lesson, unitById))
        const scheduledIds = new Set(scheduledLessons.map((lesson) => lesson.lessonId))
        const carryovers = lessons.lessons
          .filter((lesson) => lesson.courseId === courseGroup.course.id)
          .map((lesson) => ({
            lesson,
            delivery: effectiveLessonDeliveryState(lessons.deliveryStates, lesson, sectionRow.section),
          }))
          .filter(({ delivery }) => delivery.status === 'in-progress' && Boolean(delivery.taughtDate && delivery.taughtDate <= date))
          .filter(({ lesson }) => !scheduledIds.has(lesson.id))
          .map(({ lesson, delivery }): DayContinuityLesson => {
            const unit = unitById.get(lesson.unitId)
            if (!unit) throw new Error(`Day continuity cannot find Unit ${lesson.unitId} for Lesson ${lesson.id}.`)
            const effectiveDate = effectiveLessonDate(lesson, sectionRow.section.id, overrides)
            if (!effectiveDate) throw new Error(`Day continuity cannot carry an in-progress unscheduled Lesson: ${lesson.id}.`)
            return {
              lessonId: lesson.id,
              unitId: lesson.unitId,
              courseId: lesson.courseId,
              title: lesson.title,
              sequence: lesson.sequence,
              datePolicy: lesson.datePolicy,
              sharedPlannedDate: lesson.plannedDate,
              effectiveDate,
              isSectionOverride: effectiveDate !== lesson.plannedDate,
              deliveryStatus: delivery.status,
              taughtDate: delivery.taughtDate,
              resumeNote: delivery.resumeNote,
              unitTitle: unit.title,
            }
          })
          .sort(compareContinuityLessons)

        return {
          sectionId: sectionRow.section.id,
          sectionName: sectionRow.section.name,
          scheduledLessons,
          carryovers,
        }
      }),
    })),
  }
}

function attachUnitTitle(
  lesson: PlanningLessonPlacement,
  unitById: Map<string, UnitWorkspace['units'][number]>,
): DayContinuityLesson {
  const unit = unitById.get(lesson.unitId)
  if (!unit) throw new Error(`Day continuity cannot find Unit ${lesson.unitId} for Lesson ${lesson.lessonId}.`)
  return { ...lesson, unitTitle: unit.title }
}

function compareContinuityLessons(left: DayContinuityLesson, right: DayContinuityLesson): number {
  const leftTaught = left.taughtDate ?? ''
  const rightTaught = right.taughtDate ?? ''
  return rightTaught.localeCompare(leftTaught) || left.sequence - right.sequence || left.title.localeCompare(right.title)
}
