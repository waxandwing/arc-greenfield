import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { deskCanonicalPngUrl } from '../desk/deskCanonicalPng'
import { DESK_IDEAS_OPEN_EVENT, requestDeskIdeasCleanUp } from '../desk/deskIdeasEvents'

type Props = {
  children: ReactNode
  /** Kelly comp: IDEAS drawer rests collapsed; tray opens on tab click. */
  defaultExtended?: boolean
}

/**
 * IDEAS tray — Kelly `canonical/ideas-tray.png` is the visual authority
 * (replaces interim cardboard/`green-folders-drawer` chrome + CSS green pill).
 *
 * Clean up is a single stamped lip label locked to the tray top chrome —
 * not a planning pill, and not duplicated inside the well.
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

  /*
   * When the tabletop is vertically centered in .arc-desk-viewport, surface top sits
   * below the view panel. Nudge the tray (and Clean up lip) up so the open shell’s
   * top edge is flush with the viewport — not floating mid-panel or clipped oddly.
   */
  useEffect(() => {
    const surface = document.querySelector('.arc-desk-surface')
    const viewport = document.querySelector('.arc-desk-viewport')
    if (!(surface instanceof HTMLElement) || !(viewport instanceof HTMLElement)) return

    const syncViewportFlush = () => {
      const nudge = Math.max(
        0,
        Math.round(surface.getBoundingClientRect().top - viewport.getBoundingClientRect().top),
      )
      surface.style.setProperty('--arc-desk-ideas-viewport-flush', `${nudge}px`)
    }

    syncViewportFlush()
    const observer = new ResizeObserver(syncViewportFlush)
    observer.observe(viewport)
    observer.observe(surface)
    window.addEventListener('resize', syncViewportFlush)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncViewportFlush)
      surface.style.removeProperty('--arc-desk-ideas-viewport-flush')
    }
  }, [])

  /* Portaled onto arc-desk-surface so year-expanded drawer transforms do not hide Clean up.
   * Positioned as a stamped lip on the IDEAS tray top chrome (see .arc-desk-clean-up--lip). */
  const cleanUpLip = (
    <button
      type="button"
      className="arc-desk-clean-up arc-desk-clean-up--lip"
      data-testid="arc-desk-clean-up"
      data-ideas-clean-up="lip"
      title="Move desk post-its back into IDEAS"
      aria-label="Clean up desk post-its into IDEAS"
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
      data-desk-slices="true"
      data-ideas-authority="canonical-ideas-tray"
    >
      <div className="arc-desk-green-drawer-shell">
        <div className="arc-desk-green-drawer-art" aria-hidden="true" data-desk-kelly-asset="ideas-tray">
          <img
            className="arc-desk-ideas-tray-art"
            src={deskCanonicalPngUrl('ideasTray')}
            alt=""
            decoding="async"
            data-testid="desk-slice-ideas-drawer"
            data-ideas-tray="canonical"
          />
        </div>
        <div
          id={panelId}
          className="arc-desk-green-drawer-well"
          role="region"
          aria-labelledby={tabId}
          aria-hidden={extended ? undefined : true}
        >
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
      {surfaceHost ? createPortal(cleanUpLip, surfaceHost) : cleanUpLip}
    </aside>
  )
}
