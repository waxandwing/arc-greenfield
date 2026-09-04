import { createLesson } from './lessons'
import { createUnit } from './units'
import {
  assignPriority,
  bringBack,
  createEmptyFridgeDoorState,
  createMagnet,
  isFullyUnplacedLesson,
  parseCaptureIntent,
  placeEntity,
  priorityForEntity,
  reconcileFridgeDoor,
  removeEntityReference,
  stackEntities,
  validateFridgeDoorState,
} from './fridgeDoor'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const unit = createUnit({ id: 'unit-a', calendarId: 'calendar-a', courseId: 'course-a', title: 'Medieval' })
const unplaced = createLesson({ id: 'lesson-a', calendarId: 'calendar-a', courseId: 'course-a', unitId: unit.id, title: 'Manuscripts', sequence: 1 })
const other = createLesson({ id: 'lesson-b', calendarId: 'calendar-a', courseId: 'course-a', unitId: unit.id, title: 'Cathedrals', sequence: 2 })

{
  assert(parseCaptureIntent('M illuminated manuscripts').kind === 'magnet', 'M must parse as Magnet intent.')
  assert(parseCaptureIntent('u Medieval').kind === 'unit', 'U must parse as Unit intent without creating a Unit.')
  assert(parseCaptureIntent('L Cathedral comparison').kind === 'lesson', 'L must parse as Lesson intent without guessing context.')
  const defaulted = parseCaptureIntent('gold leaf experiment')
  assert(defaulted.kind === 'magnet' && defaulted.title === 'gold leaf experiment', 'Unprefixed capture must remain a Magnet.')
}

{
  const reconciled = reconcileFridgeDoor(createEmptyFridgeDoorState(), [unit], [unplaced], [], { rows: 1, columns: 1 })
  assert(reconciled.placements.some((item) => item.entityRef === 'lesson:lesson-a' && item.surface === 'door'), 'Fully unplaced Lesson must become discoverable on Door.')
}

{
  const overrides = [{ sectionId: 'section-a', lessonId: unplaced.id, plannedDate: '2026-09-08' as const }]
  assert(!isFullyUnplacedLesson(unplaced, overrides), 'A Section-specific placement means the Lesson is not fully unplaced.')
  const reconciled = reconcileFridgeDoor(createEmptyFridgeDoorState(), [unit], [unplaced], overrides, { rows: 1, columns: 1 })
  assert(!reconciled.placements.some((item) => item.entityRef === 'lesson:lesson-a'), 'Section-scheduled Lesson must not be projected as unplaced.')
}

{
  let state = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-b', 'door', 0, 0)
  state = reconcileFridgeDoor(state, [unit], [unplaced, other], [], { rows: 1, columns: 1 })
  const projected = state.placements.find((item) => item.entityRef === 'lesson:lesson-a')
  assert(projected?.surface === 'drawer', 'Full Door must route newly unplaced Lesson to recoverable Drawer instead of hiding or evicting.')
  assert(state.placements.some((item) => item.entityRef === 'lesson:lesson-b' && item.surface === 'door'), 'Full Door must not evict existing item.')
}

{
  let state = createEmptyFridgeDoorState()
  state = placeEntity(state, 'lesson:lesson-a', 'door', 0, 0)
  state = placeEntity(state, 'lesson:lesson-b', 'door', 0, 1)
  state = assignPriority(state, 'lesson:lesson-a', 'must')
  state = stackEntities(state, ['lesson:lesson-a', 'lesson:lesson-b'], 'stack-a')
  assert(priorityForEntity(state, 'lesson:lesson-a') === 'must', 'Stacking must preserve the independent priority relationship.')
  assert(state.placements.every((item) => item.stackId === 'stack-a'), 'Stack members must share stack ID.')
  state = removeEntityReference(state, 'lesson:lesson-a')
  assert(priorityForEntity(state, 'lesson:lesson-a') === 'must', 'Removing a Fridge placement must not remove Must/Should/Could priority.')
  state = placeEntity(state, 'lesson:lesson-a', 'drawer', 0, 0)
  assert(priorityForEntity(state, 'lesson:lesson-a') === 'must', 'Returning an object to Fridge depth must preserve its previous priority relationship.')
  state = assignPriority(state, 'lesson:lesson-a', null)
  assert(priorityForEntity(state, 'lesson:lesson-a') === null, 'Clearing priority must remove the relationship without changing placement.')
}

{
  let state = placeEntity(createEmptyFridgeDoorState(), 'unit:unit-a', 'door', 0, 0)
  state = placeEntity(state, 'lesson:lesson-a', 'door', 0, 1)
  let blocked = false
  try { stackEntities(state, ['unit:unit-a', 'lesson:lesson-a'], 'bad-stack') } catch { blocked = true }
  assert(blocked, 'Units must not become stack members in first Fridge contract.')
}

{
  const magnet = createMagnet('Maybe use foil', 'magnet-a')
  const state = {
    magnets: [magnet],
    placements: [
      { entityRef: 'magnet:magnet-a' as const, surface: 'door' as const, row: 0, column: 0, stackId: null, stackOrder: null },
      { entityRef: 'magnet:magnet-a' as const, surface: 'drawer' as const, row: 0, column: 0, stackId: null, stackOrder: null },
    ],
    priorities: [],
  }
  assert(validateFridgeDoorState(state, [unit], [unplaced]).some((error) => error.includes('Duplicate')), 'Duplicate entity references must be invalid.')
}

{
  const state = {
    magnets: [],
    placements: [{ entityRef: 'lesson:deleted' as const, surface: 'door' as const, row: 0, column: 0, stackId: null, stackOrder: null }],
    priorities: [{ entityRef: 'lesson:deleted' as const, priority: 'must' as const }],
  }
  assert(validateFridgeDoorState(state, [unit], [unplaced]).some((error) => error.includes('Orphaned Lesson')), 'Orphaned Lesson refs must be invalid.')
  const reconciled = reconcileFridgeDoor(state, [unit], [unplaced], [], { rows: 1, columns: 1 })
  assert(!reconciled.placements.some((item) => item.entityRef === 'lesson:deleted'), 'Reconciliation must remove orphaned canonical placement refs.')
  assert(priorityForEntity(reconciled, 'lesson:deleted') === null, 'Reconciliation must remove orphaned priority relationships.')
}

{
  let state = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-a', 'drawer', 0, 0)
  state = placeEntity(state, 'lesson:lesson-b', 'door', 0, 0)
  let blocked = false
  try { bringBack(state, 'lesson:lesson-a', { rows: 1, columns: 1 }) } catch { blocked = true }
  assert(blocked, 'Bring Back must fail visibly when Door is full.')
  assert(state.placements.find((item) => item.entityRef === 'lesson:lesson-a')?.surface === 'drawer', 'Failed Bring Back must leave item recoverable in Drawer.')
}

console.log('Fridge Door hostile contract passed.')
