import { isConfirmedInstructionalDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { projectDayContinuity } from './dayContinuityProjection'
import { effectiveLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { projectEaselSession, type EaselSessionProjection } from './easelSessionProjection'
import { validateLessonWorkspace, type LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { validateUnitWorkspace, type UnitWorkspace } from './unitWorkspace'
import { validatePlanningWorkspace, type PlanningWorkspace } from './workspace'

export type EaselTeachingOutcome =
  | { kind: 'completed' }
  | { kind: 'stopped'; resumeNote: string }
  | { kind: 'skipped' }

export function applyEaselTeachingOutcome(input: {
  session: EaselSessionProjection
  liveDate: ISODate
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  outcome: EaselTeachingOutcome
}): LessonDeliveryState {
  const { session, liveDate, calendar, planning, units, lessons, overrides, outcome } = input

  if (session.date !== liveDate) {
    throw new Error('Easel refused a teaching outcome from a session that is no longer on the current Day. Return to Day and reopen the Lesson.')
  }
  if (!isConfirmedInstructionalDay(calendar, liveDate)) {
    throw new Error('Easel cannot record a live teaching outcome on a date that is not a confirmed instructional day.')
  }
  validateCanonicalWorkspaces(calendar, planning, units, lessons)

  const lesson = lessons.lessons.find((candidate) => candidate.id === session.lessonId)
  const section = planning.sections.find((candidate) => candidate.id === session.sectionId)
  if (!lesson || !section) {
    throw new Error('Easel refused the teaching outcome because the Lesson or Section no longer exists in Arc.')
  }

  const currentDay = projectDayContinuity({
    date: liveDate,
    planning,
    units,
    lessons,
    overrides,
  })
  let currentSession: EaselSessionProjection
  try {
    currentSession = projectEaselSession({
      day: currentDay,
      sectionId: section.id,
      lessonId: lesson.id,
      calendar,
      liveDate,
    })
  } catch {
    throw new Error('Easel refused to overwrite changed Arc planning state. Return to Day and reopen the Lesson.')
  }
  validateSessionFreshness(session, currentSession)

  const current = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, section)
  validateOutcomeTransition(current, outcome)

  if (outcome.kind === 'stopped') {
    return updateLessonDeliveryState(current, lesson, section, {
      status: 'in-progress',
      taughtDate: liveDate,
      resumeNote: outcome.resumeNote,
    })
  }
  if (outcome.kind === 'completed') {
    return updateLessonDeliveryState(current, lesson, section, {
      status: 'completed',
      taughtDate: liveDate,
      resumeNote: null,
    })
  }
  return updateLessonDeliveryState(current, lesson, section, {
    status: 'skipped',
    taughtDate: null,
    resumeNote: null,
  })
}

function validateCanonicalWorkspaces(
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): void {
  const errors = [
    ...validatePlanningWorkspace(planning),
    ...validateUnitWorkspace(units, calendar, planning),
    ...validateLessonWorkspace(lessons, calendar, planning, units),
  ]
  if (errors.length > 0) {
    throw new Error(`Easel refused the teaching outcome because current Arc state failed integrity checks. ${[...new Set(errors)].join(' ')}`)
  }
}

function validateSessionFreshness(opened: EaselSessionProjection, current: EaselSessionProjection): void {
  const same =
    opened.date === current.date
    && opened.courseId === current.courseId
    && opened.sectionId === current.sectionId
    && opened.lessonId === current.lessonId
    && opened.unitId === current.unitId
    && opened.source === current.source
    && opened.datePolicy === current.datePolicy
    && opened.sharedPlannedDate === current.sharedPlannedDate
    && opened.effectiveDate === current.effectiveDate
    && opened.isSectionOverride === current.isSectionOverride
    && opened.deliveryStatus === current.deliveryStatus
    && opened.taughtDate === current.taughtDate
    && opened.resumeNote === current.resumeNote

  if (!same) {
    throw new Error('Easel refused to overwrite newer or changed Arc state. Return to Day and reopen the Lesson.')
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
