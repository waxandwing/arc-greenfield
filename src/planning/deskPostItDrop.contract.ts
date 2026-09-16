import {
  DESK_POSTIT_DROP_HIGHLIGHT_CLASS,
  DESK_POSTIT_PARK_DESK_CLASS,
  DESK_POSTIT_PARK_TRAY_CLASS,
  clearDeskPostItDropHighlights,
  hitTestDeskPostItDrop,
  hitTestDeskPostItPark,
  highlightDeskPostItDropTarget,
  highlightDeskPostItParkTarget,
  pointFromRectCenter,
  pointInElement,
} from './deskPostItDrop'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const center = pointFromRectCenter({ left: 10, top: 20, width: 40, height: 60 })
assert(center.clientX === 30 && center.clientY === 50, 'Rect center must be midpoint.')

assert(DESK_POSTIT_DROP_HIGHLIGHT_CLASS === 'arc-desk-postit-drop-target', 'Highlight class must stay stable for CSS/tests.')
assert(DESK_POSTIT_PARK_TRAY_CLASS === 'arc-desk-postit-drop-target--ideas', 'Tray park class must stay stable.')
assert(DESK_POSTIT_PARK_DESK_CLASS === 'arc-desk-postit-drop-target--desk-park', 'Desk park class must stay stable.')

// Without DOM furniture, hit-test returns empty (safe default — wood is unassigned).
const empty = hitTestDeskPostItDrop(0, 0)
assert(empty.type === 'empty', 'Missing DOM must classify as EMPTY wood.')
assert(hitTestDeskPostItPark(0, 0).type === 'empty', 'Missing DOM must classify park as empty.')
assert(pointInElement(5, 5, null) === false, 'Null element is never a hit.')

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

  const tray = document.createElement('aside')
  tray.setAttribute('data-testid', 'arc-desk-tray-dock')
  tray.setAttribute('data-desk-postit-drop', 'ideas-tray')
  tray.style.position = 'fixed'
  tray.style.left = '0'
  tray.style.top = '0'
  tray.style.width = '80px'
  tray.style.height = '80px'
  document.body.appendChild(tray)
  const parkTray = hitTestDeskPostItPark(20, 20)
  assert(parkTray.type === 'ideas-tray', 'IDEAS tray must resolve as return park target.')
  highlightDeskPostItParkTarget(parkTray)
  assert(tray.classList.contains(DESK_POSTIT_PARK_TRAY_CLASS), 'Tray must show return highlight.')
assert(tray.getAttribute('data-desk-postit-park') === 'ideas', 'Tray must stamp durable ideas park data attr.')
  clearDeskPostItDropHighlights()
  tray.remove()

  const surface = document.createElement('div')
  surface.className = 'arc-desk-surface'
  surface.setAttribute('data-desk-postit-drop', 'desk-park')
  surface.style.position = 'fixed'
  surface.style.left = '0'
  surface.style.top = '0'
  surface.style.width = '120px'
  surface.style.height = '120px'
  document.body.appendChild(surface)
  const parkDesk = hitTestDeskPostItPark(40, 40)
  assert(parkDesk.type === 'desk-park', 'Desk surface must resolve as exterior park target.')
  highlightDeskPostItParkTarget(parkDesk)
  assert(surface.classList.contains(DESK_POSTIT_PARK_DESK_CLASS), 'Desk must show park highlight.')
  clearDeskPostItDropHighlights()
  surface.remove()
}

console.log('desk post-it drop contract passed')
