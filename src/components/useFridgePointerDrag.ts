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

export function useFridgePointerDrag(handlers: DropHandlers) {
  const activeRef = useRef<ActiveDrag | null>(null)
  const [active, setActive] = useState<FridgeDragPayload | null>(null)

  function start(event: ReactPointerEvent<HTMLElement>, payload: FridgeDragPayload) {
    if (event.button !== 0 || activeRef.current) return
    event.preventDefault()
    activeRef.current = { ...payload, pointerId: event.pointerId }
    setActive(payload)

    const finish = (pointerEvent: PointerEvent) => {
      if (activeRef.current?.pointerId !== pointerEvent.pointerId) return
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      complete(pointerEvent.clientX, pointerEvent.clientY)
    }
    const cancel = (pointerEvent: PointerEvent) => {
      if (activeRef.current?.pointerId !== pointerEvent.pointerId) return
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      clear()
    }

    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
  }

  function complete(clientX: number, clientY: number) {
    const payload = activeRef.current
    clear()
    if (!payload) return

    const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    if (!target) return

    const drawerTarget = target.closest<HTMLElement>('[data-fridge-drop-drawer="true"]')
    const doorTarget = target.closest<HTMLElement>('[data-fridge-drop-door="true"]')
    const cellTarget = target.closest<HTMLElement>('[data-fridge-drop-cell="true"]')

    if (payload.kind === 'entity' && payload.source === 'drawer') {
      if (!doorTarget) return
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
    setActive(null)
  }

  return {
    active,
    startEntity: (event: ReactPointerEvent<HTMLElement>, entityRef: FridgeEntityRef, source: 'door' | 'drawer') => start(event, { kind: 'entity', entityRef, source }),
    startStack: (event: ReactPointerEvent<HTMLElement>, stackId: string) => start(event, { kind: 'stack', stackId, source: 'door' }),
  }
}

function readCellCoordinates(cell: HTMLElement): { row: number; column: number } | null {
  const row = Number(cell.dataset.fridgeRow)
  const column = Number(cell.dataset.fridgeColumn)
  return Number.isInteger(row) && Number.isInteger(column) ? { row, column } : null
}
