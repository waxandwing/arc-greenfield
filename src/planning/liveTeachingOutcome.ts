import { isConfirmedInstructionalDay } from '../calendar/schoolCalendar'
import type { ISODate, SchoolCalendar } from '../calendar/types'
import { projectDayContinuity } from './dayContinuityProjection'
import { effectiveLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { projectLiveClassroomSession, type LiveClassroomSession } from './liveSessionProjection'
import { validateLessonWorkspace, type LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { validateUnitWorkspace, type UnitWorkspace } from './unitWorkspace'
import { validatePlanningWorkspace, type PlanningWorkspace } from './workspace'

export type LiveTeachingOutcome =
  | { kind: 'completed' }
  | { kind: 'stopped'; resumeNote: string }
  | { kind: 'skipped' }

export function applyLiveTeachingOutcome(input: {
  session: LiveClassroomSession
  liveDate: ISODate
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  outcome: LiveTeachingOutcome
}): LessonDeliveryState {
  const { session, liveDate, calendar, planning, units, lessons, overrides, outcome } = input

  if (session.date !== liveDate) throw new Error('Live Classroom refused an outcome from a session that is no longer on the current Day. Return to Day and reopen the Lesson.')
  if (!isConfirmedInstructionalDay(calendar, liveDate)) throw new Error('Live Classroom cannot record a teaching outcome on a date that is not a confirmed instructional day.')

  const errors = [
    ...validatePlanningWorkspace(planning),
    ...validateUnitWorkspace(units, calendar, planning),
    ...validateLessonWorkspace(lessons, calendar, planning, units),
  ]
  if (errors.length > 0) throw new Error(`Live Classroom refused the outcome because current Arc state failed integrity checks. ${[...new Set(errors)].join(' ')}`)

  const lesson = lessons.lessons.find((candidate) => candidate.id === session.lessonId)
  const section = planning.sections.find((candidate) => candidate.id === session.sectionId)
  if (!lesson || !section) throw new Error('Live Classroom refused the outcome because the Lesson or Section no longer exists in Arc.')

  const currentDay = projectDayContinuity({ date: liveDate, planning, units, lessons, overrides })
  let currentSession: LiveClassroomSession
  try {
    currentSession = projectLiveClassroomSession({ day: currentDay, sectionId: section.id, lessonId: lesson.id, calendar, liveDate })
  } catch {
    throw new Error('Live Classroom refused to overwrite changed Arc planning state. Return to Day and reopen the Lesson.')
  }
  validateSessionFreshness(session, currentSession)

  const current = effectiveLessonDeliveryState(lessons.deliveryStates, lesson, section)
  if (current.status === 'completed' || current.status === 'skipped') throw new Error('Live Classroom cannot rewrite completed or skipped teaching history.')
  if (current.status === 'in-progress' && outcome.kind === 'skipped') throw new Error('Live Classroom cannot mark already-started teaching as skipped. Save where the class stopped or complete the Lesson.')

  if (outcome.kind === 'stopped') {
    if (!outcome.resumeNote.trim()) throw new Error('Stop here needs a resume note so Arc can hold your place.')
    return updateLessonDeliveryState(current, lesson, section, { status: 'in-progress', taughtDate: liveDate, resumeNote: outcome.resumeNote })
  }
  if (outcome.kind === 'completed') {
    return updateLessonDeliveryState(current, lesson, section, { status: 'completed', taughtDate: liveDate, resumeNote: null })
  }
  return updateLessonDeliveryState(current, lesson, section, { status: 'skipped', taughtDate: null, resumeNote: null })
}

function validateSessionFreshness(opened: LiveClassroomSession, current: LiveClassroomSession): void {
  const same = opened.date === current.date
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

  if (!same) throw new Error('Live Classroom refused to overwrite newer or changed Arc state. Return to Day and reopen the Lesson.')
}
