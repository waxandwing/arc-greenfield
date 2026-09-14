import { eachCalendarDay } from './dateMath'
import type { Weekday } from './hydration'
import type { CalendarSource, Confidence, ISODate } from './types'

export type RecurringEarlyReleaseRule = {
  id: string
  weekdays: Weekday[]
  schoolEndTime: string
  label?: string
  source?: CalendarSource
  confidence?: Confidence
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateRecurringEarlyReleaseRules(rules: RecurringEarlyReleaseRule[] | undefined): string[] {
  if (!rules?.length) return []

  const errors: string[] = []
  const ids = new Set<string>()
  const weekdayOwners = new Map<Weekday, string>()

  for (const rule of rules) {
    if (!rule.id.trim()) errors.push('Recurring early release rule is missing an id.')
    if (ids.has(rule.id)) errors.push(`Recurring early release rule id ${rule.id} is duplicated.`)
    ids.add(rule.id)

    if (!rule.weekdays.length) errors.push('Each recurring early release rule needs at least one weekday.')
    if (!TIME_PATTERN.test(rule.schoolEndTime)) {
      errors.push('Recurring early release school end time must use HH:MM (24-hour).')
    }

    const weekdaySet = new Set<number>()
    for (const weekday of rule.weekdays) {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        errors.push(`Invalid recurring early release weekday: ${weekday}.`)
        continue
      }
      if (weekdaySet.has(weekday)) errors.push(`Recurring early release rule ${rule.id} repeats weekday ${weekday}.`)
      weekdaySet.add(weekday)

      const owner = weekdayOwners.get(weekday as Weekday)
      if (owner && owner !== rule.id) {
        errors.push('Each weekday can only belong to one recurring early release rule.')
      } else {
        weekdayOwners.set(weekday as Weekday, rule.id)
      }
    }
  }

  return [...new Set(errors)]
}

export function recurringEarlyReleaseByWeekday(
  rules: RecurringEarlyReleaseRule[] | undefined,
): Map<Weekday, RecurringEarlyReleaseRule> {
  const map = new Map<Weekday, RecurringEarlyReleaseRule>()
  for (const rule of rules ?? []) {
    for (const weekday of rule.weekdays) map.set(weekday, rule)
  }
  return map
}

export function defaultRecurringEarlyReleaseLabel(weekdays: Weekday[]): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ordered = [...weekdays].sort((a, b) => a - b).map((day) => names[day])
  return `Weekly early release · ${ordered.join(', ')}`
}

export function cloneRecurringEarlyReleaseRules(
  rules: RecurringEarlyReleaseRule[] | undefined,
): RecurringEarlyReleaseRule[] | undefined {
  return rules?.map((rule) => ({
    ...rule,
    weekdays: [...rule.weekdays],
  }))
}

export function countRecurringEarlyReleaseDates(input: {
  firstDay: ISODate
  lastDay: ISODate
  instructionalWeekdays: Weekday[]
  rules: RecurringEarlyReleaseRule[] | undefined
}): number {
  const byWeekday = recurringEarlyReleaseByWeekday(input.rules)
  const instructional = new Set(input.instructionalWeekdays)
  let count = 0
  for (const date of eachCalendarDay(input.firstDay, input.lastDay)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday
    if (!instructional.has(weekday)) continue
    if (!byWeekday.has(weekday)) continue
    count += 1
  }
  return count
}
