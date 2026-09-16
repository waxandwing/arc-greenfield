import type { ISODate } from '../calendar/types'
import type { TaskPriority } from './taskBar'

/** Pointer-drag drop targets for accent / spawned post-its on the wood. */
export type DeskPostItDropTarget =
  | { type: 'date'; date: ISODate; element: Element }
  | { type: 'priority'; priority: TaskPriority; element: Element }
  | { type: 'empty' }

/**
 * Park / return targets while dragging stickies between IDEAS and the exterior desk.
 * Distinct from assign targets (date / priority) — wood itself is a valid park.
 */
export type DeskPostItParkTarget =
  | { type: 'ideas-tray'; element: Element }
  | { type: 'desk-park'; element: Element }
  | { type: 'empty' }

export const DESK_POSTIT_DROP_HIGHLIGHT_CLASS = 'arc-desk-postit-drop-target'
export const DESK_POSTIT_PARK_TRAY_CLASS = 'arc-desk-postit-drop-target--ideas'
export const DESK_POSTIT_PARK_DESK_CLASS = 'arc-desk-postit-drop-target--desk-park'

const DATE_ATTRS = ['data-plan-drop-date', 'data-day-notes-date', 'data-date', 'data-desk-postit-date'] as const

function isPriority(value: string | null | undefined): value is TaskPriority {
  return value === 'must' || value === 'should' || value === 'could'
}

function dateFromElement(el: Element): ISODate | null {
  for (const attr of DATE_ATTRS) {
    const value = el.getAttribute(attr)
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value as ISODate
  }
  return null
}

function priorityFromElement(el: Element): TaskPriority | null {
  const explicit = el.getAttribute('data-priority') ?? el.getAttribute('data-desk-postit-priority')
  if (isPriority(explicit)) return explicit
  if (el.classList.contains('desk-priority-lane--must')) return 'must'
  if (el.classList.contains('desk-priority-lane--should')) return 'should'
  if (el.classList.contains('desk-priority-lane--could')) return 'could'
  return null
}

/**
 * Resolve the topmost valid assign target under a point.
 * Wood itself is EMPTY — stickies may rest there unassigned.
 */
export function hitTestDeskPostItDrop(clientX: number, clientY: number): DeskPostItDropTarget {
  if (typeof document === 'undefined') return { type: 'empty' }
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const node of stack) {
    if (!(node instanceof Element)) continue
    // Skip the dragged post-it itself and its children / document ghost.
    if (node.closest('[data-desk-post-it]')) continue
    if (node.closest('[data-testid="arc-desk-post-it-drag-ghost"]')) continue

    const priorityHost = node.closest(
      '[data-desk-postit-drop="priority"], .desk-priority-lane',
    )
    if (priorityHost) {
      const priority = priorityFromElement(priorityHost)
      if (priority) return { type: 'priority', priority, element: priorityHost }
    }

    const dateHost = node.closest(
      '[data-desk-postit-drop="date"], [data-plan-drop-date], [data-day-notes-date], .calendar-day-cell[data-date], .planning-date-heading, .planning-day-slot[data-desk-postit-date], .planning-day-slot[data-date]',
    )
    if (dateHost) {
      const date = dateFromElement(dateHost)
        ?? dateFromElement(dateHost.closest('[data-date], [data-plan-drop-date], [data-day-notes-date]') ?? dateHost)
      if (date) return { type: 'date', date, element: dateHost }
    }
  }
  return { type: 'empty' }
}

/**
 * Resolve IDEAS tray vs exterior desk park under a point.
 * Tray wins when the pointer is over the dock / accent slot so returns are obvious.
 */
export function hitTestDeskPostItPark(clientX: number, clientY: number): DeskPostItParkTarget {
  if (typeof document === 'undefined') return { type: 'empty' }

  // Prefer geometry for the open IDEAS tray so a dragged sticky (same z as the tray)
  // cannot mask the return target in elementsFromPoint.
  const trayDock = document.querySelector('[data-testid="arc-desk-tray-dock"]')
  if (trayDock instanceof HTMLElement && trayDock.getAttribute('data-extended') === 'true') {
    const box = trayDock.getBoundingClientRect()
    if (clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom) {
      return { type: 'ideas-tray', element: trayDock }
    }
  }

  const stack = document.elementsFromPoint(clientX, clientY)
  for (const node of stack) {
    if (!(node instanceof Element)) continue
    if (node.closest('[data-desk-post-it]')) continue
    if (node.closest('[data-testid="arc-desk-post-it-drag-ghost"]')) continue

    const trayHost = node.closest(
      '[data-desk-postit-drop="ideas-tray"], [data-testid="arc-desk-tray-dock"], [data-testid="arc-desk-ideas-accent-slot"]',
    )
    if (trayHost) return { type: 'ideas-tray', element: trayHost }

    const deskHost = node.closest(
      '[data-desk-postit-drop="desk-park"], .arc-desk-surface',
    )
    if (deskHost) return { type: 'desk-park', element: deskHost }
  }
  return { type: 'empty' }
}

export function clearDeskPostItDropHighlights(root: ParentNode = document): void {
  root.querySelectorAll(`.${DESK_POSTIT_DROP_HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(DESK_POSTIT_DROP_HIGHLIGHT_CLASS)
  })
  root.querySelectorAll(`.${DESK_POSTIT_PARK_TRAY_CLASS}`).forEach((el) => {
    el.classList.remove(DESK_POSTIT_PARK_TRAY_CLASS)
  })
  root.querySelectorAll(`.${DESK_POSTIT_PARK_DESK_CLASS}`).forEach((el) => {
    el.classList.remove(DESK_POSTIT_PARK_DESK_CLASS)
  })
  // data-* park markers survive React className resets on the tray dock.
  root.querySelectorAll('[data-desk-postit-park="ideas"]').forEach((el) => {
    el.removeAttribute('data-desk-postit-park')
  })
  root.querySelectorAll('[data-desk-postit-park="desk"]').forEach((el) => {
    el.removeAttribute('data-desk-postit-park')
  })
}

export function highlightDeskPostItDropTarget(target: DeskPostItDropTarget): void {
  clearDeskPostItDropHighlights()
  if (target.type === 'empty') return
  target.element.classList.add(DESK_POSTIT_DROP_HIGHLIGHT_CLASS)
}

export function highlightDeskPostItParkTarget(target: DeskPostItParkTarget): void {
  clearDeskPostItDropHighlights()
  if (target.type === 'ideas-tray') {
    const tray =
      target.element.closest('[data-testid="arc-desk-tray-dock"]')
      ?? target.element
    tray.classList.add(DESK_POSTIT_DROP_HIGHLIGHT_CLASS, DESK_POSTIT_PARK_TRAY_CLASS)
    if (tray instanceof Element) tray.setAttribute('data-desk-postit-park', 'ideas')
    return
  }
  if (target.type === 'desk-park') {
    const surface =
      target.element.closest('.arc-desk-surface')
      ?? target.element
    surface.classList.add(DESK_POSTIT_DROP_HIGHLIGHT_CLASS, DESK_POSTIT_PARK_DESK_CLASS)
    if (surface instanceof Element) surface.setAttribute('data-desk-postit-park', 'desk')
  }
}

export function pointFromRectCenter(rect: { left: number; top: number; width: number; height: number }): {
  clientX: number
  clientY: number
} {
  return {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  }
}

export function pointInElement(clientX: number, clientY: number, el: Element | null): boolean {
  if (!el) return false
  const box = el.getBoundingClientRect()
  return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom
}
