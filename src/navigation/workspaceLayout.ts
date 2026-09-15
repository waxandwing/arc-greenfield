import {
  DEFAULT_DESK_LAYOUT,
  WORKSPACE_LAYOUT_STORAGE_KEY,
  loadDeskLayout,
  saveDeskLayout,
  normalizeDeskLayout,
  deskLayoutUsesDefault,
  resetDeskLayoutToArcDefault,
  moveDeskObject,
  assignDeskObjectZone,
  placementForObject,
  type DeskLayoutState,
  type DeskObjectKind,
  type DeskMoveDirection,
  type DeskZoneName,
} from './deskLayout'

export type WorkspaceLayoutState = DeskLayoutState

export {
  WORKSPACE_LAYOUT_STORAGE_KEY,
  DEFAULT_DESK_LAYOUT as DEFAULT_WORKSPACE_LAYOUT,
  deskLayoutUsesDefault as workspaceLayoutUsesDefault,
  resetDeskLayoutToArcDefault as resetWorkspaceLayoutToArcDefault,
  moveDeskObject,
  assignDeskObjectZone,
  placementForObject,
  normalizeDeskLayout as normalizeWorkspaceLayout,
}
export type { DeskObjectKind, DeskMoveDirection, DeskZoneName }

export function loadWorkspaceLayout(storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()): WorkspaceLayoutState {
  return loadDeskLayout(storage)
}

export function saveWorkspaceLayout(layout: WorkspaceLayoutState, storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()) {
  saveDeskLayout(layout, storage)
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
