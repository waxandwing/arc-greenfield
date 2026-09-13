import type { ArcTableSession } from './arcTableSession'
import {
  ARC_TABLE_MAX_COUNTDOWN_SECONDS,
  ARC_TABLE_MIN_COUNTDOWN_SECONDS,
  addArcTableMedia,
  createArcTableCountdown,
  createArcTableMediaState,
  createArcTablePassState,
  createArcTablePeopleState,
  type ArcTableCountdown,
  type ArcTableMediaState,
  type ArcTablePassState,
  type ArcTablePeopleState,
  normalizeArcTableMediaSource,
} from './arcTableTools'
import type { ArcTableSectionConfig } from './arcTableSectionConfig'

export const ARC_TABLE_LIVE_STORAGE_KEY = 'arc.arctable.live.v1'

export type ArcTableLiveState = {
  version: 2
  session: ArcTableSession
  startedAt: string
  phase: number
  phaseCount: number
  directions: string[]
  materials: string
  voiceLevel: 1 | 2 | 3
  boardLocked: boolean
  timer: ArcTableCountdown
  cleanupTimer: ArcTableCountdown
  people: ArcTablePeopleState
  passes: ArcTablePassState
  media: ArcTableMediaState
}

export function createArcTableLiveState(session: ArcTableSession, now = new Date(), config?: ArcTableSectionConfig): ArcTableLiveState {
  const people = createArcTablePeopleState(session.sectionId)
  people.roster = config?.roster.map((person) => ({ ...person })) ?? []
  const passes = createArcTablePassState(session.sectionId, config?.passDefinitions)
  let media = createArcTableMediaState(session.sectionId)
  for (const resource of session.resources ?? []) {
    if (resource.kind === 'image' || resource.kind === 'slides') media = addArcTableMedia(media, { title: resource.title, kind: resource.kind, source: resource.source })
  }
  media.activeId = null
  return {
    version: 2,
    session,
    startedAt: now.toISOString(),
    phase: 1,
    phaseCount: Math.max(1, session.phases?.length ?? 0),
    directions: [...(session.directions ?? [])],
    materials: (session.materials ?? []).join(' · '),
    voiceLevel: 2,
    boardLocked: true,
    timer: createArcTableCountdown(600),
    cleanupTimer: createArcTableCountdown(300),
    people,
    passes,
    media,
  }
}

export function validateArcTableLiveState(value: unknown): value is ArcTableLiveState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<ArcTableLiveState>
  const session = state.session as Partial<ArcTableSession> | undefined
  return state.version === 2
    && Boolean(session?.sectionId && session.lessonId && session.courseId && session.date)
    && Array.isArray(session?.directions) && Array.isArray(session?.materials) && Array.isArray(session?.phases) && Array.isArray(session?.resources)
    && typeof state.startedAt === 'string'
    && !Number.isNaN(Date.parse(state.startedAt))
    && Number.isInteger(state.phase) && Number.isInteger(state.phaseCount)
    && Number(state.phase) >= 1 && Number(state.phaseCount) >= Number(state.phase)
    && Array.isArray(state.directions) && state.directions.every((item) => typeof item === 'string')
    && typeof state.materials === 'string'
    && (state.voiceLevel === 1 || state.voiceLevel === 2 || state.voiceLevel === 3)
    && typeof state.boardLocked === 'boolean'
    && validateCountdown(state.timer)
    && validateCountdown(state.cleanupTimer)
    && validatePeople(state.people, session?.sectionId)
    && validatePasses(state.passes, session?.sectionId, state.people)
    && validateMedia(state.media, session?.sectionId)
}

