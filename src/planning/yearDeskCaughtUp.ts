import { compareISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'
import { normalizeCaughtUpDateList, type YearDeskState } from './yearDeskPersistence'

export type YearDeskCaughtUpFields = Pick<YearDeskState, 'caughtUpThrough' | 'caughtUpDates' | 'caughtUpCleared'>

/** Past/today instructional days can be marked; future days cannot. */
export function canToggleYearDeskDayCaughtUp(date: ISODate, today: ISODate, instructional: boolean): boolean {
  return instructional && compareISODate(date, today) <= 0
}

export function isYearDeskDayCaughtUp(
  date: ISODate,
  today: ISODate,
  instructional: boolean,
  state: YearDeskCaughtUpFields,
): boolean {
  if (!instructional) return false
  if (compareISODate(date, today) > 0) return false
  if (state.caughtUpCleared.includes(date)) return false
  if (state.caughtUpDates.includes(date)) return true
  if (state.caughtUpThrough && compareISODate(date, state.caughtUpThrough) <= 0) return true
  return false
}

export function hasAnyYearDeskCaughtUp(state: YearDeskCaughtUpFields): boolean {
  return Boolean(state.caughtUpThrough) || state.caughtUpDates.length > 0
}

export function markYearDeskCaughtUpThroughToday(state: YearDeskState, today: ISODate): YearDeskState {
  return {
    ...state,
    caughtUpThrough: today,
    // Watermark covers everything through today; drop redundant extras and clears.
    caughtUpDates: uniqueSorted(state.caughtUpDates.filter((date) => compareISODate(date, today) > 0)),
    caughtUpCleared: [],
  }
}

export function clearYearDeskCaughtUp(state: YearDeskState): YearDeskState {
  return {
    ...state,
    caughtUpThrough: null,
    caughtUpDates: [],
    caughtUpCleared: [],
  }
}

export function toggleYearDeskDayCaughtUp(
  state: YearDeskState,
  date: ISODate,
  today: ISODate,
  instructional: boolean,
): YearDeskState {
  if (!canToggleYearDeskDayCaughtUp(date, today, instructional)) return state

  const caught = isYearDeskDayCaughtUp(date, today, instructional, state)
  if (caught) {
    const underThrough = Boolean(state.caughtUpThrough && compareISODate(date, state.caughtUpThrough) <= 0)
    return {
      ...state,
      caughtUpDates: state.caughtUpDates.filter((item) => item !== date),
      caughtUpCleared: underThrough ? uniqueSorted([...state.caughtUpCleared, date]) : state.caughtUpCleared,
    }
  }

  return {
    ...state,
    caughtUpDates: uniqueSorted([...state.caughtUpDates, date]),
    caughtUpCleared: state.caughtUpCleared.filter((item) => item !== date),
  }
}

/**
 * School days that still need attention: any instructional day not yet marked caught up.
 * Past unmarked days count as backlog; future days always remain until they happen and are marked.
 */
export function countRemainingSchoolDays(
  instructionalDates: ISODate[],
  today: ISODate,
  state: YearDeskCaughtUpFields,
): number {
  return instructionalDates.filter((date) => !isYearDeskDayCaughtUp(date, today, true, state)).length
}

export function uniqueSorted(dates: ISODate[]): ISODate[] {
  return normalizeCaughtUpDateList(dates)
}
