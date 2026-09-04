import { createLesson } from './lessons'
import { createUnit } from './units'
import {
  assignPriority,
  createEmptyFridgeDoorState,
  createMagnet,
  placeEntity,
  stackEntities,
} from './fridgeDoor'
import {
  deserializeFridgeDoor,
  restoreFridgeDoor,
  serializeFridgeDoor,
} from './fridgeDoorPersistence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const capacity = { rows: 1, columns: 2 }
const unit = createUnit({ id: 'unit-a', calendarId: 'calendar-a', courseId: 'course-a', title: 'Medieval' })
const lessonA = createLesson({ id: 'lesson-a', calendarId: 'calendar-a', courseId: 'course-a', unitId: unit.id, title: 'Manuscripts', sequence: 1 })
const lessonB = createLesson({ id: 'lesson-b', calendarId: 'calendar-a', courseId: 'course-a', unitId: unit.id, title: 'Cathedrals', sequence: 2 })

{
  const magnet = createMagnet('Try foil', 'magnet-a')
  let state = createEmptyFridgeDoorState()
  state = { ...state, magnets: [magnet] }
  state = placeEntity(state, 'magnet:magnet-a', 'door', 0, 0)
  state = placeEntity(state, 'lesson:lesson-a', 'door', 0, 1)
  state = assignPriority(state, 'lesson:lesson-a', 'must')
  state = stackEntities(state, ['magnet:magnet-a', 'lesson:lesson-a'], 'stack-a')
  state = placeEntity(state, 'lesson:lesson-b', 'drawer', 0, 0)

  const raw = serializeFridgeDoor({ calendarId: 'calendar-a', state })
  const parsed = deserializeFridgeDoor(raw)
  assert(parsed?.calendarId === 'calendar-a', 'Persistence must preserve calendar ownership.')
  assert(parsed?.state.placements.some((item) => item.entityRef === 'lesson:lesson-a' && item.priority === 'must'), 'Persistence must preserve priority.')
  assert(parsed?.state.placements.filter((item) => item.stackId === 'stack-a').length === 2, 'Persistence must preserve stack membership.')
  assert(parsed?.state.placements.some((item) => item.entityRef === 'lesson:lesson-b' && item.surface === 'drawer'), 'Persistence must preserve Drawer state.')
}

{
  const result = restoreFridgeDoor('{"schemaVersion":99}', 'calendar-a', [unit], [lessonA], [], capacity)
  assert(result.status === 'invalid', 'Unknown Fridge schema versions must fail closed.')
}

{
  const raw = serializeFridgeDoor({ calendarId: 'calendar-other', state: createEmptyFridgeDoorState() })
  const result = restoreFridgeDoor(raw, 'calendar-a', [unit], [lessonA], [], capacity)
  assert(result.status === 'empty', 'Fridge state from another calendar must not leak into the active calendar.')
}

{
  const duplicateRaw = JSON.stringify({
    schemaVersion: 1,
    input: {
      calendarId: 'calendar-a',
      state: {
        magnets: [],
        placements: [
          { entityRef: 'lesson:lesson-a', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
          { entityRef: 'lesson:lesson-a', surface: 'drawer', row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
        ],
      },
    },
  })
  const result = restoreFridgeDoor(duplicateRaw, 'calendar-a', [unit], [lessonA], [], capacity)
  assert(result.status === 'invalid', 'Duplicate persisted Fridge refs must not be silently accepted.')
}

{
  const staleRaw = JSON.stringify({
    schemaVersion: 1,
    input: {
      calendarId: 'calendar-a',
      state: {
        magnets: [],
        placements: [{ entityRef: 'lesson:deleted', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: null }],
      },
    },
  })
  const result = restoreFridgeDoor(staleRaw, 'calendar-a', [unit], [lessonA], [], capacity)
  assert(result.status === 'restored', 'Stale canonical refs should reconcile rather than strand the entire Fridge.')
  assert(!result.state.placements.some((item) => item.entityRef === 'lesson:deleted'), 'Stale canonical refs must be removed during restore.')
  assert(result.state.placements.some((item) => item.entityRef === 'lesson:lesson-a'), 'Restore must re-project a fully unplaced canonical Lesson.')
}

{
  let state = createEmptyFridgeDoorState()
  state = placeEntity(state, 'lesson:lesson-b', 'door', 0, 0)
  const raw = serializeFridgeDoor({ calendarId: 'calendar-a', state })
  const result = restoreFridgeDoor(raw, 'calendar-a', [unit], [lessonA, lessonB], [], { rows: 1, columns: 1 })
  assert(result.status === 'restored', 'Full Door restore should remain recoverable.')
  assert(result.state.placements.some((item) => item.entityRef === 'lesson:lesson-a' && item.surface === 'drawer'), 'A newly reconciled unplaced Lesson must overflow to Drawer when Door is full.')
  assert(result.state.placements.some((item) => item.entityRef === 'lesson:lesson-b' && item.surface === 'door'), 'Restore must not evict the existing Door item.')
}

{
  const outOfBounds = JSON.stringify({
    schemaVersion: 1,
    input: {
      calendarId: 'calendar-a',
      state: {
        magnets: [],
        placements: [{ entityRef: 'lesson:lesson-a', surface: 'door', row: 9, column: 9, stackId: null, stackOrder: null, priority: null }],
      },
    },
  })
  const result = restoreFridgeDoor(outOfBounds, 'calendar-a', [unit], [lessonA], [], capacity)
  assert(result.status === 'invalid', 'Persisted Door coordinates outside logical capacity must fail closed instead of silently teleporting.')
}

console.log('Fridge Door persistence hostile contract passed.')
