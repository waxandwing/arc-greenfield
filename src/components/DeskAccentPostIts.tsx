import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  DeskPostIt,
  type DeskPostItDragEndInfo,
  type DeskPostItPosition,
  type DeskPostItTone,
} from './DeskPostIt'
import {
  createDeskPostItLink,
  deskPostItStackForMember,
  findSignificantOverlapTarget,
  loadDeskPostItLinks,
  pairKey,
  saveDeskPostItLinks,
  type DeskPostItLinkWorkspace,
  type DeskPostItRect,
} from '../planning/deskPostItLinks'

const NOTE_STORAGE_KEY = 'arc.desk-postit-notes.v1'
const POSITION_STORAGE_KEY = 'arc.desk-postit-positions.v1'

type AccentSpec = {
  postItId: string
  tone: DeskPostItTone
  defaultPosition: DeskPostItPosition
  tiltDeg: number
  testId: string
  label: string
}

const ACCENTS: AccentSpec[] = [
  {
    postItId: 'accent-mustard',
    tone: 'mustard',
    defaultPosition: { leftPct: 31.5, topPct: 1.5 },
    tiltDeg: -6,
    testId: 'arc-desk-post-it-accent-mustard',
    label: 'Mustard post-it',
  },
  {
    postItId: 'accent-pink',
    tone: 'pink',
    defaultPosition: { leftPct: 41.5, topPct: 0.8 },
    tiltDeg: 4,
    testId: 'arc-desk-post-it-accent-pink',
    label: 'Pink post-it',
  },
  {
    postItId: 'accent-blue',
    tone: 'blue',
    defaultPosition: { leftPct: 51.5, topPct: 1.6 },
    tiltDeg: -3,
    testId: 'arc-desk-post-it-accent-blue',
    label: 'Blue post-it',
  },
]

