import { useEffect, useState } from 'react'
import {
  ARC_TABLE_LIVE_STORAGE_KEY,
  clearArcTableLiveState,
  createArcTableLiveState,
  loadArcTableSectionConfig,
  loadArcTableLiveState,
  saveArcTableSectionConfig,
  saveArcTableLiveState,
  type ArcTableLiveState,
  type ArcTableSession,
} from '../planning'

export type ArcSurface = 'plan' | 'teacher' | 'student'

export function useArcTableSession() {
  const [live, setLive] = useState<ArcTableLiveState | null>(loadArcTableLiveState)
  const [surface, setSurface] = useState<ArcSurface>(() => liveSurface(live))

  useEffect(() => {
    if (live) {
      saveArcTableLiveState(live)
      saveArcTableSectionConfig({
        sectionId: live.session.sectionId,
        roster: live.people.roster,
        passDefinitions: live.passes.passes.map(({ id, label }) => ({ id, label })),
      })
    }
  }, [live])

  // Student / projector tabs follow the teacher’s persisted live state (phase, timer, voice, media).
  useEffect(() => {
    if (surface !== 'student') return
    function onStorage(event: StorageEvent) {
      if (event.key !== ARC_TABLE_LIVE_STORAGE_KEY) return
      const stored = loadArcTableLiveState()
      if (stored) setLive(stored)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [surface])

  function start(session: ArcTableSession) {
    const next = createArcTableLiveState(session, new Date(), loadArcTableSectionConfig(session.sectionId))
    saveArcTableLiveState(next)
    setLive(next)
    setSurface('teacher')
  }

  function update(updateValue: Partial<Omit<ArcTableLiveState, 'version' | 'session' | 'startedAt'>>) {
    setLive((current) => current ? { ...current, ...updateValue } : current)
  }

  /** Reload shared session state from storage (multi-tab Sync / Follow teacher). */
  function syncLive(): boolean {
    const stored = loadArcTableLiveState()
    if (!stored) return false
    setLive(stored)
    return true
  }

  function showPlan() {
    if (live) setSurface('plan')
  }

  function showTeacher() {
    if (live) setSurface('teacher')
  }

  function showStudent() {
    if (live) setSurface('student')
  }

  function finish() {
    clearArcTableLiveState()
    setLive(null)
    setSurface('plan')
  }

  return { live, surface, start, update, syncLive, showPlan, showTeacher, showStudent, finish }
}

function liveSurface(live: ArcTableLiveState | null): ArcSurface {
  return live ? 'teacher' : 'plan'
}
