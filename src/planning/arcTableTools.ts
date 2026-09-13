export type ArcTableCountdownStatus = 'idle' | 'running' | 'paused' | 'completed'

export type ArcTableCountdown = {
  status: ArcTableCountdownStatus
  durationSeconds: number
  remainingSeconds: number
  runStartedAt: string | null
}

export type ArcTablePerson = { id: string; name: string }
export type ArcTablePeopleState = {
  sectionId: string
  roster: ArcTablePerson[]
  selectedId: string | null
  projected: boolean
}

export type ArcTablePassStatus = 'inactive' | 'requested' | 'active'
export type ArcTablePass = { id: string; label: string; status: ArcTablePassStatus }
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
  return { sectionId, roster: [], selectedId: null, projected: false }
}

export function addArcTablePerson(state: ArcTablePeopleState, name: string): ArcTablePeopleState {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized || state.roster.some((person) => person.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return state
  return { ...state, roster: [...state.roster, { id: uniqueId('person', normalized, state.roster.map((person) => person.id)), name: normalized }] }
}

export function pickNextArcTablePerson(state: ArcTablePeopleState): ArcTablePeopleState {
  if (state.roster.length === 0) return { ...state, selectedId: null, projected: false }
  const current = state.roster.findIndex((person) => person.id === state.selectedId)
  return { ...state, selectedId: state.roster[(current + 1) % state.roster.length].id, projected: false }
}

export function selectedArcTablePerson(state: ArcTablePeopleState): ArcTablePerson | null {
  return state.roster.find((person) => person.id === state.selectedId) ?? null
}

export function createArcTablePassState(sectionId: string): ArcTablePassState {
  return {
    sectionId,
    passes: [
      { id: 'hall-pass', label: 'Hall pass', status: 'inactive' },
      { id: 'supply-pass', label: 'Supply pass', status: 'inactive' },
    ],
  }
}

export function setArcTablePassStatus(state: ArcTablePassState, passId: string, status: ArcTablePassStatus): ArcTablePassState {
  return { ...state, passes: state.passes.map((pass) => pass.id === passId ? { ...pass, status } : pass) }
}

export function createArcTableMediaState(sectionId: string): ArcTableMediaState {
  return { sectionId, items: [], activeId: null, projected: false }
}

export function addArcTableMedia(state: ArcTableMediaState, input: Omit<ArcTableMediaItem, 'id'>): ArcTableMediaState {
  const title = input.title.trim()
  const source = input.source.trim()
  if (!title || !isAllowedMediaSource(source)) return state
  const item = { ...input, title, source, id: uniqueId('media', title, state.items.map((candidate) => candidate.id)) }
  return { ...state, items: [...state.items, item], activeId: item.id, projected: false }
}

function isAllowedMediaSource(source: string): boolean {
  return source.startsWith('/') || source.startsWith('https://') || source.startsWith('http://') || source.startsWith('data:image/')
}

export function activeArcTableMedia(state: ArcTableMediaState): ArcTableMediaItem | null {
  return state.items.find((item) => item.id === state.activeId) ?? null
}

function normalizeDuration(value: number): number {
  if (!Number.isFinite(value)) return 600
  return Math.max(10, Math.min(5_400, Math.round(value)))
}

function uniqueId(prefix: string, label: string, existing: string[]): string {
  const stem = `${prefix}-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'}`
  let id = stem
  let suffix = 2
  while (existing.includes(id)) id = `${stem}-${suffix++}`
  return id
}
