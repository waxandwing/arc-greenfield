import { useCallback, useId, useState, type ReactNode } from 'react'
import { deskCommittedRasterChromeEnabled } from '../desk/deskSliceRuntime'
import { DeskChromeSlice } from './DeskChromeSlice'

type Props = {
  children: ReactNode
  /** Kelly comp: IDEAS drawer rests collapsed; tray opens on tab click. */
  defaultExtended?: boolean
}

export function DeskGreenFoldersDrawer({ children, defaultExtended = false }: Props) {
  const [extended, setExtended] = useState(defaultExtended)
  const tabId = useId()
  const panelId = useId()

  const toggle = useCallback(() => {
    setExtended((current) => !current)
  }, [])

  // Textured PNG chrome by default (same gate as TO-DOS / edge tabs); SVG only when raster off.
  const slicesEnabled = deskCommittedRasterChromeEnabled()

  return (
    <aside
      className="arc-desk-tray-dock arc-desk-green-folders-drawer"
      aria-label="Folders tray"
      data-testid="arc-desk-tray-dock"
      data-extended={extended ? 'true' : 'false'}
      data-desk-slices={slicesEnabled ? 'true' : 'false'}
    >
      <div className="arc-desk-green-drawer-shell">
        <div
          className="arc-desk-green-drawer-art"
          aria-hidden="true"
          data-testid={slicesEnabled ? undefined : 'desk-source-ideas-drawer'}
        >
          {slicesEnabled ? (
            <DeskChromeSlice sliceId="ideas-drawer-chrome" testId="desk-slice-ideas-drawer" />
          ) : (
            <>
              {/* Circular stone accents only — post-its are live DeskPostIt siblings on the desk surface. */}
              <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--mustard" />
              <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--terracotta" />
              <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--blue" />
              <span className="arc-desk-green-drawer-token arc-desk-green-drawer-token--forest" />
            </>
          )}
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
