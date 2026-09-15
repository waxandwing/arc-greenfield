import { classifyElementDragTarget, dragTargetLabel, requiresCanonicalPlace } from './dragTargets'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const dateTarget = classifyElementDragTarget({ date: '2026-09-10' })
assert(dateTarget.type === 'DATE' && dragTargetLabel(dateTarget) === 'DATE:2026-09-10', 'DATE target must classify from calendar cells.')

const stackTarget = classifyElementDragTarget({ stackId: 'stack-1' })
assert(stackTarget.type === 'STACK_GROUP', 'STACK_GROUP must classify stack drops.')

const trayTarget = classifyElementDragTarget({ tray: true })
assert(trayTarget.type === 'TRAY' && requiresCanonicalPlace(trayTarget), 'TRAY drops must use canonical place/unplace.')

const unitTarget = classifyElementDragTarget({ unitId: 'unit-1' })
assert(unitTarget.type === 'UNIT_MAGNET', 'UNIT_MAGNET must classify unit magnet targets.')

const empty = classifyElementDragTarget({})
assert(empty.type === 'EMPTY', 'Unknown surfaces must classify as EMPTY.')

console.log('drag targets contract passed')