type LinkPrompt = {
  a: string
  b: string
  anchor: DeskPostItPosition
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readStoredNote(postItId: string): string {
  try {
    const raw = localStorage.getItem(NOTE_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next = parsed[postItId]
    return typeof next === 'string' ? next : ''
  } catch {
    return ''
  }
}

function writeStoredNote(postItId: string, text: string) {
  try {
    const raw = localStorage.getItem(NOTE_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    if (text) parsed[postItId] = text
    else delete parsed[postItId]
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore quota / private mode */
  }
}

function readAllStoredPositions(): Record<string, DeskPostItPosition> {
  try {
    const raw = sessionStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DeskPostItPosition>
    const next: Record<string, DeskPostItPosition> = {}
    for (const accent of ACCENTS) {
      const stored = parsed[accent.postItId]
      if (stored && typeof stored.leftPct === 'number' && typeof stored.topPct === 'number') {
        next[accent.postItId] = {
          leftPct: clamp(stored.leftPct, 0, 92),
          topPct: clamp(stored.topPct, 0, 88),
        }
      }
    }
    return next
  } catch {
    return {}
  }
}

function writeAllStoredPositions(positions: Record<string, DeskPostItPosition>) {
  try {
    const raw = sessionStorage.getItem(POSITION_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, DeskPostItPosition>) : {}
    for (const [id, position] of Object.entries(positions)) {
      parsed[id] = position
    }
    sessionStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore */
  }
}

function rectFromNode(node: Element | null): DeskPostItRect | null {
  if (!node) return null
  const box = node.getBoundingClientRect()
  return { left: box.left, top: box.top, width: box.width, height: box.height }
}

type AccentPostItProps = AccentSpec & {
  position: DeskPostItPosition
  stackId: string | null
  onPositionChange: (position: DeskPostItPosition) => void
  onDragEnd: (info: DeskPostItDragEndInfo) => void
}

function DeskAccentPostIt({
  postItId,
  tone,
  defaultPosition,
  tiltDeg,
  testId,
  label,
  position,
  stackId,
  onPositionChange,
  onDragEnd,
}: AccentPostItProps) {
  const [text, setText] = useState(() => readStoredNote(postItId))

  useEffect(() => {
    writeStoredNote(postItId, text)
  }, [postItId, text])

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  return (
    <DeskPostIt
      postItId={postItId}
      tone={tone}
      defaultPosition={defaultPosition}
      position={position}
      onPositionChange={onPositionChange}
      onDragEnd={onDragEnd}
      tiltDeg={tiltDeg}
      className="arc-desk-post-it--accent"
      testId={testId}
      aria-label={label}
      stackId={stackId}
    >
      {/* Grip strip: drag starts here; textarea clicks stay editable (DeskPostIt skips form controls). */}
      <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid={`${testId}-grip`} />
      <textarea
        className="arc-desk-post-it-note"
        data-testid={`${testId}-note`}
        data-desk-post-it-note={postItId}
        value={text}
        onChange={onChange}
        rows={5}
        spellCheck
        placeholder="Write…"
        aria-label={`${label} note`}
      />
    </DeskPostIt>
  )
}

/**
 * Loose accent post-its on the wood — replacements for former tray-chrome baked stickies.
 * Siblings of the IDEAS tray under arc-desk-surface so landscape tray chrome can change independently.
 * Writable + localStorage note text; drag from the grip strip so click-to-edit does not start a drag.
 * Significant overlap after drag offers Link / Keep separate so layered accents can move as a stack.
 */
export function DeskAccentPostIts() {
  const [positions, setPositions] = useState<Record<string, DeskPostItPosition>>(() => {
    const stored = readAllStoredPositions()
    const next: Record<string, DeskPostItPosition> = {}
    for (const accent of ACCENTS) {
      next[accent.postItId] = stored[accent.postItId] ?? accent.defaultPosition
    }
    return next
  })
  const [links, setLinks] = useState<DeskPostItLinkWorkspace>(() => loadDeskPostItLinks())
  const [prompt, setPrompt] = useState<LinkPrompt | null>(null)
  const dismissedPairsRef = useRef(new Set<string>())
  const positionsRef = useRef(positions)
  positionsRef.current = positions
  const linksRef = useRef(links)
  linksRef.current = links

  useEffect(() => {
    writeAllStoredPositions(positions)
  }, [positions])

  useEffect(() => {
    saveDeskPostItLinks(links)
  }, [links])

  const moveLinkedGroup = useCallback((draggedId: string, nextPosition: DeskPostItPosition) => {
    setPositions((prev) => {
      const stack = deskPostItStackForMember(linksRef.current, draggedId)
      const current = prev[draggedId]
      if (!current) return prev
      if (!stack) {
        return { ...prev, [draggedId]: nextPosition }
      }
      const dx = nextPosition.leftPct - current.leftPct
      const dy = nextPosition.topPct - current.topPct
      if (dx === 0 && dy === 0) return prev
      const updated = { ...prev }
      for (const memberId of stack.memberIds) {
        const member = updated[memberId]
        if (!member) continue
        updated[memberId] = {
          leftPct: clamp(member.leftPct + dx, 0, 92),
          topPct: clamp(member.topPct + dy, 0, 88),
        }
      }
      return updated
    })
  }, [])

  const onDragEnd = useCallback((info: DeskPostItDragEndInfo) => {
    if (!info.didMove) return
    const rects: Record<string, DeskPostItRect> = {}
    for (const accent of ACCENTS) {
      const node = document.querySelector(`[data-desk-post-it="${accent.postItId}"]`)
      const rect = accent.postItId === info.postItId
        ? { left: info.rect.left, top: info.rect.top, width: info.rect.width, height: info.rect.height }
        : rectFromNode(node)
      if (rect) rects[accent.postItId] = rect
    }
    const overlapId = findSignificantOverlapTarget(info.postItId, rects, linksRef.current)
    if (!overlapId) {
      setPrompt(null)
      return
    }
    const key = pairKey(info.postItId, overlapId)
    if (dismissedPairsRef.current.has(key)) return
    const anchor = positionsRef.current[info.postItId] ?? info.position
    setPrompt({ a: info.postItId, b: overlapId, anchor })
  }, [])

  const confirmLink = useCallback(() => {
    if (!prompt) return
    const stackId = `desk-postit-${Date.now()}`
    setLinks((prev) => createDeskPostItLink(prev, [prompt.a, prompt.b], stackId))
    dismissedPairsRef.current.delete(pairKey(prompt.a, prompt.b))
    setPrompt(null)
  }, [prompt])

  const dismissLink = useCallback(() => {
    if (!prompt) return
    dismissedPairsRef.current.add(pairKey(prompt.a, prompt.b))
    setPrompt(null)
  }, [prompt])

  const promptMeta = useMemo(() => {
    if (!prompt) return ''
    return ACCENTS
      .filter((accent) => accent.postItId === prompt.a || accent.postItId === prompt.b)
      .map((accent) => accent.tone)
      .join(' + ')
  }, [prompt])

  return (
    <>
      {ACCENTS.map((accent) => {
        const stack = deskPostItStackForMember(links, accent.postItId)
        return (
          <DeskAccentPostIt
            key={accent.postItId}
            {...accent}
            position={positions[accent.postItId]}
            stackId={stack?.stackId ?? null}
            onPositionChange={(next) => moveLinkedGroup(accent.postItId, next)}
            onDragEnd={onDragEnd}
          />
        )
      })}
      {prompt ? (
        <div
          className="arc-desk-post-it-link-prompt"
          data-testid="arc-desk-post-it-link-prompt"
          role="dialog"
          aria-label="Link these post-its?"
          style={{
            left: `${clamp(prompt.anchor.leftPct + 4, 2, 78)}%`,
            top: `${clamp(prompt.anchor.topPct + 10, 2, 70)}%`,
          }}
        >
          <p className="arc-desk-post-it-link-prompt-copy">
            Link these post-its?
            {promptMeta ? <span className="arc-desk-post-it-link-prompt-meta">{promptMeta}</span> : null}
          </p>
          <div className="arc-desk-post-it-link-prompt-actions">
            <button
              type="button"
              className="arc-desk-post-it-link-prompt-link"
              data-testid="arc-desk-post-it-link-confirm"
              onClick={confirmLink}
            >
              Link
            </button>
            <button
              type="button"
              className="arc-desk-post-it-link-prompt-separate"
              data-testid="arc-desk-post-it-link-dismiss"
              onClick={dismissLink}
            >
              Keep separate
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
