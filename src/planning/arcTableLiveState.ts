import type { ArcTableSession } from './arcTableSession'
import {
  createArcTableCountdown,
  createArcTableMediaState,
  createArcTablePassState,
  createArcTablePeopleState,
  type ArcTableCountdown,
  type ArcTableMediaState,
  type ArcTablePassState,
  type ArcTablePeopleState,
} from './arcTableTools'

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

export function createArcTableLiveState(session: ArcTableSession, now = new Date()): ArcTableLiveState {
  return {
    version: 2,
    session,
    startedAt: now.toISOString(),
    phase: 1,
    phaseCount: 4,
    directions: ['Open the lesson prompt.', 'Study the material together.', 'Record what the class should continue next.'],
    materials: 'Lesson materials',
    voiceLevel: 2,
    boardLocked: true,
    timer: createArcTableCountdown(600),
    cleanupTimer: createArcTableCountdown(300),
    people: createArcTablePeopleState(session.sectionId),
    passes: createArcTablePassState(session.sectionId),
    media: createArcTableMediaState(session.sectionId),
  }
}

export function validateArcTableLiveState(value: unknown): value is ArcTableLiveState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<ArcTableLiveState>
  const session = state.session as Partial<ArcTableSession> | undefined
  return state.version === 2
    && Boolean(session?.sectionId && session.lessonId && session.courseId && session.date)
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
    && validatePasses(state.passes, session?.sectionId)
    && validateMedia(state.media, session?.sectionId)
}

export function loadArcTableLiveState(storage: Pick<Storage, 'getItem'> = localStorage): ArcTableLiveState | null {
  try {
    const stored = storage.getItem(ARC_TABLE_LIVE_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    if (validateArcTableLiveState(parsed)) return parsed
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
    && Number.isInteger(countdown.durationSeconds) && Number(countdown.durationSeconds) >= 10
    && Number.isInteger(countdown.remainingSeconds) && Number(countdown.remainingSeconds) >= 0
    && (countdown.runStartedAt === null || (typeof countdown.runStartedAt === 'string' && !Number.isNaN(Date.parse(countdown.runStartedAt))))
}

function validatePeople(value: unknown, sectionId: string | undefined): value is ArcTablePeopleState {
  if (!value || typeof value !== 'object') return false
  const people = value as Partial<ArcTablePeopleState>
  return people.sectionId === sectionId && Array.isArray(people.roster)
    && people.roster.every((person) => Boolean(person && typeof person.id === 'string' && typeof person.name === 'string'))
    && (people.selectedId === null || typeof people.selectedId === 'string')
    && typeof people.projected === 'boolean'
}

function validatePasses(value: unknown, sectionId: string | undefined): value is ArcTablePassState {
  if (!value || typeof value !== 'object') return false
  const passes = value as Partial<ArcTablePassState>
  return passes.sectionId === sectionId && Array.isArray(passes.passes)
    && passes.passes.every((pass) => Boolean(pass && typeof pass.id === 'string' && typeof pass.label === 'string' && ['inactive', 'requested', 'active'].includes(pass.status)))
}

function validateMedia(value: unknown, sectionId: string | undefined): value is ArcTableMediaState {
  if (!value || typeof value !== 'object') return false
  const media = value as Partial<ArcTableMediaState>
  return media.sectionId === sectionId && Array.isArray(media.items)
    && media.items.every((item) => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && ['image', 'slides'].includes(item.kind) && typeof item.source === 'string'))
    && (media.activeId === null || typeof media.activeId === 'string')
    && typeof media.projected === 'boolean'
}

function migrateVersionOne(value: unknown): ArcTableLiveState | null {
  if (!value || typeof value !== 'object') return null
  const legacy = value as Record<string, unknown>
  const session = legacy.session as ArcTableSession | undefined
  if (legacy.version !== 1 || !session?.sectionId || typeof legacy.startedAt !== 'string') return null
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
