import { useState } from 'react'

export type WorkspaceMode =
  | 'calendar'
  | 'onboarding'
  | 'calendar-setup'
  | 'terms'
  | 'classes'
  | 'teaching-day'
  | 'import'
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
