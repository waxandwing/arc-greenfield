import type { ISODate } from '../calendar/types'
import type { TaskPriority } from './taskBar'

export const TRAY_CAPTURE_DRAG_MIME = 'application/x-arc-tray-capture+json'
export const DESK_PRIORITY_DRAG_MIME = 'application/x-arc-desk-priority+json'
export const TRAY_STACK_DRAG_MIME = 'application/x-arc-tray-stack+json'

export const STACK_DWELL_MS = 450

export function stackDwellMs(): number {
  if (typeof window !== 'undefined') {
    const override = (window as unknown as { __ARC_STACK_DWELL_MS?: number }).__ARC_STACK_DWELL_MS
    if (typeof override === 'number' && override >= 0) return override
  }
  return STACK_DWELL_MS
}

export type TrayCaptureDragPayload = {
  kind: 'capture'
  captureId: string
}

export type DeskPriorityDragPayload = {
  kind: 'task'
  taskId: string
  fromPriority: TaskPriority
}

export function encodeTrayCaptureDrag(payload: TrayCaptureDragPayload): string {
  return JSON.stringify(payload)
}

export function readTrayCaptureDrag(dataTransfer: DataTransfer): TrayCaptureDragPayload | null {
  try {
    const raw = dataTransfer.getData(TRAY_CAPTURE_DRAG_MIME)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TrayCaptureDragPayload>
    if (parsed.kind !== 'capture' || typeof parsed.captureId !== 'string') return null
    return { kind: 'capture', captureId: parsed.captureId }
  } catch {
    return null
  }
}

export function hasTrayCaptureDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(TRAY_CAPTURE_DRAG_MIME)
}

export function encodeDeskPriorityDrag(payload: DeskPriorityDragPayload): string {
  return JSON.stringify(payload)
}

export function readDeskPriorityDrag(dataTransfer: DataTransfer): DeskPriorityDragPayload | null {
  try {
    const raw = dataTransfer.getData(DESK_PRIORITY_DRAG_MIME)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DeskPriorityDragPayload>
    if (parsed.kind !== 'task' || typeof parsed.taskId !== 'string') return null
    if (parsed.fromPriority !== 'must' && parsed.fromPriority !== 'should' && parsed.fromPriority !== 'could') return null
    return { kind: 'task', taskId: parsed.taskId, fromPriority: parsed.fromPriority }
  } catch {
    return null
  }
}

export function hasDeskPriorityDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(DESK_PRIORITY_DRAG_MIME)
}

/** Calendar date drop target for day notes / capture anchor moves (reuse in desk flows). */
export type DeskDateDropPayload = { date: ISODate }

export function encodeDeskDateDrop(payload: DeskDateDropPayload): string {
  return JSON.stringify(payload)
}

export type TrayStackDragPayload = {
  kind: 'stack'
  stackId: string
  memberKind: 'capture' | 'lesson'
}

export function encodeTrayStackDrag(payload: TrayStackDragPayload): string {
  return JSON.stringify(payload)
}

export function readTrayStackDrag(dataTransfer: DataTransfer): TrayStackDragPayload | null {
  try {
    const raw = dataTransfer.getData(TRAY_STACK_DRAG_MIME)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TrayStackDragPayload>
    if (parsed.kind !== 'stack' || typeof parsed.stackId !== 'string') return null
    return { kind: 'stack', stackId: parsed.stackId, memberKind: parsed.memberKind === 'lesson' ? 'lesson' : 'capture' }
  } catch {
    return null
  }
}
