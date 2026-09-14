import { compareISODate } from '../calendar/dateMath'
import type { ISODate, SchoolCalendar, TermBoundary } from '../calendar/types'
import type { ProjectedDay } from '../calendar/projections'
import { projectYearMap } from '../calendar/projections'

export type YearDeskMonth = {
  key: string
  label: string
  year: number
  month: number
  days: ProjectedDay[]
}

export type YearDeskSnapshot = {
  months: YearDeskMonth[]
  remainingSchoolDays: number
  totalInstructionalDays: number
  quarters: TermBoundary[]
}

const QUARTER_TONE = ['q1', 'q2', 'q3', 'q4'] as const
export type QuarterTone = (typeof QUARTER_TONE)[number]

export function buildYearDeskSnapshot(calendar: SchoolCalendar, today: ISODate): YearDeskSnapshot {
  const projection = projectYearMap(calendar)
  const months = groupProjectedDaysByMonth(projection.days)
  const instructional = projection.days.filter(isInstructionalSchoolDay)
  const remainingSchoolDays = instructional.filter((day) => compareISODate(day.date, today) >= 0).length
  return {
    months,
    remainingSchoolDays,
    totalInstructionalDays: instructional.length,
    quarters: projection.quarters,
  }
}

export function groupProjectedDaysByMonth(days: ProjectedDay[]): YearDeskMonth[] {
  const buckets = new Map<string, YearDeskMonth>()
  for (const day of days) {
    if (!day.inSchoolYear) continue
    const [yearText, monthText] = day.date.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const key = `${yearText}-${monthText}`
    const existing = buckets.get(key)
    if (existing) {
      existing.days.push(day)
      continue
    }
    buckets.set(key, {
      key,
      label: monthLabel(year, month),
      year,
      month,
      days: [day],
    })
  }
  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function quarterToneForDate(date: ISODate, quarters: TermBoundary[]): QuarterTone | 'none' {
  const index = quarters.findIndex((boundary) => compareISODate(date, boundary.startDate) >= 0 && compareISODate(date, boundary.endDate) <= 0)
  if (index < 0) return 'none'
  return QUARTER_TONE[Math.min(index, QUARTER_TONE.length - 1)] ?? 'none'
}

export function isInstructionalSchoolDay(day: ProjectedDay): boolean {
  if (!day.inSchoolYear) return false
  if (day.kind === 'no-school' || day.kind === 'holiday' || day.kind === 'break' || day.kind === 'teacher-workday') return false
  if (day.kind === 'unknown') return false
  return true
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}
