import type { ISODate, SchoolCalendar } from '../calendar/types'
import {
  easelLaunchOptions,
  projectEaselSession,
  type EaselLaunchOption,
  type EaselSessionProjection,
} from './easelSessionProjection'
import type { DayContinuityProjection } from './dayContinuityProjection'

export type ArcTableLaunchOption = EaselLaunchOption
export type ArcTableSession = EaselSessionProjection

export function arcTableLaunchOptions(input: {
  day: DayContinuityProjection
  sectionId: string
  calendar: SchoolCalendar
  liveDate: ISODate
}): ArcTableLaunchOption[] {
  return translateErrors(() => easelLaunchOptions(input))
}

export function projectArcTableSession(input: {
  day: DayContinuityProjection
  sectionId: string
  lessonId: string
  calendar: SchoolCalendar
  liveDate: ISODate
}): ArcTableSession {
  return translateErrors(() => projectEaselSession(input))
}

function translateErrors<T>(operation: () => T): T {
  try {
    return operation()
  } catch (error) {
    if (!(error instanceof Error)) throw error
    throw new Error(error.message.replaceAll('Easel', 'ArcTable'))
  }
}
