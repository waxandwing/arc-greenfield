import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

export type DeskPostItTone = 'mustard' | 'pink' | 'blue' | 'cream'

export type DeskPostItPosition = {
  leftPct: number
  topPct: number
}

export type DeskPostItDragEndInfo = {
  postItId: string
  position: DeskPostItPosition
  rect: DOMRect
  didMove: boolean
}

type Props = {
  tone?: DeskPostItTone
  /** Stable id for session position persistence + test hooks. */
  postItId: string
  /** Initial placement as % of arc-desk-surface. */
  defaultPosition: DeskPostItPosition
  /** Controlled position — when set, parent owns placement (linked stacks). */
  position?: DeskPostItPosition
  onPositionChange?: (position: DeskPostItPosition) => void
  /** Fired while an armed desk drag is moving (for drop-target highlights). */
  onDragMove?: (info: { postItId: string; clientX: number; clientY: number; rect: DOMRect }) => void
  onDragEnd?: (info: DeskPostItDragEndInfo) => void
  /** Rotate slightly so stickies look hand-placed. */
  tiltDeg?: number
  className?: string
  testId?: string
  dragEnabled?: boolean
  stackId?: string | null
  /** When true, show lesson corner-dot + light marking for unit/class grouping. */
  lesson?: boolean
  /**
   * Drag percentage reference. Defaults to `.arc-desk-surface`.
   * IDEAS tray stickies use the accent slot so in-tray drags stay local.
   */
  dragSurfaceSelector?: string
  children?: ReactNode
  'aria-label'?: string
}

const STORAGE_KEY = 'arc.desk-postit-positions.v1'
/** Pixels of movement before a pointer on an editable target becomes a desk drag. */
const EDIT_DRAG_THRESHOLD_PX = 8

function readStoredPosition(postItId: string): DeskPostItPosition | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, DeskPostItPosition>
    const next = parsed[postItId]
    if (!next || typeof next.leftPct !== 'number' || typeof next.topPct !== 'number') return null
    return {
      leftPct: clamp(next.leftPct, 0, 92),
      topPct: clamp(next.topPct, 0, 88),
    }
  } catch {
    return null
  }
}

function writeStoredPosition(postItId: string, position: DeskPostItPosition) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, DeskPostItPosition>) : {}
    parsed[postItId] = position
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore quota / private mode */
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type DragState = {
  pointerId: number
  originX: number
  originY: number
  startLeft: number
  startTop: number
  surfaceW: number
  surfaceH: number
  /** True until movement exceeds threshold when pointer began on an editable control. */
  deferred: boolean
  armed: boolean
}

/**
 * Independent desk post-it — lives on arc-desk-surface, not baked into IDEAS tray SVG/PNG chrome.
 * Pointer-drag repositions against the desk surface so stickies stay separate furniture.
 * Click/focus on textarea/contenteditable does not start a drag; a short drag threshold still allows move.
 */
