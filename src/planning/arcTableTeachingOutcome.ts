import type { ISODate, SchoolCalendar } from '../calendar/types'
import { applyEaselTeachingOutcome, type EaselTeachingOutcome } from './easelTeachingOutcome'
import type { LessonDeliveryState } from './deliveryState'
import type { LessonWorkspace } from './lessonWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { ArcTableSession } from './arcTableSession'

export type ArcTableTeachingOutcome = EaselTeachingOutcome

export function applyArcTableTeachingOutcome(input: {
  session: ArcTableSession
  liveDate: ISODate
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  outcome: ArcTableTeachingOutcome
}): LessonDeliveryState {
  try {
    return applyEaselTeachingOutcome(input)
  } catch (error) {
    if (!(error instanceof Error)) throw error
    throw new Error(error.message.replaceAll('Easel', 'ArcTable'))
  }
}
