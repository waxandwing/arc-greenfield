import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { FridgeEntityRef } from '../planning'

type FridgeDragPayload =
  | { kind: 'entity'; entityRef: FridgeEntityRef; source: 'door' | 'drawer' }
  | { kind: 'stack'; stackId: string; source: 'door' }

type DropHandlers = {
  onRepositionEntity: (entityRef: FridgeEntityRef, row: number, column: number) => string | null
  onRepositionStack: (stackId: string, row: number, column: number) => string | null
  onPutAway: (entityRef: FridgeEntityRef) => string | null
  onBringBack: (entityRef: FridgeEntityRef) => string | null
  onReject: (message: string) => void
}

type ActiveDrag = FridgeDragPayload & { pointerId: number }
type PointerPosition = { x: number; y: number }

const AUTO_SCROLL_EDGE = 56
const AUTO_SCROLL_STEP = 14

export function useFridgePointerDrag(handlers: DropHandlers) {
  const activeRef = useRef<ActiveDrag | null>(null)
  const pointerRef = useRef<PointerPosition | null>(null)
  const autoScrollFrameRef = useRef<number | null>(null)
  const [active, setActive] = useState<FridgeDragPayload | null>(null)

  function start(event: ReactPointerEvent<HTMLElement>, payload: FridgeDragPayload) {
    if (event.button !== 0 || activeRef.current) return
    event.preventDefault()
    activeRef.current = { ...payload, pointerId: event.pointerId }
    pointerRef.current = { x: event.clientX, y: event.clientY }
    setActive(payload)
    beginAutoScroll()

    const move = (pointerEvent: PointerEvent) => {
      if (activeRef.current?.pointerId !== pointerEvent.pointerId) return
      pointerRef.current = { x: pointerEvent.clientX, y: pointerEvent.clientY }
    }
    const finish = (pointerEvent: PointerEvent) => {
      if (activeRef.current?.pointerId !== pointerEvent.pointerId) return
      cleanupListeners()
      complete(pointerEvent.clientX, pointerEvent.clientY)
    }
    const cancel = (pointerEvent: PointerEvent) => {
      if (activeRef.current?.pointerId !== pointerEvent.pointerId) return
      cleanupListeners()
      clear()
    }
    const cleanupListeners = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
  }

  function beginAutoScroll() {
    if (autoScrollFrameRef.current !== null) return
    const tick = () => {
      if (!activeRef.current) {
        autoScrollFrameRef.current = null
        return
      }
      const pointer = pointerRef.current
      if (pointer) {
        let deltaY = 0
        if (pointer.y < AUTO_SCROLL_EDGE) deltaY = -AUTO_SCROLL_STEP
        else if (pointer.y > window.innerHeight - AUTO_SCROLL_EDGE) deltaY = AUTO_SCROLL_STEP
        if (deltaY !== 0) window.scrollBy(0, deltaY)
      }
      autoScrollFrameRef.current = window.requestAnimationFrame(tick)
    }
    autoScrollFrameRef.current = window.requestAnimationFrame(tick)
  }

  function complete(clientX: number, clientY: number) {
    const payload = activeRef.current
    clear()
    if (!payload) return

    const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const liveCellTarget = findLiveCellAtPoint(clientX, clientY)
    const drawerTarget = target?.closest<HTMLElement>('[data-fridge-drop-drawer="true"]') ?? null
    const doorTarget = target?.closest<HTMLElement>('[data-fridge-drop-door="true"]') ?? null
    const cellTarget = liveCellTarget ?? target?.closest<HTMLElement>('[data-fridge-drop-cell="true"]') ?? null

    if (payload.kind === 'entity' && payload.source === 'drawer') {
      if (cellTarget) {
        const coordinates = readCellCoordinates(cellTarget)
        if (!coordinates) {
          handlers.onReject('Arc could not identify that Fridge Door position. Nothing changed.')
          return
        }
        const result = handlers.onRepositionEntity(payload.entityRef, coordinates.row, coordinates.column)
        if (result) handlers.onReject(result)
        return
      }
      if (!doorTarget) return
      const result = handlers.onBringBack(payload.entityRef)
      if (result) handlers.onReject(result)
      return
    }

    if (drawerTarget) {
      if (payload.kind === 'stack') {
        handlers.onReject('Stacks stay together on the Fridge Door. Open the stack to put away an individual item.')
        return
      }
      const result = handlers.onPutAway(payload.entityRef)
      if (result) handlers.onReject(result)
      return
    }

    if (!cellTarget) return
    const coordinates = readCellCoordinates(cellTarget)
    if (!coordinates) {
      handlers.onReject('Arc could not identify that Fridge Door position. Nothing changed.')
      return
    }

    const result = payload.kind === 'stack'
      ? handlers.onRepositionStack(payload.stackId, coordinates.row, coordinates.column)
      : handlers.onRepositionEntity(payload.entityRef, coordinates.row, coordinates.column)
    if (result) handlers.onReject(result)
  }

  function clear() {
    activeRef.current = null
    pointerRef.current = null
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current)
      autoScrollFrameRef.current = null
    }
    setActive(null)
  }

  return {
    active,
    startEntity: (event: ReactPointerEvent<HTMLElement>, entityRef: FridgeEntityRef, source: 'door' | 'drawer') => start(event, { kind: 'entity', entityRef, source }),
    startStack: (event: ReactPointerEvent<HTMLElement>, stackId: string) => start(event, { kind: 'stack', stackId, source: 'door' }),
  }
}

function findLiveCellAtPoint(clientX: number, clientY: number): HTMLElement | null {
  const cells = [...document.querySelectorAll<HTMLElement>('[data-fridge-drop-cell="true"]')]
  return cells.find((cell) => {
    const rect = cell.getBoundingClientRect()
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  }) ?? null
}

function readCellCoordinates(cell: HTMLElement): { row: number; column: number } | null {
  const row = Number(cell.dataset.fridgeRow)
  const column = Number(cell.dataset.fridgeColumn)
  return Number.isInteger(row) && Number.isInteger(column) ? { row, column } : null
}
