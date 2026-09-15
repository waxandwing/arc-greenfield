import { useEffect, useState } from 'react'
import {
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

  function start(session: ArcTableSession) {
    const next = createArcTableLiveState(session, new Date(), loadArcTableSectionConfig(session.sectionId))
    saveArcTableLiveState(next)
    setLive(next)
    setSurface('teacher')
  }

  function update(updateValue: Partial<Omit<ArcTableLiveState, 'version' | 'session' | 'startedAt'>>) {
    setLive((current) => current ? { ...current, ...updateValue } : current)
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

  return { live, surface, start, update, showPlan, showTeacher, showStudent, finish }
}

function liveSurface(live: ArcTableLiveState | null): ArcSurface {
  return live ? 'teacher' : 'plan'
}