export function DeskPostIt({
  tone = 'mustard',
  postItId,
  defaultPosition,
  position: controlledPosition,
  onPositionChange,
  onDragMove,
  onDragEnd,
  tiltDeg = -2.5,
  className = '',
  testId,
  dragEnabled = true,
  stackId = null,
  lesson = false,
  dragSurfaceSelector = '.arc-desk-surface',
  children,
  'aria-label': ariaLabel = 'Desk post-it',
}: Props) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const isControlled = controlledPosition !== undefined
  const [uncontrolledPosition, setUncontrolledPosition] = useState<DeskPostItPosition>(
    () => readStoredPosition(postItId) ?? defaultPosition,
  )
  const position = controlledPosition ?? uncontrolledPosition
  const positionRef = useRef(position)
  positionRef.current = position
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  const resolveDragSurface = useCallback((): HTMLElement | null => {
    const scoped = document.querySelector(dragSurfaceSelector)
    if (scoped instanceof HTMLElement) return scoped
    const fallback = document.querySelector('.arc-desk-surface')
    return fallback instanceof HTMLElement ? fallback : null
  }, [dragSurfaceSelector])

  useEffect(() => {
    if (isControlled) return
    writeStoredPosition(postItId, uncontrolledPosition)
  }, [isControlled, postItId, uncontrolledPosition])

  useEffect(() => {
    if (!isControlled) return
    writeStoredPosition(postItId, controlledPosition)
  }, [controlledPosition, isControlled, postItId])

  const setPosition = useCallback((next: DeskPostItPosition) => {
    if (isControlled) {
      onPositionChange?.(next)
      return
    }
    setUncontrolledPosition(next)
  }, [isControlled, onPositionChange])

  const armDrag = useCallback((pointerId: number) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== pointerId || drag.armed) return
    drag.deferred = false
    drag.armed = true
    const active = document.activeElement
    if (active instanceof HTMLElement && nodeRef.current?.contains(active)) {
      active.blur()
    }
    try {
      nodeRef.current?.setPointerCapture(pointerId)
    } catch {
      /* ignore */
    }
    setDragging(true)
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || event.button !== 0) return
    const target = event.target as HTMLElement | null
    // Keep capture form controls interactive; never drag from buttons/links/inputs/selects.
    if (target?.closest('button, a, input, select, label, dialog')) return
    const surface = resolveDragSurface()
    if (!surface || !nodeRef.current) return
    const surfaceRect = surface.getBoundingClientRect()
    const editTarget = Boolean(target?.closest('textarea, [contenteditable="true"]'))
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startLeft: position.leftPct,
      startTop: position.topPct,
      surfaceW: surfaceRect.width,
      surfaceH: surfaceRect.height,
      deferred: editTarget,
      armed: !editTarget,
    }
    if (!editTarget) {
      nodeRef.current.setPointerCapture(event.pointerId)
      setDragging(true)
      event.preventDefault()
    }
  }, [dragEnabled, position.leftPct, position.topPct, resolveDragSurface])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || drag.surfaceW <= 0 || drag.surfaceH <= 0) return

    if (drag.deferred && !drag.armed) {
      const dist = Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY)
      if (dist < EDIT_DRAG_THRESHOLD_PX) return
      armDrag(event.pointerId)
      event.preventDefault()
    }

    if (!drag.armed) return

    const dxPct = ((event.clientX - drag.originX) / drag.surfaceW) * 100
    const dyPct = ((event.clientY - drag.originY) / drag.surfaceH) * 100
    setPosition({
      leftPct: clamp(drag.startLeft + dxPct, 0, 92),
      topPct: clamp(drag.startTop + dyPct, 0, 88),
    })
    if (onDragMove && nodeRef.current) {
      onDragMove({
        postItId,
        clientX: event.clientX,
        clientY: event.clientY,
        rect: nodeRef.current.getBoundingClientRect(),
      })
    }
  }, [armDrag, onDragMove, postItId, setPosition])

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const wasArmed = drag.armed
    dragRef.current = null
    setDragging(false)
    if (wasArmed) {
      try {
        nodeRef.current?.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
      const node = nodeRef.current
      if (node && onDragEnd) {
        onDragEnd({
          postItId,
          position: positionRef.current,
          rect: node.getBoundingClientRect(),
          didMove: true,
        })
      }
    }
  }, [onDragEnd, postItId])

  // Deferred edit-target drags do not capture on pointerdown; track leave via window listeners.
  useEffect(() => {
    const onWindowPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !drag.deferred || drag.armed || drag.pointerId !== event.pointerId) return
      const dist = Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY)
      if (dist < EDIT_DRAG_THRESHOLD_PX) return
      armDrag(event.pointerId)
      event.preventDefault()
    }
    const onWindowPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      if (drag.deferred && !drag.armed) {
        dragRef.current = null
      }
    }
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)
    }
  }, [armDrag])

  return (
    <div
      ref={nodeRef}
      className={`arc-desk-post-it arc-desk-post-it--${tone}${dragging ? ' arc-desk-post-it--dragging' : ''}${stackId ? ' arc-desk-post-it--linked' : ''}${lesson ? ' arc-desk-post-it--lesson' : ''}${className ? ` ${className}` : ''}`}
      data-testid={testId ?? `arc-desk-post-it-${postItId}`}
      data-desk-post-it={postItId}
      data-desk-post-it-tone={tone}
      data-desk-post-it-stack={stackId ?? undefined}
      data-desk-post-it-lesson={lesson ? 'true' : undefined}
      data-dragging={dragging ? 'true' : 'false'}
      aria-label={lesson ? `${ariaLabel} (lesson)` : ariaLabel}
      style={{
        left: `${position.leftPct}%`,
        top: `${position.topPct}%`,
        transform: `rotate(${tiltDeg}deg)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {children}
    </div>
  )
}
