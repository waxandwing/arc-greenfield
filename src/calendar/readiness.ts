import { eachCalendarDay } from './dateMath'
import { getCalendarDay, validateSchoolCalendar } from './schoolCalendar'
import type { ISODate, SchoolCalendar } from './types'

export type CalendarReadiness = {
  ready: boolean
  blockingErrors: string[]
  unknownDates: ISODate[]
}

export function assessCalendarReadiness(calendar: SchoolCalendar): CalendarReadiness {
  const blockingErrors = validateSchoolCalendar(calendar)
  const unknownDates = eachCalendarDay(calendar.firstDay, calendar.lastDay).filter(
    (date) => getCalendarDay(calendar, date).kind === 'unknown',
  )

  return {
    ready: blockingErrors.length === 0 && unknownDates.length === 0,
    blockingErrors,
    unknownDates,
  }
}

export function requireCalendarTruth(calendar: SchoolCalendar): void {
  const readiness = assessCalendarReadiness(calendar)
  if (readiness.ready) return

  const unknownSummary = readiness.unknownDates.length > 0
    ? `${readiness.unknownDates.length} calendar day(s) are still unknown.`
    : ''

  throw new Error(
    ['School calendar is not safe for structural planning operations.', ...readiness.blockingErrors, unknownSummary]
      .filter(Boolean)
      .join(' '),
  )
}
