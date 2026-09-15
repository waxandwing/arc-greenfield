/** Cross-furniture events for the IDEAS drawer (open / gather post-its). */

export const DESK_IDEAS_OPEN_EVENT = 'arc-desk-ideas-open'
export const DESK_IDEAS_CLEAN_UP_EVENT = 'arc-desk-ideas-clean-up'

export function requestDeskIdeasOpen() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESK_IDEAS_OPEN_EVENT))
}

/** Gather loose desk post-its back into the IDEAS drawer and open it. */
export function requestDeskIdeasCleanUp() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESK_IDEAS_CLEAN_UP_EVENT))
  requestDeskIdeasOpen()
}
