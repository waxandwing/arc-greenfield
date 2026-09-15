import { useCallback, useId, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Start extended so tray captures remain visible on the wood dock (desk law). */
  defaultExtended?: boolean
}

export function DeskGreenFoldersDrawer({ children, defaultExtended = true }: Props) {
  const [extended, setExtended] = useState(defaultExtended)
  const tabId = useId()
  const panelId = useId()

  const toggle = useCallback(() => {
    setExtended((current) => !current)
  }, [])

  return (
    <aside
      className="arc-desk-tray-dock arc-desk-green-folders-drawer"
      aria-label="Folders tray"
      data-testid="arc-desk-tray-dock"
      data-extended={extended ? 'true' : 'false'}
    >
      <div className="arc-desk-green-drawer-shell">
        <div className="arc-desk-green-drawer-art" aria-hidden="true">
          <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--mustard" />
          <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--terracotta" />
          <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--blue" />
        </div>
        <div
          id={panelId}
          className="arc-desk-green-drawer-well"
          role="region"
          aria-labelledby={tabId}
          aria-hidden={extended ? undefined : true}
        >
          {children}
        </div>
        <button
          id={tabId}
          type="button"
          className="arc-desk-folders-tab arc-desk-ideas-tab"
          data-testid="arc-desk-folders-tab"
          data-ideas-tab="true"
          aria-expanded={extended}
          aria-controls={panelId}
          onClick={toggle}
        >
          IDEAS
        </button>
      </div>
    </aside>
  )
}
