import {
  DESK_POSTIT_DROP_HIGHLIGHT_CLASS,
  clearDeskPostItDropHighlights,
  hitTestDeskPostItDrop,
  highlightDeskPostItDropTarget,
  pointFromRectCenter,
} from './deskPostItDrop'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const center = pointFromRectCenter({ left: 10, top: 20, width: 40, height: 60 })
assert(center.clientX === 30 && center.clientY === 50, 'Rect center must be midpoint.')

assert(DESK_POSTIT_DROP_HIGHLIGHT_CLASS === 'arc-desk-postit-drop-target', 'Highlight class must stay stable for CSS/tests.')

// Without DOM furniture, hit-test returns empty (safe default — wood is unassigned).
const empty = hitTestDeskPostItDrop(0, 0)
assert(empty.type === 'empty', 'Missing DOM must classify as EMPTY wood.')

if (typeof document !== 'undefined') {
  const lane = document.createElement('div')
  lane.className = 'desk-priority-lane desk-priority-lane--must'
  lane.setAttribute('data-desk-postit-drop', 'priority')
  lane.setAttribute('data-priority', 'must')
  document.body.appendChild(lane)
  highlightDeskPostItDropTarget({ type: 'priority', priority: 'must', element: lane })
  assert(lane.classList.contains(DESK_POSTIT_DROP_HIGHLIGHT_CLASS), 'Priority lane must receive highlight class.')
  clearDeskPostItDropHighlights()
  assert(!lane.classList.contains(DESK_POSTIT_DROP_HIGHLIGHT_CLASS), 'Highlights must clear.')
  lane.remove()

  const slot = document.createElement('div')
  slot.className = 'planning-day-slot'
  slot.setAttribute('data-desk-postit-drop', 'date')
  slot.setAttribute('data-desk-postit-date', '2026-09-08')
  slot.setAttribute('data-date', '2026-09-08')
  slot.style.position = 'fixed'
  slot.style.left = '0'
  slot.style.top = '0'
  slot.style.width = '40px'
  slot.style.height = '40px'
  document.body.appendChild(slot)
  const hit = hitTestDeskPostItDrop(20, 20)
  assert(hit.type === 'date' && hit.date === '2026-09-08', 'Planning day slots must resolve as date drop targets.')
  highlightDeskPostItDropTarget(hit)
  assert(slot.classList.contains(DESK_POSTIT_DROP_HIGHLIGHT_CLASS), 'Day slot must highlight on hover.')
  clearDeskPostItDropHighlights()
  slot.remove()
}

console.log('desk post-it drop contract passed')
