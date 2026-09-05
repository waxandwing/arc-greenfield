import { hydratePlanningWorkspace, type PlanningWorkspace, type PlanningWorkspaceInput } from './workspace'

const STORAGE_KEY = 'arc.planningWorkspace.v1'

type StoredPlanningWorkspace = {
  schemaVersion: 1
  input: PlanningWorkspaceInput
}

export type PlanningWorkspaceLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; workspace: PlanningWorkspace; input: PlanningWorkspaceInput }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializePlanningWorkspace(input: PlanningWorkspaceInput): string {
  const workspace = hydratePlanningWorkspace(input)
  return JSON.stringify({ schemaVersion: 1, input: workspace } satisfies StoredPlanningWorkspace)
}

export function deserializePlanningWorkspace(raw: string): PlanningWorkspaceInput | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPlanningWorkspace>
    if (parsed.schemaVersion !== 1 || !parsed.input) return null
    const workspace = hydratePlanningWorkspace(parsed.input)
    return {
      calendarId: workspace.calendarId,
      courses: workspace.courses.map((course) => ({ ...course })),
      sections: workspace.sections.map((section) => ({ ...section })),
      dayNotes: (workspace.dayNotes ?? []).map((note) => ({ ...note })),
    }
  } catch {
    return null
  }
}

export function savePlanningWorkspaceToBrowser(input: PlanningWorkspaceInput): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializePlanningWorkspace(input))
    return true
  } catch {
    return false
  }
}

export function loadPlanningWorkspaceFromBrowser(expectedCalendarId: string): PlanningWorkspaceLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }

  if (!raw) return { status: 'empty' }
  const input = deserializePlanningWorkspace(raw)
  if (!input) return { status: 'invalid' }
  if (input.calendarId !== expectedCalendarId) return { status: 'empty' }

  try {
    return { status: 'restored', workspace: hydratePlanningWorkspace(input), input }
  } catch {
    return { status: 'invalid' }
  }
}
