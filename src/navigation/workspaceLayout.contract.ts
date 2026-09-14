import {
  WORKSPACE_LAYOUT_STORAGE_KEY,
  assignDeskObjectZone,
  loadWorkspaceLayout,
  saveWorkspaceLayout,
  workspaceLayoutUsesDefault,
  resetWorkspaceLayoutToArcDefault,
  DEFAULT_WORKSPACE_LAYOUT,
} from './workspaceLayout'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}

memory.set('arc.desk-layout.v1', JSON.stringify(assignDeskObjectZone(DEFAULT_WORKSPACE_LAYOUT, 'tray', 'mid-upper')))
assert(loadWorkspaceLayout(storage).placements.find((p) => p.object === 'tray')?.zone === 'mid-upper', 'Workspace layout must migrate legacy desk-layout key.')

saveWorkspaceLayout(assignDeskObjectZone(DEFAULT_WORKSPACE_LAYOUT, 'msc', 'notes-rail'), storage)
assert(memory.has(WORKSPACE_LAYOUT_STORAGE_KEY), 'Workspace layout must write canonical storage key.')
assert(workspaceLayoutUsesDefault(resetWorkspaceLayoutToArcDefault()) === true, 'Reset workspace layout must restore Arc default.')

console.log('Workspace layout contract passed')
