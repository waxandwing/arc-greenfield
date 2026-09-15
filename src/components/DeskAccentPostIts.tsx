import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
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
import {
  clearDeskPostItDropHighlights,
  hitTestDeskPostItDrop,
  highlightDeskPostItDropTarget,
  pointFromRectCenter,
} from '../planning/deskPostItDrop'
import { DESK_IDEAS_CLEAN_UP_EVENT } from '../desk/deskIdeasEvents'
import {
  DESK_POSTIT_SPAWN_EVENT,
  requestDeskPostItAssignDate,
  requestDeskPostItAssignPriority,
  type DeskPostItSpawnDetail,
} from '../desk/deskPostItEvents'
import {
  parseQuickCaptureCommand,
  type QuickCaptureKind,
} from '../planning/quickCaptureCommand'

const NOTE_STORAGE_KEY = 'arc.desk-postit-notes.v1'
const POSITION_STORAGE_KEY = 'arc.desk-postit-positions.v1'
const DRAWER_STORAGE_KEY = 'arc.desk-postit-in-drawer.v1'
const ASSIGNED_STORAGE_KEY = 'arc.desk-postit-assigned.v1'

type AccentSpec = {
  postItId: string
  tone: DeskPostItTone
  defaultPosition: DeskPostItPosition
  tiltDeg: number
  testId: string
  label: string
  /** unit magnets are circular; stickies are paper. */
  form?: 'sticky' | 'magnet'
  kind?: QuickCaptureKind
  spawnBlank?: boolean
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

function readAssigned(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(ASSIGNED_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeAssigned(membership: Record<string, boolean>) {
  try {
    sessionStorage.setItem(ASSIGNED_STORAGE_KEY, JSON.stringify(membership))
  } catch {
    /* ignore */
  }
}

function readAllStoredPositions(ids: string[]): Record<string, DeskPostItPosition> {
  try {
    const raw = sessionStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DeskPostItPosition>
    const next: Record<string, DeskPostItPosition> = {}
    for (const id of ids) {
      const stored = parsed[id]
      if (stored && typeof stored.leftPct === 'number' && typeof stored.topPct === 'number') {
        next[id] = {
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

function readDrawerMembership(ids: string[]): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(DRAWER_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next: Record<string, boolean> = {}
    for (const id of ids) next[id] = parsed[id] === true
    return next
  } catch {
    return {}
  }
}

function writeDrawerMembership(membership: Record<string, boolean>) {
  try {
    sessionStorage.setItem(DRAWER_STORAGE_KEY, JSON.stringify(membership))
  } catch {
    /* ignore */
  }
}

function positionFromSurfacePoint(clientX: number, clientY: number): DeskPostItPosition | null {
  const surface = document.querySelector('.arc-desk-surface')
  if (!surface) return null
  const box = surface.getBoundingClientRect()
  if (box.width <= 0 || box.height <= 0) return null
  return {
    leftPct: clamp(((clientX - box.left) / box.width) * 100 - 4, 0, 92),
    topPct: clamp(((clientY - box.top) / box.height) * 100 - 4, 0, 88),
  }
}

function rectFromNode(node: Element | null): DeskPostItRect | null {
  if (!node) return null
  const box = node.getBoundingClientRect()
  return { left: box.left, top: box.top, width: box.width, height: box.height }
}

function toneForKind(kind: QuickCaptureKind, preferred?: DeskPostItTone): DeskPostItTone {
  if (preferred) return preferred
  if (kind === 'unit') return 'cream'
  if (kind === 'lesson') return 'blue'
  if (kind === 'note') return 'pink'
  return 'mustard'
}

function spawnSpecFromDetail(detail: DeskPostItSpawnDetail, index: number): AccentSpec {
  const id = `spawn-${detail.kind}-${Date.now()}-${index}`
  const isMagnet = detail.kind === 'unit'
  return {
    postItId: id,
    tone: toneForKind(detail.kind, detail.tone),
    defaultPosition: {
      leftPct: clamp(72 + (index % 3) * 3.5, 60, 88),
      topPct: clamp(18 + (index % 4) * 6, 8, 70),
    },
    tiltDeg: isMagnet ? 0 : (index % 2 === 0 ? -4 : 5),
    testId: `arc-desk-post-it-${id}`,
    label: isMagnet ? `${detail.text || 'Unit'} magnet` : `${detail.kind} sticky`,
    form: isMagnet ? 'magnet' : 'sticky',
    kind: detail.kind,
    spawnBlank: !detail.text.trim(),
  }
}

type AccentPostItProps = AccentSpec & {
  position: DeskPostItPosition
  stackId: string | null
  inDrawer: boolean
  assigned: boolean
  onPositionChange: (position: DeskPostItPosition) => void
  onDragMove: (info: { postItId: string; clientX: number; clientY: number; rect: DOMRect }) => void
  onDragEnd: (info: DeskPostItDragEndInfo) => void
  onTextChange: (postItId: string, text: string) => void
  onEnterSave?: (postItId: string, text: string) => void
}

function DeskAccentPostIt({
  postItId,
  tone,
  defaultPosition,
  tiltDeg,
  testId,
  label,
  form = 'sticky',
  kind,
  spawnBlank = false,
  position,
  stackId,
  inDrawer,
  assigned,
  onPositionChange,
  onDragMove,
  onDragEnd,
  onTextChange,
  onEnterSave,
}: AccentPostItProps) {
  const [text, setText] = useState(() => (spawnBlank ? '' : readStoredNote(postItId)))
  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    writeStoredNote(postItId, text)
    onTextChange(postItId, text)
  }, [onTextChange, postItId, text])

  useEffect(() => {
    if (!spawnBlank) return
    const timer = window.setTimeout(() => noteRef.current?.focus(), 40)
    return () => window.clearTimeout(timer)
  }, [spawnBlank])

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || !onEnterSave) return
    event.preventDefault()
    onEnterSave(postItId, text)
  }

  const isMagnet = form === 'magnet'

  return (
    <DeskPostIt
      postItId={postItId}
      tone={tone}
      defaultPosition={defaultPosition}
      position={position}
      onPositionChange={onPositionChange}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      tiltDeg={inDrawer ? 0 : tiltDeg}
      className={[
        isMagnet ? 'arc-desk-post-it--magnet' : 'arc-desk-post-it--accent',
        inDrawer ? 'arc-desk-post-it--in-drawer' : '',
        assigned ? 'arc-desk-post-it--assigned' : '',
      ].filter(Boolean).join(' ')}
      testId={testId}
      aria-label={label}
      stackId={stackId}
    >
      {isMagnet ? (
        <div className="arc-desk-magnet-face" data-testid={`${testId}-magnet`}>
          <span className="arc-desk-magnet-kind">{kind === 'unit' ? 'Unit' : 'Magnet'}</span>
          <textarea
            ref={noteRef}
            className="arc-desk-magnet-note"
            data-testid={`${testId}-note`}
            data-desk-post-it-note={postItId}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={2}
            spellCheck
            placeholder="Write…"
            aria-label={`${label} text`}
          />
        </div>
      ) : (
        <>
          <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid={`${testId}-grip`} />
          <textarea
            ref={noteRef}
            className="arc-desk-post-it-note"
            data-testid={`${testId}-note`}
            data-desk-post-it-note={postItId}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={5}
            spellCheck
            placeholder="Write…"
            aria-label={`${label} note`}
          />
        </>
      )}
    </DeskPostIt>
  )
}

/**
 * Loose accent post-its on the wood — free placement anywhere on the desk surface.
 * Drop onto a date (week/day/month/year cell) or Planning Tray MUST/SHOULD/COULD to assign.
 * Unassigned stickies may still live on the wood. Link-when-stacked + Clean up → IDEAS preserved.
 * Quick Capture Enter can spawn a fresh sticky or unit magnet for continuous capture.
 */
export function DeskAccentPostIts() {
  const [spawned, setSpawned] = useState<AccentSpec[]>([])
  const catalog = useMemo(() => [...ACCENTS, ...spawned], [spawned])
  const catalogIds = useMemo(() => catalog.map((item) => item.postItId), [catalog])

  const [positions, setPositions] = useState<Record<string, DeskPostItPosition>>(() => {
    const stored = readAllStoredPositions(ACCENTS.map((a) => a.postItId))
    const next: Record<string, DeskPostItPosition> = {}
    for (const accent of ACCENTS) {
      next[accent.postItId] = stored[accent.postItId] ?? accent.defaultPosition
    }
    return next
  })
  const [inDrawer, setInDrawer] = useState<Record<string, boolean>>(() =>
    readDrawerMembership(ACCENTS.map((a) => a.postItId)),
  )
  const [assigned, setAssigned] = useState<Record<string, boolean>>(() => readAssigned())
  const [drawerSlot, setDrawerSlot] = useState<Element | null>(null)
  const [links, setLinks] = useState<DeskPostItLinkWorkspace>(() => loadDeskPostItLinks())
  const [prompt, setPrompt] = useState<LinkPrompt | null>(null)
  const dismissedPairsRef = useRef(new Set<string>())
  const positionsRef = useRef(positions)
  positionsRef.current = positions
  const linksRef = useRef(links)
  linksRef.current = links
  const inDrawerRef = useRef(inDrawer)
  inDrawerRef.current = inDrawer
  const textsRef = useRef<Record<string, string>>({})
  const catalogRef = useRef(catalog)
  catalogRef.current = catalog

  useEffect(() => {
    writeAllStoredPositions(positions)
  }, [positions])

  useEffect(() => {
    writeDrawerMembership(inDrawer)
  }, [inDrawer])

  useEffect(() => {
    writeAssigned(assigned)
  }, [assigned])

  useEffect(() => {
    saveDeskPostItLinks(links)
  }, [links])

  useEffect(() => {
    function syncSlot() {
      setDrawerSlot(document.querySelector('[data-testid="arc-desk-ideas-accent-slot"]'))
    }
    syncSlot()
    const timer = window.setInterval(syncSlot, 500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function onCleanUp() {
      const nextPositions: Record<string, DeskPostItPosition> = {}
      const nextDrawer: Record<string, boolean> = {}
      for (const accent of catalogRef.current) {
        nextPositions[accent.postItId] = { ...accent.defaultPosition }
        nextDrawer[accent.postItId] = true
      }
      setPositions(nextPositions)
      setInDrawer(nextDrawer)
      setPrompt(null)
      clearDeskPostItDropHighlights()
    }
    window.addEventListener(DESK_IDEAS_CLEAN_UP_EVENT, onCleanUp)
    return () => window.removeEventListener(DESK_IDEAS_CLEAN_UP_EVENT, onCleanUp)
  }, [])

  const spawnSeqRef = useRef(0)

  useEffect(() => {
    function onSpawn(event: Event) {
      const detail = (event as CustomEvent<DeskPostItSpawnDetail>).detail
      if (!detail?.kind) return
      const additions: AccentSpec[] = []
      const nextPositions: Record<string, DeskPostItPosition> = {}
      const nextDrawer: Record<string, boolean> = {}

      // Place a wood object for unit / lesson / note (ideas already live in IDEAS).
      if (detail.kind !== 'idea' && detail.text.trim()) {
        const saved = spawnSpecFromDetail({ ...detail, text: detail.text }, spawnSeqRef.current++)
        saved.spawnBlank = false
        additions.push(saved)
        nextPositions[saved.postItId] = { ...saved.defaultPosition }
        nextDrawer[saved.postItId] = false
        writeStoredNote(saved.postItId, detail.text.trim())
      }

      // Always ready a fresh blank sticky/magnet for the next Enter.
      const blankKind = detail.kind === 'unit' ? 'unit' : 'idea'
      const blank = spawnSpecFromDetail({ kind: blankKind, text: '' }, spawnSeqRef.current++)
      blank.spawnBlank = detail.focusBlank === true
      additions.push(blank)
      nextPositions[blank.postItId] = { ...blank.defaultPosition }
      nextDrawer[blank.postItId] = false

      setSpawned((prev) => [...prev, ...additions])
      setPositions((prev) => ({ ...prev, ...nextPositions }))
      setInDrawer((prev) => ({ ...prev, ...nextDrawer }))
    }
    window.addEventListener(DESK_POSTIT_SPAWN_EVENT, onSpawn)
    return () => window.removeEventListener(DESK_POSTIT_SPAWN_EVENT, onSpawn)
  }, [])

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

  const pullFromDrawer = useCallback((postItId: string, drop: DeskPostItPosition) => {
    setInDrawer((prev) => {
      const stack = deskPostItStackForMember(linksRef.current, postItId)
      const next = { ...prev }
      if (stack) {
        for (const memberId of stack.memberIds) next[memberId] = false
      } else {
        next[postItId] = false
      }
      return next
    })
    setPositions((prev) => {
      const stack = deskPostItStackForMember(linksRef.current, postItId)
      if (!stack) return { ...prev, [postItId]: drop }
      const updated = { ...prev }
      let index = 0
      for (const memberId of stack.memberIds) {
        updated[memberId] = {
          leftPct: clamp(drop.leftPct + index * 2.2, 0, 92),
          topPct: clamp(drop.topPct + index * 1.6, 0, 88),
        }
        index += 1
      }
      return updated
    })
  }, [])

  const onDragMove = useCallback((info: { postItId: string; clientX: number; clientY: number; rect: DOMRect }) => {
    if (inDrawerRef.current[info.postItId]) {
      clearDeskPostItDropHighlights()
      return
    }
    const point = pointFromRectCenter(info.rect)
    const target = hitTestDeskPostItDrop(point.clientX, point.clientY)
    highlightDeskPostItDropTarget(target)
  }, [])

  const tryAssignDrop = useCallback((info: DeskPostItDragEndInfo): boolean => {
    const point = pointFromRectCenter(info.rect)
    const target = hitTestDeskPostItDrop(point.clientX, point.clientY)
    clearDeskPostItDropHighlights()
    if (target.type === 'empty') return false

    const text = (textsRef.current[info.postItId] ?? readStoredNote(info.postItId)).trim()
    if (!text) return false

    if (target.type === 'date') {
      requestDeskPostItAssignDate({ postItId: info.postItId, date: target.date, text })
      setAssigned((prev) => ({ ...prev, [info.postItId]: true }))
      return true
    }
    if (target.type === 'priority') {
      requestDeskPostItAssignPriority({ postItId: info.postItId, priority: target.priority, text })
      setAssigned((prev) => ({ ...prev, [info.postItId]: true }))
      return true
    }
    return false
  }, [])

  const onDragEnd = useCallback((info: DeskPostItDragEndInfo) => {
    if (!info.didMove) {
      clearDeskPostItDropHighlights()
      return
    }

    if (inDrawerRef.current[info.postItId]) {
      const drop =
        positionFromSurfacePoint(info.rect.left + info.rect.width / 2, info.rect.top + info.rect.height / 2)
        ?? info.position
      pullFromDrawer(info.postItId, drop)
      setPrompt(null)
      clearDeskPostItDropHighlights()
      return
    }

    // Prefer assign targets (date / Planning Tray) over stacking prompts.
    if (tryAssignDrop(info)) {
      setPrompt(null)
      return
    }

    const rects: Record<string, DeskPostItRect> = {}
    for (const accent of catalogRef.current) {
      if (inDrawerRef.current[accent.postItId]) continue
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
  }, [pullFromDrawer, tryAssignDrop])

  const onEnterSave = useCallback((postItId: string, raw: string) => {
    const parsed = parseQuickCaptureCommand(raw)
    if (!parsed.text) return
    writeStoredNote(postItId, parsed.text)
    textsRef.current[postItId] = parsed.text
    // Re-use QC spawn path so subsequent Enter yields a fresh sticky/magnet.
    const event = new CustomEvent(DESK_POSTIT_SPAWN_EVENT, {
      detail: { kind: parsed.kind, text: parsed.text, focusBlank: true } satisfies DeskPostItSpawnDetail,
    })
    window.dispatchEvent(event)
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
    return catalog
      .filter((accent) => accent.postItId === prompt.a || accent.postItId === prompt.b)
      .map((accent) => accent.tone)
      .join(' + ')
  }, [catalog, prompt])

  const deskAccents = catalog.filter((accent) => !inDrawer[accent.postItId])
  const drawerAccents = catalog.filter((accent) => inDrawer[accent.postItId])

  function renderAccent(accent: AccentSpec, drawerMode: boolean) {
    const stack = deskPostItStackForMember(links, accent.postItId)
    const position = positions[accent.postItId] ?? accent.defaultPosition
    return (
      <DeskAccentPostIt
        key={accent.postItId}
        {...accent}
        position={position}
        stackId={stack?.stackId ?? null}
        inDrawer={drawerMode}
        assigned={assigned[accent.postItId] === true}
        onPositionChange={(next) => moveLinkedGroup(accent.postItId, next)}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTextChange={(id, text) => { textsRef.current[id] = text }}
        onEnterSave={onEnterSave}
      />
    )
  }

  // Keep catalogIds referenced so eslint/ts stay quiet when spawned ids change.
  void catalogIds

  return (
    <>
      {deskAccents.map((accent) => renderAccent(accent, false))}
      {drawerSlot && drawerAccents.length > 0
        ? createPortal(drawerAccents.map((accent) => renderAccent(accent, true)), drawerSlot)
        : null}
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
