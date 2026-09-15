import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

export type DeskPostItTone = 'mustard' | 'pink' | 'blue' | 'cream'

export type DeskPostItPosition = {
  leftPct: number
  topPct: number
}

type Props = {
  tone?: DeskPostItTone
  /** Stable id for session position persistence + test hooks. */
  postItId: string
  /** Initial placement as % of arc-desk-surface. */
  defaultPosition: DeskPostItPosition
  /** Rotate slightly so stickies look hand-placed. */
  tiltDeg?: number
  className?: string
  testId?: string
  dragEnabled?: boolean
  children?: ReactNode
  'aria-label'?: string
}

const STORAGE_KEY = 'arc.desk-postit-positions.v1'

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

/**
 * Independent desk post-it — lives on arc-desk-surface, not baked into IDEAS tray SVG/PNG chrome.
 * Pointer-drag repositions against the desk surface so stickies stay separate furniture.
 */
export function DeskPostIt({
  tone = 'mustard',
  postItId,
  defaultPosition,
  tiltDeg = -2.5,
  className = '',
  testId,
  dragEnabled = true,
  children,
  'aria-label': ariaLabel = 'Desk post-it',
}: Props) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<DeskPostItPosition>(() => readStoredPosition(postItId) ?? defaultPosition)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startLeft: number
    startTop: number
    surfaceW: number
    surfaceH: number
  } | null>(null)

  useEffect(() => {
    writeStoredPosition(postItId, position)
  }, [postItId, position])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || event.button !== 0) return
    const target = event.target as HTMLElement | null
    // Keep capture form controls interactive; drag from pad chrome / empty well.
    if (target?.closest('button, a, input, textarea, select, label, dialog')) return
    const surface = nodeRef.current?.closest('.arc-desk-surface') as HTMLElement | null
    if (!surface || !nodeRef.current) return
    const surfaceRect = surface.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startLeft: position.leftPct,
      startTop: position.topPct,
      surfaceW: surfaceRect.width,
      surfaceH: surfaceRect.height,
    }
    nodeRef.current.setPointerCapture(event.pointerId)
    setDragging(true)
    event.preventDefault()
  }, [dragEnabled, position.leftPct, position.topPct])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || drag.surfaceW <= 0 || drag.surfaceH <= 0) return
    const dxPct = ((event.clientX - drag.originX) / drag.surfaceW) * 100
    const dyPct = ((event.clientY - drag.originY) / drag.surfaceH) * 100
    setPosition({
      leftPct: clamp(drag.startLeft + dxPct, 0, 92),
      topPct: clamp(drag.startTop + dyPct, 0, 88),
    })
  }, [])

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    try {
      nodeRef.current?.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }, [])

  return (
    <div
      ref={nodeRef}
      className={`arc-desk-post-it arc-desk-post-it--${tone}${dragging ? ' arc-desk-post-it--dragging' : ''}${className ? ` ${className}` : ''}`}
      data-testid={testId ?? `arc-desk-post-it-${postItId}`}
      data-desk-post-it={postItId}
      data-desk-post-it-tone={tone}
      data-dragging={dragging ? 'true' : 'false'}
      aria-label={ariaLabel}
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
