import type { SchoolCalendar } from '../calendar'
import type { PlanningWorkspace } from './workspace'
import { hydrateUnitWorkspace, type UnitWorkspace, type UnitWorkspaceInput } from './unitWorkspace'

const STORAGE_KEY = 'arc.units.v1'

type StoredUnits = {
  schemaVersion: 1
  input: UnitWorkspaceInput
}

export type UnitLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; workspace: UnitWorkspace; input: UnitWorkspaceInput }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeUnits(input: UnitWorkspaceInput): string {
  return JSON.stringify({ schemaVersion: 1, input } satisfies StoredUnits)
}

export function deserializeUnits(raw: string): UnitWorkspaceInput | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredUnits>
    if (parsed.schemaVersion !== 1 || !parsed.input) return null
    if (!Array.isArray(parsed.input.units) || typeof parsed.input.calendarId !== 'string') return null
    return {
      calendarId: parsed.input.calendarId,
      units: parsed.input.units.map((unit) => ({
        ...unit,
        placement: unit.placement ? { ...unit.placement } : null,
      })),
    }
  } catch {
    return null
  }
}

export function saveUnitsToBrowser(input: UnitWorkspaceInput): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeUnits(input))
    return true
  } catch {
    return false
  }
}

export function loadUnitsFromBrowser(
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
): UnitLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }

  if (!raw) return { status: 'empty' }
  const input = deserializeUnits(raw)
  if (!input || input.calendarId !== calendar.id) return input ? { status: 'empty' } : { status: 'invalid' }

  try {
    return { status: 'restored', workspace: hydrateUnitWorkspace(input, calendar, planning), input }
  } catch {
    return { status: 'invalid' }
  }
}
