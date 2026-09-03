import type { ISODate } from './types'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function assertISODate(value: string): asserts value is ISODate {
  if (!ISO_DATE_PATTERN.test(value)) throw new Error(`Invalid ISO date: ${value}`)
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`)
  }
}

export function addCalendarDays(date: ISODate, amount: number): ISODate {
  assertISODate(date)
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCDate(parsed.getUTCDate() + amount)
  return parsed.toISOString().slice(0, 10) as ISODate
}

export function compareISODate(a: ISODate, b: ISODate): number {
  return a.localeCompare(b)
}

export function eachCalendarDay(start: ISODate, end: ISODate): ISODate[] {
  if (compareISODate(start, end) > 0) throw new Error('Calendar range start must not be after end')
  const result: ISODate[] = []
  for (let cursor = start; compareISODate(cursor, end) <= 0; cursor = addCalendarDays(cursor, 1)) {
    result.push(cursor)
  }
  return result
}
