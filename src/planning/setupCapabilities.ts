import type { SchoolCalendar } from '../calendar'
import type { LessonWorkspace } from './lessonWorkspace'
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
  const blocks = input.planning?.teachingDay?.blocks ?? []
  return {
    calendarEstablished: Boolean(input.calendar),
    coursesEstablished: Boolean(input.planning?.courses.length),
    sectionsEstablished: Boolean(input.planning?.sections.length),
    dayOrderEstablished: blocks.length > 0,
    planningPeriodEstablished: blocks.some((block) => block.type === 'planning'),
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
