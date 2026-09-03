import type { ISODate } from '../calendar/types'

export function formatWeekday(date: ISODate): string {
  return dateFormatter({ weekday: 'short' }).format(toUTCDate(date))
}

export function formatShortDate(date: ISODate): string {
  return dateFormatter({ month: 'short', day: 'numeric' }).format(toUTCDate(date))
}

export function formatLongDate(date: ISODate): string {
  return dateFormatter({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(toUTCDate(date))
}

export function formatMonthKey(monthKey: `${number}-${number}`): string {
  return dateFormatter({ month: 'long', year: 'numeric' }).format(new Date(`${monthKey}-01T00:00:00Z`))
}

export function formatMonth(date: ISODate): string {
  return formatMonthKey(date.slice(0, 7) as `${number}-${number}`)
}

export function formatDateRange(start: ISODate, end: ISODate): string {
  const startDate = toUTCDate(start)
  const endDate = toUTCDate(end)
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear()
  const startLabel = dateFormatter({ month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(startDate)
  const endLabel = dateFormatter({ month: 'short', day: 'numeric', year: 'numeric' }).format(endDate)
  return `${startLabel} – ${endLabel}`
}

function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' })
}

function toUTCDate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
