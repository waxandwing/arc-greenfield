import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  DeskPostIt,
  type DeskPostItDragEndInfo,
  type DeskPostItDragStartInfo,
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
  isDeskPostItLesson,
  loadDeskPostItLessons,
  saveDeskPostItLessons,
  setDeskPostItLesson,
  type DeskPostItLessonMarks,
} from '../planning/deskPostItLessons'
import {
  clearDeskPostItDropHighlights,
  hitTestDeskPostItDrop,
  hitTestDeskPostItPark,
  highlightDeskPostItDropTarget,
  highlightDeskPostItParkTarget,
  pointFromRectCenter,
  pointInElement,
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
import { fitMagnetNoteFont } from '../desk/fitMagnetNoteFont'
import {
  deskMagnetFallbackSrcForTone,
  deskMagnetSrcForTone,
} from '../desk/deskMagnetAssets'
import {
  bundleCalendarNoteTexts,
  createBundlePlacement,
  formatBundledUnitDropNotice,
  loadDeskPostItBundlePlacements,
  recordBundlePlacement,
  resolveDeskPostItBundle,
  saveDeskPostItBundlePlacements,
  unionDeskPostItRects,
} from '../planning/deskPostItBundle'

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
    // Kelly postit-blue PNG is already tilted; keep CSS rotation at 0.
    tiltDeg: 0,
    testId: 'arc-desk-post-it-accent-blue',
    label: 'Blue post-it',
  },
]

type LinkPrompt = {
  a: string
  b: string
  anchor: DeskPostItPosition
}

