import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { deskCanonicalPngUrl } from '../desk/deskCanonicalPng'
import { DESK_IDEAS_OPEN_EVENT, requestDeskIdeasCleanUp } from '../desk/deskIdeasEvents'
import {
  clampParkTopPct,
  loadIdeasTrayPark,
  saveIdeasTrayPark,
} from '../desk/deskIdeasTrayPark'

type Props = {
  children: ReactNode
  /** Kelly comp: IDEAS drawer rests collapsed; tray opens on tab click. */
  defaultExtended?: boolean
}

const PARK_DRAG_THRESHOLD_PX = 6

type ParkDragState = {
  pointerId: number
  originY: number
  startTopPct: number
  surfaceH: number
  armed: boolean
  moved: boolean
  latestTopPct: number
}

/**
 * IDEAS tray — Kelly `canonical/ideas-tray.png` is the visual authority
 * (replaces interim cardboard/`green-folders-drawer` chrome + CSS green pill).
 *
 * Clean up is a single stamped lip label on the tray's lower-right chrome —
 * not a planning pill, and not duplicated inside the well.
 * Vertical park offset persists so the tray can sit at the top or lower on the desk.
 */
export function DeskGreenFoldersDrawer({ children, defaultExtended = false }: Props) {
  const [extended, setExtended] = useState(defaultExtended)
  const [parkTopPct, setParkTopPct] = useState(() => loadIdeasTrayPark().topPct)
  const tabId = useId()
  const panelId = useId()
  const parkDragRef = useRef<ParkDragState | null>(null)
  const suppressTabClickRef = useRef(false)
  const moveListenerRef = useRef<((event: PointerEvent) => void) | null>(null)
  const upListenerRef = useRef<((event: PointerEvent) => void) | null>(null)

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

  useEffect(() => () => {
    if (moveListenerRef.current) window.removeEventListener('pointermove', moveListenerRef.current)
    if (upListenerRef.current) {
      window.removeEventListener('pointerup', upListenerRef.current)
      window.removeEventListener('pointercancel', upListenerRef.current)
    }
  }, [])

  const beginParkDrag = useCallback((event: ReactPointerEvent, fromTab = false) => {
    if (event.button !== 0) return
    // Don't steal drags that begin on Clean up or interactive well content.
    const target = event.target
    if (target instanceof Element) {
      if (target.closest('.arc-desk-clean-up')) return
      if (target.closest('.arc-desk-green-drawer-well')) return
    }
    const surface = document.querySelector('.arc-desk-surface')
    const surfaceH = surface instanceof HTMLElement ? surface.getBoundingClientRect().height : 0
    if (surfaceH <= 0) return

    const drag: ParkDragState = {
      pointerId: event.pointerId,
      originY: event.clientY,
      startTopPct: parkTopPct,
      surfaceH,
      armed: !fromTab,
      moved: false,
      latestTopPct: parkTopPct,
    }
    parkDragRef.current = drag

    const onMove = (moveEvent: PointerEvent) => {
      const current = parkDragRef.current
      if (!current || moveEvent.pointerId !== current.pointerId || current.surfaceH <= 0) return
      const deltaY = moveEvent.clientY - current.originY
      if (!current.armed) {
        if (Math.abs(deltaY) < PARK_DRAG_THRESHOLD_PX) return
        current.armed = true
        current.moved = true
      } else {
        current.moved = true
      }
      moveEvent.preventDefault()
      const next = clampParkTopPct(current.startTopPct + (deltaY / current.surfaceH) * 100)
      current.latestTopPct = next
      setParkTopPct(next)
    }

    const onUp = (upEvent: PointerEvent) => {
      const current = parkDragRef.current
      if (!current || upEvent.pointerId !== current.pointerId) return
      parkDragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      moveListenerRef.current = null
      upListenerRef.current = null
      if (current.moved) {
        suppressTabClickRef.current = true
        const next = clampParkTopPct(current.latestTopPct)
        setParkTopPct(next)
        saveIdeasTrayPark({ topPct: next })
      }
    }

    moveListenerRef.current = onMove
    upListenerRef.current = onUp
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [parkTopPct])

  const onTabClick = useCallback(() => {
    if (suppressTabClickRef.current) {
      suppressTabClickRef.current = false
      return
    }
    toggle()
  }, [toggle])

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
      data-desk-postit-drop="ideas-tray"
      data-tray-park-top={String(parkTopPct)}
      style={{ ['--arc-desk-tray-park-top' as string]: `${parkTopPct}%` }}
    >
      <div className="arc-desk-green-drawer-shell">
        <div
          className="arc-desk-green-drawer-art"
          aria-hidden="true"
          data-desk-kelly-asset="ideas-tray"
          data-testid="arc-desk-ideas-tray-park-handle"
          onPointerDown={(event) => beginParkDrag(event, false)}
        >
          <img
            className="arc-desk-ideas-tray-art"
            src={deskCanonicalPngUrl('ideasTray')}
            alt=""
            decoding="async"
            data-testid="desk-slice-ideas-drawer"
            data-ideas-tray="canonical"
            draggable={false}
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
            data-desk-postit-drop="ideas-tray"
            aria-label="Post-its in IDEAS"
          />
          {children}
        </div>
        {cleanUpLip}
        <button
          id={tabId}
          type="button"
          className="arc-desk-folders-tab arc-desk-ideas-tab"
          data-testid="arc-desk-folders-tab"
          data-ideas-tab="true"
          aria-expanded={extended}
          aria-controls={panelId}
          onPointerDown={(event) => beginParkDrag(event, true)}
          onClick={onTabClick}
        >
          <span className="sr-only">IDEAS</span>
        </button>
      </div>
    </aside>
  )
}
