import { useCallback, useId, useState, type ReactNode } from 'react'
import { deskCommittedRasterChromeEnabled } from '../desk/deskSliceRuntime'
import { DeskChromeSlice } from './DeskChromeSlice'

type Props = {
  children: ReactNode
  /** Kelly: TO-DOS rests as a tab on the planner left edge; panel opens on click. */
  defaultExtended?: boolean
}

/** Physical TO-DOS folder chrome (denim tab) wrapping the MSC priority pad on the wood desk. */
export function DeskTodosFolder({ children, defaultExtended = false }: Props) {
  const [extended, setExtended] = useState(defaultExtended)
  const tabId = useId()
  const panelId = useId()
  const slicesEnabled = deskCommittedRasterChromeEnabled()

  const toggle = useCallback(() => {
    setExtended((current) => !current)
  }, [])

  return (
    <div
      className="arc-desk-todos-folder"
      data-testid="arc-desk-todos-folder"
      data-desk-slices={slicesEnabled ? 'true' : 'false'}
      data-extended={extended ? 'true' : 'false'}
    >
      <div
        id={panelId}
        className="arc-desk-todos-folder-panel"
        role="region"
        aria-labelledby={tabId}
        aria-hidden={extended ? undefined : true}
      >
        {slicesEnabled ? (
          <DeskChromeSlice sliceId="todos-folder-body" testId="desk-slice-todos-body" />
        ) : (
          <div className="arc-desk-todos-folder-sheet" aria-hidden="true" data-testid="desk-source-todos-body" />
        )}
        <div className="arc-desk-todos-folder-body">{children}</div>
      </div>
      <button
        id={tabId}
        type="button"
        className="arc-desk-todos-folder-tab"
        data-testid="arc-desk-todos-tab"
        aria-expanded={extended}
        aria-controls={panelId}
        onClick={toggle}
      >
        {slicesEnabled ? (
          <DeskChromeSlice sliceId="todos-folder-tab" testId="desk-slice-todos-tab" />
        ) : (
          <span className="arc-desk-todos-folder-tab-fallback" aria-hidden="true" data-testid="desk-source-todos-tab" />
        )}
        <span className="arc-desk-todos-folder-tab-label">TO-DOS</span>
      </button>
    </div>
  )
}