type EscapeGhost = {
  postItId: string
  tone: DeskPostItTone
  tiltDeg: number
  left: number
  top: number
  width: number
  height: number
  grabOffsetX: number
  grabOffsetY: number
  text: string
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


function isUnitSpec(spec: Pick<AccentSpec, 'form' | 'kind'> | undefined): boolean {
  if (!spec) return false
  return spec.form === 'magnet' || spec.kind === 'unit'
}

/** Unit association: own unit magnet/tag, or linked into a stack that includes one. */
function isInUnitContext(
  catalog: AccentSpec[],
  links: DeskPostItLinkWorkspace,
  postItId: string,
): boolean {
  const byId = new Map(catalog.map((item) => [item.postItId, item]))
  const self = byId.get(postItId)
  if (isUnitSpec(self)) return true
  const stack = deskPostItStackForMember(links, postItId)
  if (!stack) return false
  return stack.memberIds.some((id) => isUnitSpec(byId.get(id)))
}

function UnitMagnetBadge({
  tone,
  testId,
  label,
}: {
  tone: DeskPostItTone
  testId: string
  label: string
}) {
  const preferred = deskMagnetSrcForTone(tone)
  const fallback = deskMagnetFallbackSrcForTone(tone)
  // Start on the known interim disc so missing Kelly canonical files do not flash broken.
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    let cancelled = false
    const probe = new Image()
    probe.onload = () => {
      if (!cancelled) setSrc(preferred)
    }
    probe.onerror = () => {
      if (!cancelled) setSrc(fallback)
    }
    probe.src = preferred
    return () => {
      cancelled = true
    }
  }, [fallback, preferred])

  return (
    <img
      className="arc-desk-post-it-unit-magnet"
      src={src}
      alt=""
      aria-hidden="true"
      data-testid={`${testId}-unit-magnet`}
      data-desk-unit-magnet="true"
      title={`${label} unit magnet`}
      draggable={false}
    />
  )
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
  /** True when this sticky is a unit magnet or linked into a unit stack. */
  inUnit: boolean
  assigned: boolean
  lesson: boolean
  onLessonChange: (lesson: boolean) => void
  onPositionChange: (position: DeskPostItPosition) => void
  onDragStart?: (info: DeskPostItDragStartInfo) => void
  onDragMove: (info: { postItId: string; clientX: number; clientY: number; rect: DOMRect }) => void
  onDragEnd: (info: DeskPostItDragEndInfo) => void
  onTextChange: (postItId: string, text: string) => void
  onEnterSave?: (postItId: string, text: string) => void
  /** True while a document-level escape ghost follows the pointer. */
  ghosting?: boolean
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
  inUnit,
  assigned,
  lesson,
  onLessonChange,
  onPositionChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTextChange,
  onEnterSave,
  ghosting = false,
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

  // Unit magnets: scale hand lettering to fill the circular writing area.
  useEffect(() => {
    if (form !== 'magnet' || inDrawer) return
    const el = noteRef.current
    if (!el) return

    const refit = () => {
      fitMagnetNoteFont(el)
    }
    refit()

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refit) : null
    ro?.observe(el)
    // Fonts (Caveat) may load after first paint — refit when ready.
    const fontsReady = document.fonts?.ready
    void fontsReady?.then(() => {
      if (noteRef.current === el) refit()
    })

    return () => {
      ro?.disconnect()
    }
  }, [form, inDrawer, text])

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || !onEnterSave) return
    event.preventDefault()
    onEnterSave(postItId, text)
  }

  // In the IDEAS tray, always use paper sticky chrome so write / drag / link / lesson work like wood.
  // Full circular magnet form stays on the wood for standalone unit magnets from `u …`.
  const isMagnet = form === 'magnet' && !inDrawer
  const showUnitMagnet = inUnit

  return (
    <DeskPostIt
      postItId={postItId}
      tone={tone}
      defaultPosition={defaultPosition}
      position={position}
      onPositionChange={onPositionChange}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      tiltDeg={tiltDeg}
      dragSurfaceSelector={inDrawer ? '[data-testid="arc-desk-ideas-accent-slot"]' : '.arc-desk-surface'}
      className={[
        isMagnet ? 'arc-desk-post-it--magnet' : 'arc-desk-post-it--accent',
        inDrawer ? 'arc-desk-post-it--in-drawer' : '',
        assigned ? 'arc-desk-post-it--assigned' : '',
        showUnitMagnet ? 'arc-desk-post-it--in-unit' : '',
        ghosting ? 'arc-desk-post-it--ghost-source' : '',
      ].filter(Boolean).join(' ')}
      testId={testId}
      aria-label={showUnitMagnet ? `${label} (in unit)` : label}
      stackId={stackId}
      lesson={lesson}
    >
      {isMagnet ? (
        <div className="arc-desk-magnet-face" data-testid={`${testId}-magnet`}>
          <UnitMagnetBadge tone={tone} testId={testId} label={label} />
          <span className="arc-desk-magnet-kind">{kind === 'unit' ? 'Unit' : 'Magnet'}</span>
          <textarea
            ref={noteRef}
            className="arc-desk-magnet-note"
            data-testid={`${testId}-note`}
            data-desk-post-it-note={postItId}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            spellCheck
            placeholder="Write…"
            aria-label={`${label} text`}
          />
          <button
            type="button"
            className={`arc-desk-post-it-lesson-mark${lesson ? ' is-lesson' : ''}`}
            data-testid={`${testId}-lesson-mark`}
            aria-pressed={lesson}
            aria-label={lesson ? `Clear lesson mark on ${label}` : `Mark ${label} as lesson`}
            title={lesson ? 'Lesson — click to clear' : 'Mark as lesson'}
            onClick={() => onLessonChange(!lesson)}
          />
        </div>
      ) : (
        <>
          <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid={`${testId}-grip`} />
          {showUnitMagnet ? <UnitMagnetBadge tone={tone} testId={testId} label={label} /> : null}
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
          <button
            type="button"
            className={`arc-desk-post-it-lesson-mark${lesson ? ' is-lesson' : ''}`}
            data-testid={`${testId}-lesson-mark`}
            aria-pressed={lesson}
            aria-label={lesson ? `Clear lesson mark on ${label}` : `Mark ${label} as lesson`}
            title={lesson ? 'Lesson — click to clear' : 'Mark as lesson'}
            onClick={() => onLessonChange(!lesson)}
          />
        </>
      )}
    </DeskPostIt>
  )
}

