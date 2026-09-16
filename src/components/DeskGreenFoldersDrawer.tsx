import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DESK_IDEAS_OPEN_EVENT, requestDeskIdeasCleanUp } from '../desk/deskIdeasEvents'

type Props = {
  children: ReactNode
  /** Kelly comp: IDEAS drawer rests collapsed; tray opens on tab click. */
  defaultExtended?: boolean
}

/**
 * IDEAS tray — Kelly `canonical/ideas-tray.png` is the visual authority
 * (replaces interim cardboard/`green-folders-drawer` chrome + CSS green pill).
 */
export function DeskGreenFoldersDrawer({ children, defaultExtended = false }: Props) {
  const [extended, setExtended] = useState(defaultExtended)
  const [surfaceHost, setSurfaceHost] = useState<Element | null>(null)
  const tabId = useId()
  const panelId = useId()

  const toggle = useCallback(() => {
    setExtended((current) => !current)
  }, [])

  const openDrawer = useCallback(() => {
    setExtended(true)
  }, [])

  useEffect(() => {
    function onOpen() {
      openDrawer()
    }
    window.addEventListener(DESK_IDEAS_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(DESK_IDEAS_OPEN_EVENT, onOpen)
  }, [openDrawer])

  useEffect(() => {
    setSurfaceHost(document.querySelector('.arc-desk-surface'))
  }, [])

  const cleanUpTab = (
    <button
      type="button"
      className="arc-desk-clean-up arc-desk-clean-up--tab-side"
      data-testid="arc-desk-clean-up-tab"
      title="Move desk post-its back into IDEAS"
      onClick={() => requestDeskIdeasCleanUp()}
    >
      Clean up
    </button>
  )

  return (
    <aside
      className="arc-desk-tray-dock arc-desk-green-folders-drawer"
      aria-label="IDEAS tray"
      data-testid="arc-desk-tray-dock"
      data-extended={extended ? 'true' : 'false'}
      data-desk-slices="false"
      data-ideas-authority="canonical-ideas-tray"
    >
      <div className="arc-desk-green-drawer-shell">
        <div
          className="arc-desk-green-drawer-art"
          aria-hidden="true"
          data-testid="desk-source-ideas-drawer"
        />
        <div
          id={panelId}
          className="arc-desk-green-drawer-well"
          role="region"
          aria-labelledby={tabId}
          aria-hidden={extended ? undefined : true}
        >
          <div className="arc-desk-ideas-well-toolbar">
            <button
              type="button"
              className="arc-desk-clean-up"
              data-testid="arc-desk-clean-up"
              title="Move desk post-its back into IDEAS"
              onClick={() => requestDeskIdeasCleanUp()}
            >
              Clean up
            </button>
          </div>
          <div
            className="arc-desk-ideas-accent-slot"
            data-testid="arc-desk-ideas-accent-slot"
            aria-label="Post-its in IDEAS"
          />
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
          <span className="sr-only">IDEAS</span>
        </button>
      </div>
      {/* Portaled onto arc-desk-surface so year-expanded drawer transforms do not hide Clean up. */}
      {surfaceHost ? createPortal(cleanUpTab, surfaceHost) : cleanUpTab}
    </aside>
  )
}