export function loadArcTableLiveState(storage: Pick<Storage, 'getItem'> = localStorage): ArcTableLiveState | null {
  try {
    const stored = storage.getItem(ARC_TABLE_LIVE_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    if (validateArcTableLiveState(parsed)) return parsed
    const repaired = repairVersionTwo(parsed)
    if (repaired) return repaired
    return migrateVersionOne(parsed)
  } catch {
    return null
  }
}

export function saveArcTableLiveState(state: ArcTableLiveState, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try {
    storage.setItem(ARC_TABLE_LIVE_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearArcTableLiveState(storage: Pick<Storage, 'removeItem'> = localStorage): boolean {
  try {
    storage.removeItem(ARC_TABLE_LIVE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function elapsedLiveMinutes(state: ArcTableLiveState, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(state.startedAt)) / 60_000))
}

export function cleanupIsActive(state: ArcTableLiveState): boolean {
  return state.cleanupTimer.status !== 'idle'
}

function validateCountdown(value: unknown): value is ArcTableCountdown {
  if (!value || typeof value !== 'object') return false
  const countdown = value as Partial<ArcTableCountdown>
  return ['idle', 'running', 'paused', 'completed'].includes(String(countdown.status))
    && Number.isInteger(countdown.durationSeconds) && Number(countdown.durationSeconds) >= ARC_TABLE_MIN_COUNTDOWN_SECONDS && Number(countdown.durationSeconds) <= ARC_TABLE_MAX_COUNTDOWN_SECONDS
    && Number.isInteger(countdown.remainingSeconds) && Number(countdown.remainingSeconds) >= 0 && Number(countdown.remainingSeconds) <= Number(countdown.durationSeconds)
    && (countdown.status === 'running'
      ? typeof countdown.runStartedAt === 'string' && !Number.isNaN(Date.parse(countdown.runStartedAt))
      : countdown.runStartedAt === null)
}

function validatePeople(value: unknown, sectionId: string | undefined): value is ArcTablePeopleState {
  if (!value || typeof value !== 'object') return false
  const people = value as Partial<ArcTablePeopleState>
  if (people.sectionId !== sectionId || !Array.isArray(people.roster)) return false
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const person of people.roster) {
    const name = person?.name?.trim().toLocaleLowerCase()
    if (!person?.id || !name || ids.has(person.id) || names.has(name)) return false
    ids.add(person.id)
    names.add(name)
  }
  return (people.mode === 'random' || people.mode === 'round-robin')
    && (people.selectedId === null || ids.has(String(people.selectedId)))
    && typeof people.projected === 'boolean'
    && (!people.projected || people.selectedId !== null)
}

function validatePasses(value: unknown, sectionId: string | undefined, people: ArcTablePeopleState | undefined): value is ArcTablePassState {
  if (!value || typeof value !== 'object') return false
  const passes = value as Partial<ArcTablePassState>
  if (passes.sectionId !== sectionId || !Array.isArray(passes.passes)) return false
  const ids = new Set<string>()
  const personIds = new Set(people?.roster.map((person) => person.id) ?? [])
  return passes.passes.every((pass) => {
    if (!pass?.id || !pass.label?.trim() || ids.has(pass.id) || !['inactive', 'requested', 'active'].includes(pass.status)) return false
    ids.add(pass.id)
    return (pass.personId === null || personIds.has(pass.personId)) && (pass.status !== 'inactive' || pass.personId === null)
  })
}

function validateMedia(value: unknown, sectionId: string | undefined): value is ArcTableMediaState {
  if (!value || typeof value !== 'object') return false
  const media = value as Partial<ArcTableMediaState>
  if (media.sectionId !== sectionId || !Array.isArray(media.items)) return false
  const ids = new Set<string>()
  for (const item of media.items) {
    if (!item?.id || !item.title?.trim() || ids.has(item.id) || !['image', 'slides'].includes(item.kind) || normalizeArcTableMediaSource(item.kind, item.source) !== item.source) return false
    ids.add(item.id)
  }
  return (media.activeId === null || ids.has(String(media.activeId)))
    && typeof media.projected === 'boolean'
    && (!media.projected || media.activeId !== null)
}

function repairVersionTwo(value: unknown): ArcTableLiveState | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.version !== 2 || typeof raw.startedAt !== 'string' || Number.isNaN(Date.parse(raw.startedAt))) return null
  const session = normalizeSession(raw.session)
  if (!session) return null
  const repaired = createArcTableLiveState(session, new Date(raw.startedAt))
  if (Number.isInteger(raw.phaseCount) && Number(raw.phaseCount) >= 1) repaired.phaseCount = Number(raw.phaseCount)
  if (Number.isInteger(raw.phase) && Number(raw.phase) >= 1) repaired.phase = Math.min(Number(raw.phase), repaired.phaseCount)
  if (Array.isArray(raw.directions) && raw.directions.every((item) => typeof item === 'string')) repaired.directions = raw.directions
  if (typeof raw.materials === 'string') repaired.materials = raw.materials
  if (raw.voiceLevel === 1 || raw.voiceLevel === 2 || raw.voiceLevel === 3) repaired.voiceLevel = raw.voiceLevel
  if (typeof raw.boardLocked === 'boolean') repaired.boardLocked = raw.boardLocked
  repaired.timer = repairCountdown(raw.timer, repaired.timer)
  repaired.cleanupTimer = repairCountdown(raw.cleanupTimer, repaired.cleanupTimer)

  const rawPeople = raw.people as Partial<ArcTablePeopleState> | undefined
  if (rawPeople?.sectionId === session.sectionId && Array.isArray(rawPeople.roster)) {
    const ids = new Set<string>(); const names = new Set<string>()
    repaired.people.roster = rawPeople.roster.filter((person) => {
      const name = person?.name?.trim().toLocaleLowerCase()
      if (!person?.id || !name || ids.has(person.id) || names.has(name)) return false
      ids.add(person.id); names.add(name); return true
    }).map((person) => ({ id: person.id, name: person.name.trim() }))
    repaired.people.mode = rawPeople.mode === 'round-robin' ? 'round-robin' : 'random'
    repaired.people.selectedId = typeof rawPeople.selectedId === 'string' && ids.has(rawPeople.selectedId) ? rawPeople.selectedId : null
    repaired.people.projected = rawPeople.projected === true && repaired.people.selectedId !== null
  }

  const personIds = new Set(repaired.people.roster.map((person) => person.id))
  const rawPasses = raw.passes as Partial<ArcTablePassState> | undefined
  if (rawPasses?.sectionId === session.sectionId && Array.isArray(rawPasses.passes)) {
    const ids = new Set<string>()
    repaired.passes.passes = rawPasses.passes.filter((pass) => {
      if (!pass?.id || !pass.label?.trim() || ids.has(pass.id) || !['inactive', 'requested', 'active'].includes(pass.status)) return false
      ids.add(pass.id)
      return true
    }).map((pass) => {
      const status = pass.status as 'inactive' | 'requested' | 'active'
      return { id: pass.id, label: pass.label.trim(), status, personId: status !== 'inactive' && typeof pass.personId === 'string' && personIds.has(pass.personId) ? pass.personId : null }
    })
  }

  const rawMedia = raw.media as Partial<ArcTableMediaState> | undefined
  if (rawMedia?.sectionId === session.sectionId && Array.isArray(rawMedia.items)) {
    const ids = new Set<string>()
    repaired.media.items = rawMedia.items.flatMap((item) => {
      if (!item?.id || !item.title?.trim() || ids.has(item.id) || (item.kind !== 'image' && item.kind !== 'slides')) return []
      const source = normalizeArcTableMediaSource(item.kind, item.source)
      if (!source) return []
      ids.add(item.id)
      return [{ id: item.id, title: item.title.trim(), kind: item.kind, source }]
    })
    repaired.media.activeId = typeof rawMedia.activeId === 'string' && ids.has(rawMedia.activeId) ? rawMedia.activeId : null
    repaired.media.projected = rawMedia.projected === true && repaired.media.activeId !== null
  }
  return validateArcTableLiveState(repaired) ? repaired : null
}

function repairCountdown(value: unknown, fallback: ArcTableCountdown): ArcTableCountdown {
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Partial<ArcTableCountdown>
  const duration = Number.isInteger(raw.durationSeconds) ? Math.max(ARC_TABLE_MIN_COUNTDOWN_SECONDS, Math.min(ARC_TABLE_MAX_COUNTDOWN_SECONDS, Number(raw.durationSeconds))) : fallback.durationSeconds
  const remaining = Number.isInteger(raw.remainingSeconds) ? Math.max(0, Math.min(duration, Number(raw.remainingSeconds))) : duration
  const status = ['idle', 'running', 'paused', 'completed'].includes(String(raw.status)) ? raw.status as ArcTableCountdown['status'] : 'idle'
  const validRunStart = typeof raw.runStartedAt === 'string' && !Number.isNaN(Date.parse(raw.runStartedAt)) ? raw.runStartedAt : null
  if (status === 'running' && validRunStart) return { status, durationSeconds: duration, remainingSeconds: remaining, runStartedAt: validRunStart }
  return { status: status === 'running' ? 'paused' : status, durationSeconds: duration, remainingSeconds: remaining, runStartedAt: null }
}

function normalizeSession(value: unknown): ArcTableSession | null {
  if (!value || typeof value !== 'object') return null
  const session = value as ArcTableSession
  if (!session.sectionId || !session.lessonId || !session.courseId || !session.date) return null
  return {
    ...session,
    directions: Array.isArray(session.directions) ? session.directions.filter((item): item is string => typeof item === 'string') : [],
    materials: Array.isArray(session.materials) ? session.materials.filter((item): item is string => typeof item === 'string') : [],
    phases: Array.isArray(session.phases) ? session.phases.filter((item): item is string => typeof item === 'string') : [],
    resources: Array.isArray(session.resources) ? session.resources.filter((resource) => Boolean(resource && typeof resource.id === 'string' && typeof resource.title === 'string' && typeof resource.source === 'string' && ['image', 'slides', 'link'].includes(resource.kind))).map((resource) => ({ ...resource })) : [],
  }
}

function migrateVersionOne(value: unknown): ArcTableLiveState | null {
  if (!value || typeof value !== 'object') return null
  const legacy = value as Record<string, unknown>
  const session = normalizeSession(legacy.session)
  if (legacy.version !== 1 || !session || typeof legacy.startedAt !== 'string') return null
  const legacyStart = new Date(legacy.startedAt)
  if (Number.isNaN(legacyStart.getTime())) return null
  const migrated = createArcTableLiveState(session, legacyStart)
  migrated.phase = typeof legacy.phase === 'number' ? legacy.phase : migrated.phase
  migrated.phaseCount = typeof legacy.phaseCount === 'number' ? legacy.phaseCount : migrated.phaseCount
  migrated.directions = Array.isArray(legacy.directions) && legacy.directions.every((item) => typeof item === 'string') ? legacy.directions : migrated.directions
  migrated.materials = typeof legacy.materials === 'string' ? legacy.materials : migrated.materials
  migrated.voiceLevel = legacy.voiceLevel === 1 || legacy.voiceLevel === 2 || legacy.voiceLevel === 3 ? legacy.voiceLevel : migrated.voiceLevel
  migrated.boardLocked = typeof legacy.boardLocked === 'boolean' ? legacy.boardLocked : migrated.boardLocked
  if (legacy.cleanup === true) migrated.cleanupTimer = { ...migrated.cleanupTimer, status: 'paused' }
  return validateArcTableLiveState(migrated) ? migrated : null
}
