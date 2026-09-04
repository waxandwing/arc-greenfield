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
  reconcileFridgeDoor,
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
  assert(state.placements.find((item) => item.entityRef === 'lesson:lesson-a')?.priority === 'must', 'Stacking must preserve priority.')
  assert(state.placements.every((item) => item.stackId === 'stack-a'), 'Stack members must share stack ID.')
}

{
  let state = placeEntity(createEmptyFridgeDoorState(), 'unit:unit-a', 'door', 0, 0)
  state = placeEntity(state, 'lesson:lesson-a', 'door', 0, 1)
  let blocked = false
  try { stackEntities(state, ['unit:unit-a', 'lesson:lesson-a'], 'bad-stack') } catch { blocked = true }
  assert(blocked, 'Units must not become stack members in first Fridge contract.')
}

{
  const persistedBadUnitStack = {
    magnets: [],
    placements: [
      { entityRef: 'unit:unit-a' as const, surface: 'door' as const, row: 0, column: 0, stackId: 'stack-a', stackOrder: 0, priority: null },
    ],
  }
  assert(validateFridgeDoorState(persistedBadUnitStack, [unit], [unplaced]).some((error) => error.includes('Units cannot be stack members')), 'Persisted Unit stack membership must be rejected on validation.')
}

{
  const duplicateStackOrder = {
    magnets: [],
    placements: [
      { entityRef: 'lesson:lesson-a' as const, surface: 'door' as const, row: 0, column: 0, stackId: 'stack-a', stackOrder: 0, priority: null },
      { entityRef: 'lesson:lesson-b' as const, surface: 'door' as const, row: 0, column: 0, stackId: 'stack-a', stackOrder: 0, priority: null },
    ],
  }
  assert(validateFridgeDoorState(duplicateStackOrder, [unit], [unplaced, other]).some((error) => error.includes('Duplicate stack order')), 'Duplicate ordering inside one stack must be invalid.')
}

{
  const magnet = createMagnet('Maybe use foil', 'magnet-a')
  const state = {
    magnets: [magnet],
    placements: [
      { entityRef: 'magnet:magnet-a' as const, surface: 'door' as const, row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'magnet:magnet-a' as const, surface: 'drawer' as const, row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
    ],
  }
  assert(validateFridgeDoorState(state, [unit], [unplaced]).some((error) => error.includes('Duplicate')), 'Duplicate entity references must be invalid.')
}

{
  const state = {
    magnets: [],
    placements: [{ entityRef: 'lesson:deleted' as const, surface: 'door' as const, row: 0, column: 0, stackId: null, stackOrder: null, priority: null }],
  }
  assert(validateFridgeDoorState(state, [unit], [unplaced]).some((error) => error.includes('Orphaned Lesson')), 'Orphaned Lesson refs must be invalid.')
  const reconciled = reconcileFridgeDoor(state, [unit], [unplaced], [], { rows: 1, columns: 1 })
  assert(!reconciled.placements.some((item) => item.entityRef === 'lesson:deleted'), 'Reconciliation must remove orphaned canonical refs.')
}

{
  let state = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-a', 'drawer', 0, 0)
  state = placeEntity(state, 'lesson:lesson-b', 'door', 0, 0)
  let blocked = false
  try { bringBack(state, 'lesson:lesson-a', { rows: 1, columns: 1 }) } catch { blocked = true }
  assert(blocked, 'Bring Back must fail visibly when Door is full.')
  assert(state.placements.find((item) => item.entityRef === 'lesson:lesson-a')?.surface === 'drawer', 'Failed Bring Back must leave item recoverable in Drawer.')
}

{
  const manyLessons = Array.from({ length: 60 }, (_, index) => createLesson({
    id: `pressure-${index}`,
    calendarId: 'calendar-a',
    courseId: 'course-a',
    unitId: unit.id,
    title: `Pressure Lesson ${index}`,
    sequence: index + 1,
  }))
  const first = reconcileFridgeDoor(createEmptyFridgeDoorState(), [unit], manyLessons, [], { rows: 5, columns: 5 })
  assert(first.placements.filter((item) => item.surface === 'door').length === 25, 'Finite Door capacity must remain finite under 60-Lesson pressure.')
  assert(first.placements.filter((item) => item.surface === 'drawer').length === 35, 'Overflow under pressure must remain reachable in Drawer.')
  const second = reconcileFridgeDoor(first, [unit], manyLessons, [], { rows: 5, columns: 5 })
  assert(JSON.stringify(second) === JSON.stringify(first), 'Reconciliation must be idempotent for stable canonical state.')
}

console.log('Fridge Door hostile contract passed.')
