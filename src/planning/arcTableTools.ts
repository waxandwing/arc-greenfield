export type ArcTableCountdownStatus = 'idle' | 'running' | 'paused' | 'completed'
export const ARC_TABLE_MIN_COUNTDOWN_SECONDS = 10
export const ARC_TABLE_MAX_COUNTDOWN_SECONDS = 7_200
export const ARC_TABLE_MAX_INLINE_IMAGE_CHARACTERS = 100_000

export type ArcTableCountdown = {
  status: ArcTableCountdownStatus
  durationSeconds: number
  remainingSeconds: number
  runStartedAt: string | null
}

export type ArcTablePerson = { id: string; name: string }
export type ArcTablePickerMode = 'random' | 'round-robin'
export type ArcTablePeopleState = {
  sectionId: string
  roster: ArcTablePerson[]
  selectedId: string | null
  projected: boolean
  mode: ArcTablePickerMode
}

export type ArcTablePassStatus = 'inactive' | 'requested' | 'active'
export type ArcTablePass = { id: string; label: string; status: ArcTablePassStatus; personId: string | null }
export type ArcTablePassState = { sectionId: string; passes: ArcTablePass[] }

export type ArcTableMediaKind = 'image' | 'slides'
export type ArcTableMediaItem = { id: string; title: string; kind: ArcTableMediaKind; source: string }
export type ArcTableMediaState = {
  sectionId: string
  items: ArcTableMediaItem[]
  activeId: string | null
  projected: boolean
}

export function createArcTableCountdown(durationSeconds = 600): ArcTableCountdown {
  const duration = normalizeDuration(durationSeconds)
  return { status: 'idle', durationSeconds: duration, remainingSeconds: duration, runStartedAt: null }
}

export function countdownRemaining(timer: ArcTableCountdown, now = new Date()): number {
  if (timer.status !== 'running' || !timer.runStartedAt) return timer.remainingSeconds
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(timer.runStartedAt)) / 1_000))
  return Math.max(0, timer.remainingSeconds - elapsed)
}

export function settleArcTableCountdown(timer: ArcTableCountdown, now = new Date()): ArcTableCountdown {
  const remainingSeconds = countdownRemaining(timer, now)
  if (timer.status === 'running' && remainingSeconds === 0) {
    return { ...timer, status: 'completed', remainingSeconds: 0, runStartedAt: null }
  }
  return timer
}

export function startArcTableCountdown(timer: ArcTableCountdown, now = new Date()): ArcTableCountdown {
  const settled = settleArcTableCountdown(timer, now)
  const remainingSeconds = settled.remainingSeconds > 0 ? settled.remainingSeconds : settled.durationSeconds
  return { ...settled, status: 'running', remainingSeconds, runStartedAt: now.toISOString() }
}

export function pauseArcTableCountdown(timer: ArcTableCountdown, now = new Date()): ArcTableCountdown {
  const remainingSeconds = countdownRemaining(timer, now)
  return { ...timer, status: remainingSeconds === 0 ? 'completed' : 'paused', remainingSeconds, runStartedAt: null }
}

export function resetArcTableCountdown(timer: ArcTableCountdown): ArcTableCountdown {
  return { ...timer, status: 'idle', remainingSeconds: timer.durationSeconds, runStartedAt: null }
}

export function setArcTableCountdownDuration(timer: ArcTableCountdown, durationSeconds: number): ArcTableCountdown {
  const duration = normalizeDuration(durationSeconds)
  return { ...timer, status: 'idle', durationSeconds: duration, remainingSeconds: duration, runStartedAt: null }
}

export function createArcTablePeopleState(sectionId: string): ArcTablePeopleState {
  return { sectionId, roster: [], selectedId: null, projected: false, mode: 'random' }
}

