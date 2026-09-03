import type { ISODate } from '../calendar/types'

export function formatPlanningWeekday(date: ISODate): string {
  return planningDateFormatter({ weekday: 'short' }).format(toUTCDate(date))
}

export function formatPlanningShortDate(date: ISODate): string {
  return planningDateFormatter({ month: 'short', day: 'numeric' }).format(toUTCDate(date))
}

export function formatPlanningLongDate(date: ISODate): string {
  return planningDateFormatter({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(toUTCDate(date))
}

export function formatPlanningMonthKey(monthKey: `${number}-${number}`): string {
  return planningDateFormatter({ month: 'long', year: 'numeric' }).format(new Date(`${monthKey}-01T00:00:00Z`))
}

function planningDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' })
}

function toUTCDate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
