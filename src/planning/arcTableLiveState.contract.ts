import {
  ARC_TABLE_LIVE_STORAGE_KEY,
  clearArcTableLiveState,
  createArcTableLiveState,
  elapsedLiveMinutes,
  loadArcTableLiveState,
  saveArcTableLiveState,
} from './arcTableLiveState'
import { addArcTableMedia, addArcTablePerson, pauseArcTableCountdown, setArcTablePassStatus, startArcTableCountdown } from './arcTableTools'
import type { ArcTableSession } from './arcTableSession'

const session: ArcTableSession = {
  date: '2026-10-16', courseId: 'course-apah', courseTitle: 'AP Art History',
  sectionId: 'section-p4', sectionName: 'Period 4', lessonId: 'lesson-chartres',
  lessonTitle: 'Gothic cathedrals: Chartres', unitId: 'unit-3', unitTitle: 'Early Europe',
  source: 'scheduled', datePolicy: 'flexible', sharedPlannedDate: '2026-10-16',
  effectiveDate: '2026-10-16', isSectionOverride: false, deliveryStatus: 'not-started',
  taughtDate: null, resumeNote: null,
}

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
  removeItem: (key: string) => { memory.delete(key) },
}

const live = createArcTableLiveState(session, new Date('2026-10-16T15:20:00.000Z'))
live.timer = pauseArcTableCountdown(startArcTableCountdown(live.timer, new Date('2026-10-16T15:21:00.000Z')), new Date('2026-10-16T15:22:30.000Z'))
live.cleanupTimer = startArcTableCountdown(live.cleanupTimer, new Date('2026-10-16T15:23:00.000Z'))
live.people = addArcTablePerson(live.people, 'Maya Chen')
live.passes = setArcTablePassStatus(live.passes, 'hall-pass', 'active')
live.media = addArcTableMedia(live.media, { title: 'Chartres', kind: 'image', source: '/chartres.png' })
if (!saveArcTableLiveState(live, storage)) throw new Error('ArcTable live state should save.')
const restored = loadArcTableLiveState(storage)
if (!restored || restored.session.lessonId !== session.lessonId) throw new Error('ArcTable live state should restore the same Lesson.')
if (elapsedLiveMinutes(restored, new Date('2026-10-16T15:43:10.000Z')) !== 23) throw new Error('ArcTable elapsed time should survive navigation and restore.')
if (restored.startedAt !== live.startedAt || restored.timer.status !== 'paused' || restored.timer.remainingSeconds !== 510) throw new Error('Class elapsed origin and paused classroom timer must persist independently.')
if (restored.cleanupTimer.status !== 'running' || restored.people.roster[0]?.name !== 'Maya Chen' || restored.passes.passes[0]?.status !== 'active' || restored.media.items[0]?.title !== 'Chartres') throw new Error('Cleanup, people, pass, and media state must survive Plan View and refresh.')
if (!clearArcTableLiveState(storage) || memory.has(ARC_TABLE_LIVE_STORAGE_KEY)) throw new Error('Ending ArcTable should clear only the live-session key.')

storage.setItem(ARC_TABLE_LIVE_STORAGE_KEY, JSON.stringify({
  version: 1, session, startedAt: '2026-10-16T15:20:00.000Z', phase: 2, phaseCount: 4,
  directions: ['Continue the discussion.'], materials: 'Prints', voiceLevel: 1, cleanup: true, boardLocked: false,
}))
const migrated = loadArcTableLiveState(storage)
if (!migrated || migrated.version !== 2 || migrated.phase !== 2 || migrated.cleanupTimer.status !== 'paused') throw new Error('Existing version-one live classes must migrate without losing their instructional state.')

console.log('ArcTable live-session persistence contract passed')
