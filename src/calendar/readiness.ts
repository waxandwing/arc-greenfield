import { eachCalendarDay } from './dateMath'
import { getCalendarDay, validateSchoolCalendar } from './schoolCalendar'
import type { ISODate, SchoolCalendar } from './types'

export type CalendarReadiness = {
  ready: boolean
  blockingErrors: string[]
  unknownDates: ISODate[]
  unconfirmedDates: ISODate[]
}

export function assessCalendarReadiness(calendar: SchoolCalendar): CalendarReadiness {
  const blockingErrors = validateSchoolCalendar(calendar)
  const dates = eachCalendarDay(calendar.firstDay, calendar.lastDay)
  const unknownDates = dates.filter((date) => getCalendarDay(calendar, date).kind === 'unknown')
  const unconfirmedDates = dates.filter((date) => getCalendarDay(calendar, date).confidence !== 'confirmed')

  return {
    ready: blockingErrors.length === 0 && unknownDates.length === 0 && unconfirmedDates.length === 0,
    blockingErrors,
    unknownDates,
    unconfirmedDates,
  }
}

export function requireCalendarTruth(calendar: SchoolCalendar): void {
  const readiness = assessCalendarReadiness(calendar)
  if (readiness.ready) return

  const unknownSummary = readiness.unknownDates.length > 0
    ? `${readiness.unknownDates.length} calendar day(s) are still unknown.`
    : ''
  const unconfirmedSummary = readiness.unconfirmedDates.length > 0
    ? `${readiness.unconfirmedDates.length} calendar day(s) are not yet confirmed.`
    : ''

  throw new Error(
    [
      'School calendar is not safe for structural planning operations.',
      ...readiness.blockingErrors,
      unknownSummary,
      unconfirmedSummary,
    ]
      .filter(Boolean)
      .join(' '),
  )
}