export function addArcTablePerson(state: ArcTablePeopleState, name: string): ArcTablePeopleState {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized || state.roster.some((person) => person.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return state
  return { ...state, roster: [...state.roster, { id: uniqueId('person', normalized, state.roster.map((person) => person.id)), name: normalized }] }
}

export function pickArcTablePerson(state: ArcTablePeopleState, random = Math.random): ArcTablePeopleState {
  if (state.roster.length === 0) return { ...state, selectedId: null, projected: false }
  const current = state.roster.findIndex((person) => person.id === state.selectedId)
  const index = state.mode === 'round-robin'
    ? (current + 1) % state.roster.length
    : Math.min(state.roster.length - 1, Math.max(0, Math.floor(random() * state.roster.length)))
  return { ...state, selectedId: state.roster[index].id, projected: false }
}

export const pickNextArcTablePerson = pickArcTablePerson

export function selectedArcTablePerson(state: ArcTablePeopleState): ArcTablePerson | null {
  return state.roster.find((person) => person.id === state.selectedId) ?? null
}

export function createArcTablePassState(sectionId: string, definitions: Array<Pick<ArcTablePass, 'id' | 'label'>> = [
  { id: 'hall-pass', label: 'Hall pass' },
  { id: 'supply-pass', label: 'Supply pass' },
]): ArcTablePassState {
  return {
    sectionId,
    passes: definitions.map((definition) => ({ ...definition, status: 'inactive', personId: null })),
  }
}

export function addArcTablePassDefinition(state: ArcTablePassState, label: string): ArcTablePassState {
  const normalized = label.trim().replace(/\s+/g, ' ')
  if (!normalized || state.passes.some((pass) => pass.label.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return state
  return { ...state, passes: [...state.passes, { id: uniqueId('pass', normalized, state.passes.map((pass) => pass.id)), label: normalized, status: 'inactive', personId: null }] }
}

export function setArcTablePassStatus(state: ArcTablePassState, passId: string, status: ArcTablePassStatus, personId: string | null = null): ArcTablePassState {
  return { ...state, passes: state.passes.map((pass) => pass.id === passId ? { ...pass, status, personId: status === 'inactive' ? null : personId } : pass) }
}

export function createArcTableMediaState(sectionId: string): ArcTableMediaState {
  return { sectionId, items: [], activeId: null, projected: false }
}

export function addArcTableMedia(state: ArcTableMediaState, input: Omit<ArcTableMediaItem, 'id'>): ArcTableMediaState {
  const title = input.title.trim()
  const source = normalizeArcTableMediaSource(input.kind, input.source)
  if (!title || !source) return state
  const item = { ...input, title, source, id: uniqueId('media', title, state.items.map((candidate) => candidate.id)) }
  return { ...state, items: [...state.items, item], activeId: item.id, projected: false }
}

export function normalizeArcTableMediaSource(kind: ArcTableMediaKind, rawSource: string): string | null {
  const source = rawSource.trim()
  if (!source) return null
  if (kind === 'slides') return normalizeGoogleSlidesSource(source)
  if (source.startsWith('data:image/')) return source.length <= ARC_TABLE_MAX_INLINE_IMAGE_CHARACTERS ? source : null
  if (source.startsWith('/') || source.startsWith('https://') || source.startsWith('http://')) return source
  return null
}

function normalizeGoogleSlidesSource(source: string): string | null {
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') return null
    const match = url.pathname.match(/^\/presentation\/d\/(e\/)?([^/]+)\/(edit|present|preview|pub|embed)$/)
    if (!match) return null
    const prefix = match[1] ? 'e/' : ''
    return `https://docs.google.com/presentation/d/${prefix}${match[2]}/embed?start=false&loop=false&delayms=3000`
  } catch {
    return null
  }
}

export function activeArcTableMedia(state: ArcTableMediaState): ArcTableMediaItem | null {
  return state.items.find((item) => item.id === state.activeId) ?? null
}

function normalizeDuration(value: number): number {
  if (!Number.isFinite(value)) return 600
  return Math.max(ARC_TABLE_MIN_COUNTDOWN_SECONDS, Math.min(ARC_TABLE_MAX_COUNTDOWN_SECONDS, Math.round(value)))
}

function uniqueId(prefix: string, label: string, existing: string[]): string {
  const stem = `${prefix}-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'}`
  let id = stem
  let suffix = 2
  while (existing.includes(id)) id = `${stem}-${suffix++}`
  return id
}
