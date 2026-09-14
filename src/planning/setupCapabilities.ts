import type { SchoolCalendar } from '../calendar'
import type { LessonWorkspace } from './lessonWorkspace'
import { periodNumber } from './teachingDayRail'
import type { PlanningWorkspace } from './workspace'
import { teachingDayHasBellTimes } from './teachingDay'

export type SetupCapability =
  | 'calendarEstablished'
  | 'coursesEstablished'
  | 'sectionsEstablished'
  | 'dayOrderEstablished'
  | 'planningPeriodEstablished'
  | 'bellTimesEstablished'
  | 'curriculumEstablished'
  | 'profileEstablished'

export type SetupCapabilities = Record<SetupCapability, boolean>

export function assessSetupCapabilities(input: {
  calendar: SchoolCalendar | null
  planning: PlanningWorkspace | null
  lessons: LessonWorkspace | null
  profileEstablished?: boolean
}): SetupCapabilities {
  const sections = input.planning?.sections ?? []
  const blocks = input.planning?.teachingDay?.blocks ?? []
  const legacyDayReady = legacyTeachingDayUsable(sections)
  return {
    calendarEstablished: Boolean(input.calendar),
    coursesEstablished: Boolean(input.planning?.courses.length),
    sectionsEstablished: sections.length > 0,
    dayOrderEstablished: blocks.length > 0 || legacyDayReady,
    planningPeriodEstablished: blocks.some((block) => block.type === 'planning') || legacyTeachingDayHasPlanningPeriod(sections),
    bellTimesEstablished: teachingDayHasBellTimes(input.planning?.teachingDay),
    curriculumEstablished: Boolean(input.lessons?.lessons.length),
    profileEstablished: Boolean(input.profileEstablished),
  }
}

export function minimumPlanningSetupEstablished(capabilities: SetupCapabilities): boolean {
  return capabilities.calendarEstablished
    && capabilities.coursesEstablished
    && capabilities.sectionsEstablished
    && capabilities.dayOrderEstablished
    && capabilities.planningPeriodEstablished
}

/** Implicit period rail (sections + gap) counts as a usable teaching day for everyday surfaces. */
export function legacyTeachingDayHasPlanningPeriod(sections: PlanningWorkspace['sections']): boolean {
  const numbers = sections.map((section) => periodNumber(section.name)).filter((number) => Number.isFinite(number))
  if (numbers.length === 0) return false
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  return max - min + 1 > numbers.length
}

function legacyTeachingDayUsable(sections: PlanningWorkspace['sections']): boolean {
  return sections.length > 0 && legacyTeachingDayHasPlanningPeriod(sections)
}

export function nextRequiredSetupCapability(capabilities: SetupCapabilities): SetupCapability | null {
  const order: SetupCapability[] = [
    'calendarEstablished',
    'coursesEstablished',
    'sectionsEstablished',
    'dayOrderEstablished',
    'planningPeriodEstablished',
  ]
  return order.find((capability) => !capabilities[capability]) ?? null
}
