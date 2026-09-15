import type { ISODate } from '../calendar/types'
import type { QuickCaptureKind } from '../planning/quickCaptureCommand'
import type { TaskPriority } from '../planning/taskBar'

/** Assign a wood post-it’s text onto a calendar date (week/day/month/year cell). */
export const DESK_POSTIT_ASSIGN_DATE_EVENT = 'arc-desk-postit-assign-date'
/** Assign a wood post-it’s text onto MUST / SHOULD / COULD. */
export const DESK_POSTIT_ASSIGN_PRIORITY_EVENT = 'arc-desk-postit-assign-priority'
/** After Quick Capture Enter — spawn a fresh sticky or magnet for continuous jotting. */
export const DESK_POSTIT_SPAWN_EVENT = 'arc-desk-postit-spawn'

export type DeskPostItAssignDateDetail = {
  postItId: string
  date: ISODate
  text: string
}

export type DeskPostItAssignPriorityDetail = {
  postItId: string
  priority: TaskPriority
  text: string
}

export type DeskPostItSpawnDetail = {
  kind: QuickCaptureKind
  text: string
  /** Suggested tone for spawned sticky (magnets ignore). */
  tone?: 'mustard' | 'pink' | 'blue' | 'cream'
  /** Focus the blank spawn (accent Enter). QC keeps its own focus. */
  focusBlank?: boolean
}

export function requestDeskPostItAssignDate(detail: DeskPostItAssignDateDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESK_POSTIT_ASSIGN_DATE_EVENT, { detail }))
}

export function requestDeskPostItAssignPriority(detail: DeskPostItAssignPriorityDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESK_POSTIT_ASSIGN_PRIORITY_EVENT, { detail }))
}

export function requestDeskPostItSpawn(detail: DeskPostItSpawnDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESK_POSTIT_SPAWN_EVENT, { detail }))
}