/**
 * Loose accent post-its on the wood — free placement anywhere on the desk surface.
 * Drop onto a date (week/day/month/year cell or planning day slot) or Planning Tray MUST/SHOULD/COULD to assign.
 * Linked unit magnet + lesson sticky stacks drop as one bundled unit onto that day.
 * Unassigned stickies may still live on the wood. Link-when-stacked + Clean up → IDEAS preserved.
 * Quick Capture Enter can spawn a fresh sticky or unit magnet for continuous capture.
 * Lesson marks (corner dot) let teachers flag a sticky as the lesson when grouping unit + class.
 * IDEAS tray stickies stay normal paper stickies (write / drag / link / lesson); unit-associated
 * stickies show a physical magnet badge (own `u` magnet or linked into a unit stack).
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
  const [lessons, setLessons] = useState<DeskPostItLessonMarks>(() => loadDeskPostItLessons())
  const lessonsRef = useRef(lessons)
  lessonsRef.current = lessons
  const [drawerSlot, setDrawerSlot] = useState<Element | null>(null)
  const [links, setLinks] = useState<DeskPostItLinkWorkspace>(() => loadDeskPostItLinks())
  const [prompt, setPrompt] = useState<LinkPrompt | null>(null)
  const [escapeGhost, setEscapeGhost] = useState<EscapeGhost | null>(null)
  const escapeGhostRef = useRef<EscapeGhost | null>(null)
  escapeGhostRef.current = escapeGhost
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
    saveDeskPostItLessons(lessons)
  }, [lessons])

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
      let index = 0
      for (const accent of catalogRef.current) {
        // Tray-local free-place slots (accent slot is the drag surface while in IDEAS).
        nextPositions[accent.postItId] = {
          leftPct: clamp(4 + (index % 3) * 30, 2, 68),
          topPct: clamp(6 + Math.floor(index / 3) * 38, 2, 62),
        }
        nextDrawer[accent.postItId] = true
        index += 1
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

  const pushToDrawer = useCallback((postItId: string, slotPosition?: DeskPostItPosition) => {
    setInDrawer((prev) => {
      const stack = deskPostItStackForMember(linksRef.current, postItId)
      const next = { ...prev }
      if (stack) {
        for (const memberId of stack.memberIds) next[memberId] = true
      } else {
        next[postItId] = true
      }
      return next
    })
    setPositions((prev) => {
      const stack = deskPostItStackForMember(linksRef.current, postItId)
      const base = slotPosition ?? {
        leftPct: clamp(4 + (Object.keys(prev).length % 3) * 30, 2, 68),
        topPct: clamp(6, 2, 62),
      }
      if (!stack) return { ...prev, [postItId]: base }
      const updated = { ...prev }
      let index = 0
      for (const memberId of stack.memberIds) {
        updated[memberId] = {
          leftPct: clamp(base.leftPct + index * 28, 2, 68),
          topPct: clamp(base.topPct + Math.floor(index / 3) * 8, 2, 62),
        }
        index += 1
      }
      return updated
    })
  }, [])

  const positionInAccentSlot = useCallback((clientX: number, clientY: number): DeskPostItPosition | null => {
    const slot = document.querySelector('[data-testid="arc-desk-ideas-accent-slot"]')
    if (!(slot instanceof HTMLElement)) return null
    const box = slot.getBoundingClientRect()
    if (box.width <= 0 || box.height <= 0) return null
    return {
      leftPct: clamp(((clientX - box.left) / box.width) * 100 - 4, 0, 92),
      topPct: clamp(((clientY - box.top) / box.height) * 100 - 4, 0, 88),
    }
  }, [])

  const hitPointForDrag = useCallback((info: { postItId: string; rect: DOMRect }) => {
    const stack = deskPostItStackForMember(linksRef.current, info.postItId)
    if (!stack) return pointFromRectCenter(info.rect)
    const rects = []
    for (const memberId of stack.memberIds) {
      if (memberId === info.postItId) {
        rects.push({ left: info.rect.left, top: info.rect.top, width: info.rect.width, height: info.rect.height })
        continue
      }
      const node = document.querySelector(`[data-desk-post-it="${memberId}"]`)
      const rect = rectFromNode(node)
      if (rect) rects.push(rect)
    }
    const union = unionDeskPostItRects(rects)
    return union ? pointFromRectCenter(union) : pointFromRectCenter(info.rect)
  }, [])

  const onDragStart = useCallback((info: DeskPostItDragStartInfo) => {
    if (!inDrawerRef.current[info.postItId]) return
    const spec = catalogRef.current.find((item) => item.postItId === info.postItId)
    if (!spec) return
    const ghost: EscapeGhost = {
      postItId: info.postItId,
      tone: spec.tone,
      tiltDeg: spec.tiltDeg,
      left: info.rect.left,
      top: info.rect.top,
      width: info.rect.width,
      height: info.rect.height,
      grabOffsetX: info.clientX - info.rect.left,
      grabOffsetY: info.clientY - info.rect.top,
      text: textsRef.current[info.postItId] ?? readStoredNote(info.postItId),
    }
    escapeGhostRef.current = ghost
    setEscapeGhost(ghost)
    const park = hitTestDeskPostItPark(info.clientX, info.clientY)
    highlightDeskPostItParkTarget(park.type === 'empty' ? { type: 'desk-park', element: document.querySelector('.arc-desk-surface') ?? document.body } : park)
  }, [])

  const onDragMove = useCallback((info: { postItId: string; clientX: number; clientY: number; rect: DOMRect }) => {
    const ghost = escapeGhostRef.current
    if (ghost && ghost.postItId === info.postItId) {
      const next = {
        ...ghost,
        left: info.clientX - ghost.grabOffsetX,
        top: info.clientY - ghost.grabOffsetY,
      }
      escapeGhostRef.current = next
      setEscapeGhost(next)
      const park = hitTestDeskPostItPark(info.clientX, info.clientY)
      if (park.type === 'empty') {
        const surface = document.querySelector('.arc-desk-surface')
        if (surface) highlightDeskPostItParkTarget({ type: 'desk-park', element: surface })
        else clearDeskPostItDropHighlights()
      } else {
        highlightDeskPostItParkTarget(park)
      }
      return
    }
    if (inDrawerRef.current[info.postItId]) {
      clearDeskPostItDropHighlights()
      return
    }
    // Desk stickies: prefer assign targets; also advertise IDEAS return when over the tray.
    const park = hitTestDeskPostItPark(info.clientX, info.clientY)
    if (park.type === 'ideas-tray') {
      highlightDeskPostItParkTarget(park)
      return
    }
    const point = hitPointForDrag(info)
    const target = hitTestDeskPostItDrop(point.clientX, point.clientY)
    highlightDeskPostItDropTarget(target)
  }, [hitPointForDrag])

  const tryAssignDrop = useCallback((info: DeskPostItDragEndInfo): boolean => {
    const point = hitPointForDrag(info)
    const target = hitTestDeskPostItDrop(point.clientX, point.clientY)
    clearDeskPostItDropHighlights()
    if (target.type === 'empty') return false

    const texts: Record<string, string> = { ...textsRef.current }
    for (const accent of catalogRef.current) {
      if (!(accent.postItId in texts)) texts[accent.postItId] = readStoredNote(accent.postItId)
    }
    const bundle = resolveDeskPostItBundle({
      draggedId: info.postItId,
      links: linksRef.current,
      lessons: lessonsRef.current,
      catalog: catalogRef.current,
      texts,
    })
    const noteTexts = bundleCalendarNoteTexts(bundle)
    if (noteTexts.length === 0) return false

    if (target.type === 'date') {
      const notice = formatBundledUnitDropNotice(bundle, target.date)
      requestDeskPostItAssignDate({
        postItId: info.postItId,
        date: target.date,
        text: noteTexts[0]!,
        bundle: {
          stackId: bundle.stackId,
          isBundledUnit: bundle.isBundledUnit,
          unitText: bundle.unitText,
          lessonTexts: bundle.lessonTexts,
          memberIds: bundle.memberIds,
          noteTexts,
          notice,
        },
      })
      if (bundle.isBundledUnit) {
        const placement = createBundlePlacement({ date: target.date, bundle })
        const next = recordBundlePlacement(loadDeskPostItBundlePlacements(), placement)
        saveDeskPostItBundlePlacements(next)
      }
      setAssigned((prev) => {
        const updated = { ...prev }
        for (const memberId of bundle.memberIds) updated[memberId] = true
        return updated
      })
      return true
    }
    if (target.type === 'priority') {
      for (const member of bundle.members) {
        if (!member.text) continue
        requestDeskPostItAssignPriority({
          postItId: member.postItId,
          priority: target.priority,
          text: member.text,
        })
      }
      setAssigned((prev) => {
        const updated = { ...prev }
        for (const memberId of bundle.memberIds) updated[memberId] = true
        return updated
      })
      return true
    }
    return false
  }, [hitPointForDrag])

  const promptLinkFromRects = useCallback((info: DeskPostItDragEndInfo, drawerOnly: boolean) => {
    const rects: Record<string, DeskPostItRect> = {}
    for (const accent of catalogRef.current) {
      const memberInDrawer = inDrawerRef.current[accent.postItId] === true
      if (drawerOnly ? !memberInDrawer : memberInDrawer) continue
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

  const onDragEnd = useCallback((info: DeskPostItDragEndInfo) => {
    const ghost = escapeGhostRef.current
    const usingGhost = Boolean(ghost && ghost.postItId === info.postItId)
    if (usingGhost && ghost) {
      const centerX = ghost.left + ghost.width / 2
      const centerY = ghost.top + ghost.height / 2
      const park = hitTestDeskPostItPark(centerX, centerY)
      escapeGhostRef.current = null
      setEscapeGhost(null)
      clearDeskPostItDropHighlights()
      const overIdeas = park.type === 'ideas-tray' || (
        pointInElement(centerX, centerY, document.querySelector('[data-testid="arc-desk-tray-dock"]'))
        || pointInElement(centerX, centerY, document.querySelector('[data-testid="arc-desk-ideas-accent-slot"]'))
      )
      if (overIdeas) {
        // Stay in IDEAS — rearrange + link like wood stickies.
        const slotPos = positionInAccentSlot(centerX, centerY)
        if (slotPos) {
          setPositions((prev) => ({ ...prev, [info.postItId]: slotPos }))
        }
        promptLinkFromRects({
          ...info,
          rect: new DOMRect(ghost.left, ghost.top, ghost.width, ghost.height),
          position: slotPos ?? info.position,
        }, true)
        return
      }
      const drop = positionFromSurfacePoint(centerX, centerY) ?? info.position
      pullFromDrawer(info.postItId, drop)
      setPrompt(null)
      return
    }

    if (!info.didMove) {
      clearDeskPostItDropHighlights()
      return
    }

    if (inDrawerRef.current[info.postItId]) {
      // Fallback without ghost (should be rare): use clamped rect.
      const centerX = info.rect.left + info.rect.width / 2
      const centerY = info.rect.top + info.rect.height / 2
      const tray = document.querySelector('[data-testid="arc-desk-tray-dock"]')
      const slot = document.querySelector('[data-testid="arc-desk-ideas-accent-slot"]')
      const stillInTray = pointInElement(centerX, centerY, tray) || pointInElement(centerX, centerY, slot)
      clearDeskPostItDropHighlights()
      if (stillInTray) {
        promptLinkFromRects(info, true)
        return
      }
      const drop = positionFromSurfacePoint(centerX, centerY) ?? info.position
      pullFromDrawer(info.postItId, drop)
      setPrompt(null)
      return
    }

    // Drop back into IDEAS from the exterior desk / planner surface.
    const centerX = info.rect.left + info.rect.width / 2
    const centerY = info.rect.top + info.rect.height / 2
    const park = hitTestDeskPostItPark(centerX, centerY)
    if (park.type === 'ideas-tray') {
      const slotPos = positionInAccentSlot(centerX, centerY) ?? {
        leftPct: clamp(4, 2, 68),
        topPct: clamp(6, 2, 62),
      }
      pushToDrawer(info.postItId, slotPos)
      clearDeskPostItDropHighlights()
      setPrompt(null)
      return
    }

    // Prefer assign targets (date / Planning Tray) over stacking prompts.
    if (tryAssignDrop(info)) {
      setPrompt(null)
      return
    }

    promptLinkFromRects(info, false)
  }, [positionInAccentSlot, promptLinkFromRects, pullFromDrawer, pushToDrawer, tryAssignDrop])

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

  const toggleLesson = useCallback((postItId: string, lesson: boolean) => {
    setLessons((prev) => setDeskPostItLesson(prev, postItId, lesson))
  }, [])

  function renderAccent(accent: AccentSpec, drawerMode: boolean) {
    const stack = deskPostItStackForMember(links, accent.postItId)
    const position = positions[accent.postItId] ?? accent.defaultPosition
    const lesson = isDeskPostItLesson(lessons, accent.postItId)
    const inUnit = isInUnitContext(catalog, links, accent.postItId)
    return (
      <DeskAccentPostIt
        key={accent.postItId}
        {...accent}
        position={position}
        stackId={stack?.stackId ?? null}
        inDrawer={drawerMode}
        inUnit={inUnit}
        assigned={assigned[accent.postItId] === true}
        lesson={lesson}
        onLessonChange={(next) => toggleLesson(accent.postItId, next)}
        onPositionChange={(next) => moveLinkedGroup(accent.postItId, next)}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTextChange={(id, text) => { textsRef.current[id] = text }}
        onEnterSave={onEnterSave}
        ghosting={escapeGhost?.postItId === accent.postItId}
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
      {escapeGhost
        ? createPortal(
          <div
            className={`arc-desk-post-it arc-desk-post-it--${escapeGhost.tone} arc-desk-post-it--accent arc-desk-post-it--dragging arc-desk-post-it--drag-ghost`}
            data-testid="arc-desk-post-it-drag-ghost"
            data-desk-post-it-ghost={escapeGhost.postItId}
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: `${escapeGhost.left}px`,
              top: `${escapeGhost.top}px`,
              width: `${escapeGhost.width}px`,
              height: `${escapeGhost.height}px`,
              transform: `rotate(${escapeGhost.tiltDeg}deg)`,
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            <div className="arc-desk-post-it-grip" aria-hidden="true" />
            <div className="arc-desk-post-it-note arc-desk-post-it-note--ghost">{escapeGhost.text || 'Write…'}</div>
          </div>,
          document.body,
        )
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
