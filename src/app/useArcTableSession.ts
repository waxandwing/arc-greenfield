import { useEffect, useState } from 'react'
import {
  clearArcTableLiveState,
  createArcTableLiveState,
  loadArcTableLiveState,
  saveArcTableLiveState,
  type ArcTableLiveState,
  type ArcTableSession,
} from '../planning'

export type ArcSurface = 'plan' | 'teacher' | 'student'

export function useArcTableSession() {
  const [live, setLive] = useState<ArcTableLiveState | null>(loadArcTableLiveState)
  const [surface, setSurface] = useState<ArcSurface>(() => liveSurface(live))

  useEffect(() => {
    if (live) saveArcTableLiveState(live)
  }, [live])

  function start(session: ArcTableSession) {
    const next = createArcTableLiveState(session)
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
