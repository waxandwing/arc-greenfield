import { useEffect, useRef, useState } from 'react'
import {
  assignPriority,
  bringBack,
  createEmptyFridgeDoorState,
  createMagnet,
  loadFridgeDoorFromBrowser,
  placeEntity,
  putAway,
  reconcileFridgeDoor,
  saveFridgeDoorToBrowser,
  validateFridgeDoorState,
  type FridgeDoorState,
  type FridgeEntityRef,
  type FridgePriority,
  type LessonWorkspace,
  type SectionLessonDateOverride,
  type UnitWorkspace,
} from '../planning'

export const FRIDGE_DOOR_CAPACITY = { rows: 3, columns: 4 } as const

type FridgeContext = {
  calendarId: string | null
  units: UnitWorkspace | null
  lessons: LessonWorkspace | null
  overrides: SectionLessonDateOverride[]
}

export function useFridgeDoorWorkspace({ calendarId, units, lessons, overrides }: FridgeContext) {
  const [state, setState] = useState<FridgeDoorState>(createEmptyFridgeDoorState)
  const stateRef = useRef<FridgeDoorState>(state)
  const [notice, setNotice] = useState<string | null>(null)
  const loadedCalendarId = useRef<string | null>(null)

  useEffect(() => {
    if (!calendarId || !units || !lessons) {
      const empty = createEmptyFridgeDoorState()
      loadedCalendarId.current = null
      stateRef.current = empty
      setState(empty)
      return
    }

    if (loadedCalendarId.current !== calendarId) {
      const loaded = loadFridgeDoorFromBrowser(
        calendarId,
        units.units,
        lessons.lessons,
        overrides,
        FRIDGE_DOOR_CAPACITY,
      )
      const next = loaded.status === 'restored'
        ? loaded.state
        : reconcileFridgeDoor(createEmptyFridgeDoorState(), units.units, lessons.lessons, overrides, FRIDGE_DOOR_CAPACITY)
      loadedCalendarId.current = calendarId
      stateRef.current = next
      setState(next)
      if (loaded.status === 'invalid') setNotice('Arc found Fridge Door layout data it could not verify. Canonical Units and Lessons are safe; the Door was rebuilt from recoverable planning state.')
      else if (loaded.status === 'unavailable') setNotice('Fridge Door storage is unavailable in this browser. Spatial changes may last only for this session.')
      else setNotice(null)
      return
    }

    const current = stateRef.current
    const next = reconcileFridgeDoor(current, units.units, lessons.lessons, overrides, FRIDGE_DOOR_CAPACITY)
    if (sameState(current, next)) return
    stateRef.current = next
    saveFridgeDoorToBrowser({ calendarId, state: next })
    setState(next)
  }, [calendarId, units, lessons, overrides])

  function commit(next: FridgeDoorState): string | null {
    if (!units || !lessons) return 'Arc cannot change the Fridge Door because planning state is incomplete. Nothing changed.'
    return commitWithCanonical(next, units, lessons)
  }

  function commitWithCanonical(next: FridgeDoorState, canonicalUnits: UnitWorkspace, canonicalLessons: LessonWorkspace): string | null {
    if (!calendarId) return 'Arc cannot change the Fridge Door because planning state is incomplete. Nothing changed.'
    try {
      const reconciled = reconcileFridgeDoor(next, canonicalUnits.units, canonicalLessons.lessons, overrides, FRIDGE_DOOR_CAPACITY)
      const errors = validateFridgeDoorState(reconciled, canonicalUnits.units, canonicalLessons.lessons)
      if (errors.length > 0) return `Arc refused that Fridge Door change. ${errors[0]}`
      const persisted = saveFridgeDoorToBrowser({ calendarId, state: reconciled })
      stateRef.current = reconciled
      setState(reconciled)
      setNotice(persisted ? null : 'This Fridge Door change is active for this session, but Arc could not save its spatial layout in this browser.')
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function createLooseMagnet(title: string): string | null {
    try {
      const magnet = createMagnet(title)
      let next: FridgeDoorState = { ...state, magnets: [...state.magnets, magnet] }
      next = placeRecoverably(next, `magnet:${magnet.id}`)
      return commit(next)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  function placeCanonicalEntity(entityRef: FridgeEntityRef, canonicalUnits: UnitWorkspace, canonicalLessons: LessonWorkspace): string | null {
    if (state.placements.some((item) => item.entityRef === entityRef)) return null
    return commitWithCanonical(placeRecoverably(state, entityRef), canonicalUnits, canonicalLessons)
  }

  function reposition(entityRef: FridgeEntityRef, row: number, column: number): string | null {
    if (!Number.isInteger(row) || !Number.isInteger(column) || row < 0 || column < 0 || row >= FRIDGE_DOOR_CAPACITY.rows || column >= FRIDGE_DOOR_CAPACITY.columns) {
      return 'Choose a valid Fridge Door position.'
    }
    const current = state.placements.find((item) => item.entityRef === entityRef)
    if (!current) return 'That Fridge item is no longer available.'
    if (current.stackId) return 'Open the stack before repositioning an individual item.'
    const occupied = state.placements.some((item) => item.surface === 'door' && item.entityRef !== entityRef && item.row === row && item.column === column)
    if (occupied) return 'That Fridge Door position is already occupied.'
    let next = placeEntity(state, entityRef, 'door', row, column)
    if (current.priority) next = assignPriority(next, entityRef, current.priority)
    return commit(next)
  }

  function setPriority(entityRef: FridgeEntityRef, priority: FridgePriority): string | null {
    if (!state.placements.some((item) => item.entityRef === entityRef)) return 'That Fridge item is no longer available.'
    return commit(assignPriority(state, entityRef, priority))
  }

  function putAwayItem(entityRef: FridgeEntityRef): string | null {
    const current = state.placements.find((item) => item.entityRef === entityRef)
    if (!current) return 'That Fridge item is no longer available.'
    if (current.stackId) return 'Open the stack before putting away an individual item.'
    return commit(putAway(state, entityRef))
  }

  function bringBackItem(entityRef: FridgeEntityRef): string | null {
    const current = state.placements.find((item) => item.entityRef === entityRef)
    if (!current) return 'That Fridge item is no longer available.'
    if (current.stackId) return 'Open the stack before bringing back an individual item.'
    try {
      return commit(bringBack(state, entityRef, FRIDGE_DOOR_CAPACITY))
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  return {
    state,
    notice,
    clearNotice: () => setNotice(null),
    createLooseMagnet,
    placeCanonicalEntity,
    reposition,
    setPriority,
    putAwayItem,
    bringBackItem,
  }
}

function placeRecoverably(state: FridgeDoorState, entityRef: FridgeEntityRef): FridgeDoorState {
  const slot = firstFreeDoorSlot(state)
  return slot
    ? placeEntity(state, entityRef, 'door', slot.row, slot.column)
    : placeEntity(state, entityRef, 'drawer', 0, state.placements.filter((item) => item.surface === 'drawer').length)
}

function firstFreeDoorSlot(state: FridgeDoorState): { row: number; column: number } | null {
  const occupied = new Set(state.placements.filter((item) => item.surface === 'door').map((item) => `${item.row}:${item.column}`))
  for (let row = 0; row < FRIDGE_DOOR_CAPACITY.rows; row += 1) {
    for (let column = 0; column < FRIDGE_DOOR_CAPACITY.columns; column += 1) {
      if (!occupied.has(`${row}:${column}`)) return { row, column }
    }
  }
  return null
}

function sameState(a: FridgeDoorState, b: FridgeDoorState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
