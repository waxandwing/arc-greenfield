import { assertISODate, compareISODate, eachCalendarDay } from './dateMath'
import type { CalendarDay, CalendarSource, Confidence, ISODate, SchoolCalendar, TermBoundary } from './types'

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CalendarHydrationInput = {
  id: string
  schoolYearLabel: string
  firstDay: ISODate
  lastDay: ISODate
  instructionalWeekdays: Weekday[]
  patternSource: CalendarSource
  patternConfidence: Confidence
  exceptions?: CalendarDay[]
  quarters?: TermBoundary[]
  semesters?: TermBoundary[]
}

export function validateHydrationInput(input: CalendarHydrationInput): string[] {
  const errors: string[] = []

  try { assertISODate(input.firstDay) } catch (error) { errors.push(messageOf(error)) }
  try { assertISODate(input.lastDay) } catch (error) { errors.push(messageOf(error)) }

  const validSchoolBounds = errors.length === 0
  if (validSchoolBounds && compareISODate(input.firstDay, input.lastDay) > 0) {
    errors.push('School year begins after it ends.')
  }

  if (input.instructionalWeekdays.length === 0) errors.push('At least one instructional weekday must be declared.')

  const weekdaySet = new Set<number>()
  for (const weekday of input.instructionalWeekdays) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) errors.push(`Invalid instructional weekday: ${weekday}.`)
    if (weekdaySet.has(weekday)) errors.push(`Instructional weekday ${weekday} is duplicated.`)
    weekdaySet.add(weekday)
  }

  const exceptionDates = new Set<ISODate>()
  for (const exception of input.exceptions ?? []) {
    try { assertISODate(exception.date) } catch (error) { errors.push(messageOf(error)); continue }
    if (validSchoolBounds && (compareISODate(exception.date, input.firstDay) < 0 || compareISODate(exception.date, input.lastDay) > 0)) {
      errors.push(`Calendar exception ${exception.date} falls outside the school-year bounds.`)
    }
    if (exceptionDates.has(exception.date)) errors.push(`Calendar exception ${exception.date} is duplicated.`)
    exceptionDates.add(exception.date)
  }

  if (validSchoolBounds) {
    errors.push(...validateTermBoundaries('Quarter', input.quarters ?? [], input.firstDay, input.lastDay))
    errors.push(...validateTermBoundaries('Semester', input.semesters ?? [], input.firstDay, input.lastDay))
  }

  return errors
}

export function hydrateSchoolCalendar(input: CalendarHydrationInput): SchoolCalendar {
  const errors = validateHydrationInput(input)
  if (errors.length > 0) throw new Error(`Cannot hydrate school calendar. ${errors.join(' ')}`)

  const instructionalWeekdays = new Set<number>(input.instructionalWeekdays)
  const exceptionMap = new Map<ISODate, CalendarDay>((input.exceptions ?? []).map((day) => [day.date, day]))
  const days = {} as SchoolCalendar['days']

  for (const date of eachCalendarDay(input.firstDay, input.lastDay)) {
    const exception = exceptionMap.get(date)
    if (exception) {
      days[date] = {
        ...exception,
        source: exception.source ?? input.patternSource,
        confidence: exception.confidence ?? input.patternConfidence,
      }
      continue
    }

    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    days[date] = {
      date,
      kind: instructionalWeekdays.has(weekday) ? 'instructional' : 'no-school',
      source: input.patternSource,
      confidence: input.patternConfidence,
    }
  }

  return {
    id: input.id,
    schoolYearLabel: input.schoolYearLabel,
    firstDay: input.firstDay,
    lastDay: input.lastDay,
    days,
    quarters: [...(input.quarters ?? [])],
    semesters: [...(input.semesters ?? [])],
  }
}

function validateTermBoundaries(kind: 'Quarter' | 'Semester', boundaries: TermBoundary[], firstDay: ISODate, lastDay: ISODate): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const valid: TermBoundary[] = []

  for (const boundary of boundaries) {
    if (!boundary.id.trim()) errors.push(`${kind} boundary is missing an id.`)
    if (!boundary.label.trim()) errors.push(`${kind} ${boundary.id || 'boundary'} is missing a label.`)
    if (ids.has(boundary.id)) errors.push(`${kind} boundary id ${boundary.id} is duplicated.`)
    ids.add(boundary.id)

    let datesValid = true
    try { assertISODate(boundary.startDate) } catch (error) { errors.push(messageOf(error)); datesValid = false }
    try { assertISODate(boundary.endDate) } catch (error) { errors.push(messageOf(error)); datesValid = false }
    if (!datesValid) continue

    if (compareISODate(boundary.startDate, boundary.endDate) > 0) {
      errors.push(`${kind} ${boundary.label || boundary.id} begins after it ends.`)
      continue
    }
    if (compareISODate(boundary.startDate, firstDay) < 0 || compareISODate(boundary.endDate, lastDay) > 0) {
      errors.push(`${kind} ${boundary.label || boundary.id} falls outside the school-year bounds.`)
      continue
    }
    valid.push(boundary)
  }

  const sorted = [...valid].sort((a, b) => compareISODate(a.startDate, b.startDate))
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    if (compareISODate(current.startDate, previous.endDate) <= 0) {
      errors.push(`${kind} ${current.label || current.id} overlaps ${previous.label || previous.id}.`)
    }
  }

  return errors
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
