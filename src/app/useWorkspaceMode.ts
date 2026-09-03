import { useState } from 'react'

export type WorkspaceMode =
  | 'calendar'
  | 'calendar-setup'
  | 'terms'
  | 'classes'
  | 'units'
  | 'lessons'
  | 'recovery'

export function useWorkspaceMode() {
  const [mode, setMode] = useState<WorkspaceMode>('calendar')

  return {
    mode,
    open: setMode,
    close: () => setMode('calendar'),
  }
}
