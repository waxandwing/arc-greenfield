import type { ISODate } from '../calendar/types'
import type { TaskPriority } from './taskBar'

export type DragTargetType =
  | 'DATE'
  | 'TRAY'
  | 'PRIORITY_LANE'
  | 'STACK_GROUP'
  | 'UNIT_MAGNET'
  | 'EMPTY'

export type DragTarget =
  | { type: 'DATE'; date: ISODate }
  | { type: 'TRAY' }
  | { type: 'PRIORITY_LANE'; priority: TaskPriority }
  | { type: 'STACK_GROUP'; stackId: string }
  | { type: 'UNIT_MAGNET'; unitId: string }
  | { type: 'EMPTY' }

export function dragTargetLabel(target: DragTarget): string {
  switch (target.type) {
    case 'DATE':
      return `DATE:${target.date}`
    case 'TRAY':
      return 'TRAY'
    case 'PRIORITY_LANE':
      return `PRIORITY_LANE:${target.priority}`
    case 'STACK_GROUP':
      return `STACK_GROUP:${target.stackId}`
    case 'UNIT_MAGNET':
      return `UNIT_MAGNET:${target.unitId}`
    default:
      return 'EMPTY'
  }
}

export function classifyElementDragTarget(input: {
  date?: ISODate | null
  tray?: boolean
  priorityLane?: TaskPriority | null
  stackId?: string | null
  unitId?: string | null
}): DragTarget {
  if (input.date) return { type: 'DATE', date: input.date }
  if (input.stackId) return { type: 'STACK_GROUP', stackId: input.stackId }
  if (input.unitId) return { type: 'UNIT_MAGNET', unitId: input.unitId }
  if (input.priorityLane) return { type: 'PRIORITY_LANE', priority: input.priorityLane }
  if (input.tray) return { type: 'TRAY' }
  return { type: 'EMPTY' }
}

export function requiresCanonicalPlace(target: DragTarget): boolean {
  return target.type === 'DATE' || target.type === 'TRAY'
}
