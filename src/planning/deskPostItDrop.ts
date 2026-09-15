import type { ISODate } from '../calendar/types'
import type { TaskPriority } from './taskBar'

/** Pointer-drag drop targets for accent / spawned post-its on the wood. */
export type DeskPostItDropTarget =
  | { type: 'date'; date: ISODate; element: Element }
  | { type: 'priority'; priority: TaskPriority; element: Element }
  | { type: 'empty' }

export const DESK_POSTIT_DROP_HIGHLIGHT_CLASS = 'arc-desk-postit-drop-target'

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
    // Skip the dragged post-it itself and its children.
    if (node.closest('[data-desk-post-it]')) continue

    const priorityHost = node.closest(
      '[data-desk-postit-drop="priority"], .desk-priority-lane',
    )
    if (priorityHost) {
      const priority = priorityFromElement(priorityHost)
      if (priority) return { type: 'priority', priority, element: priorityHost }
    }

    const dateHost = node.closest(
      '[data-desk-postit-drop="date"], [data-plan-drop-date], [data-day-notes-date], .calendar-day-cell[data-date], .planning-date-heading',
    )
    if (dateHost) {
      const date = dateFromElement(dateHost)
        ?? dateFromElement(dateHost.closest('[data-date], [data-plan-drop-date], [data-day-notes-date]') ?? dateHost)
      if (date) return { type: 'date', date, element: dateHost }
    }
  }
  return { type: 'empty' }
}

export function clearDeskPostItDropHighlights(root: ParentNode = document): void {
  root.querySelectorAll(`.${DESK_POSTIT_DROP_HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(DESK_POSTIT_DROP_HIGHLIGHT_CLASS)
  })
}

export function highlightDeskPostItDropTarget(target: DeskPostItDropTarget): void {
  clearDeskPostItDropHighlights()
  if (target.type === 'empty') return
  target.element.classList.add(DESK_POSTIT_DROP_HIGHLIGHT_CLASS)
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
