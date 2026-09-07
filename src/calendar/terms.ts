import { compareISODate } from './dateMath'
import { validateHydrationInput, type CalendarHydrationInput } from './hydration'
import type { TermBoundary } from './types'

export type TermKind = 'quarter' | 'semester'

export function createTermBoundaryId(kind: TermKind): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${kind}-${token}`
}

export function replaceTermBoundaries(
  input: CalendarHydrationInput,
  quarters: TermBoundary[],
  semesters: TermBoundary[],
): CalendarHydrationInput {
  return {
    ...input,
    quarters: quarters.map((boundary) => ({ ...boundary })),
    semesters: semesters.map((boundary) => ({ ...boundary })),
  }
}

export function validateTermConfiguration(
  input: CalendarHydrationInput,
  quarters: TermBoundary[],
  semesters: TermBoundary[],
): string[] {
  const nextInput = replaceTermBoundaries(input, quarters, semesters)
  const errors = validateHydrationInput(nextInput)
  errors.push(...validateQuarterSemesterRelationship(quarters, semesters))
  return unique(errors)
}

export function sortTermBoundaries(boundaries: TermBoundary[]): TermBoundary[] {
  return [...boundaries].sort((a, b) => compareISODate(a.startDate, b.startDate))
}

function validateQuarterSemesterRelationship(quarters: TermBoundary[], semesters: TermBoundary[]): string[] {
  if (quarters.length === 0 || semesters.length === 0) return []

  const errors: string[] = []
  for (const quarter of quarters) {
    const containing = semesters.filter((semester) =>
      compareISODate(quarter.startDate, semester.startDate) >= 0 &&
      compareISODate(quarter.endDate, semester.endDate) <= 0,
    )

    if (containing.length === 0) {
      errors.push(`${quarter.label || quarter.id} must fit entirely inside one semester.`)
    } else if (containing.length > 1) {
      errors.push(`${quarter.label || quarter.id} belongs to more than one semester.`)
    }
  }

  return errors
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
