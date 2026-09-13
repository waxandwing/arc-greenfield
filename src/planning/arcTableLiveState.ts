import type { ArcTableSession } from './arcTableSession'

export const ARC_TABLE_LIVE_STORAGE_KEY = 'arc.arctable.live.v1'

export type ArcTableLiveState = {
  version: 1
  session: ArcTableSession
  startedAt: string
  phase: number
  phaseCount: number
  directions: string[]
  materials: string
  voiceLevel: 1 | 2 | 3
  cleanup: boolean
  boardLocked: boolean
}

export function createArcTableLiveState(session: ArcTableSession, now = new Date()): ArcTableLiveState {
  return {
    version: 1,
    session,
    startedAt: now.toISOString(),
    phase: 1,
    phaseCount: 4,
    directions: ['Open the lesson prompt.', 'Study the material together.', 'Record what the class should continue next.'],
    materials: 'Lesson materials',
    voiceLevel: 2,
    cleanup: false,
    boardLocked: true,
  }
}

export function validateArcTableLiveState(value: unknown): value is ArcTableLiveState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<ArcTableLiveState>
  const session = state.session as Partial<ArcTableSession> | undefined
  return state.version === 1
    && Boolean(session?.sectionId && session.lessonId && session.courseId && session.date)
    && typeof state.startedAt === 'string'
    && !Number.isNaN(Date.parse(state.startedAt))
    && Number.isInteger(state.phase) && Number.isInteger(state.phaseCount)
    && Number(state.phase) >= 1 && Number(state.phaseCount) >= Number(state.phase)
    && Array.isArray(state.directions) && state.directions.every((item) => typeof item === 'string')
    && typeof state.materials === 'string'
    && (state.voiceLevel === 1 || state.voiceLevel === 2 || state.voiceLevel === 3)
    && typeof state.cleanup === 'boolean'
    && typeof state.boardLocked === 'boolean'
}

export function loadArcTableLiveState(storage: Pick<Storage, 'getItem'> = localStorage): ArcTableLiveState | null {
  try {
    const stored = storage.getItem(ARC_TABLE_LIVE_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    return validateArcTableLiveState(parsed) ? parsed : null
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
