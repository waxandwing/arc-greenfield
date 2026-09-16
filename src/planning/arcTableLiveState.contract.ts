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
  directions: ['Compare the west façade and nave elevation.'], materials: ['Workbook', 'Pencil'],
  phases: ['Look', 'Compare', 'Discuss', 'Reflect'], resources: [],
}

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
  removeItem: (key: string) => { memory.delete(key) },
}

const live = createArcTableLiveState(session, new Date('2026-10-16T15:20:00.000Z'))
if (live.boardLocked !== false) throw new Error('New live classes must default to Editable (board unlocked) in Teacher Monitor.')
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
if (restored.directions[0] !== session.directions[0] || restored.materials !== 'Workbook · Pencil') throw new Error('ArcTable live state must originate from canonical Lesson teaching content.')
if (!clearArcTableLiveState(storage) || memory.has(ARC_TABLE_LIVE_STORAGE_KEY)) throw new Error('Ending ArcTable should clear only the live-session key.')

storage.setItem(ARC_TABLE_LIVE_STORAGE_KEY, JSON.stringify({
  version: 1, session, startedAt: '2026-10-16T15:20:00.000Z', phase: 2, phaseCount: 4,
  directions: ['Continue the discussion.'], materials: 'Prints', voiceLevel: 1, cleanup: true, boardLocked: false,
}))
const migrated = loadArcTableLiveState(storage)
if (!migrated || migrated.version !== 2 || migrated.phase !== 2 || migrated.cleanupTimer.status !== 'paused') throw new Error('Existing version-one live classes must migrate without losing their instructional state.')

const hostile = createArcTableLiveState(session)
hostile.people = { ...hostile.people, roster: [{ id: 'duplicate', name: 'Maya' }, { id: 'duplicate', name: 'Luis' }], selectedId: 'missing', projected: true }
hostile.media = { ...hostile.media, items: [{ id: 'media-one', title: 'Safe', kind: 'image', source: '/safe.png' }], activeId: 'missing', projected: true }
hostile.passes = { ...hostile.passes, passes: [{ id: 'same', label: 'Hall', status: 'active', personId: 'missing' }, { id: 'same', label: 'Office', status: 'requested', personId: null }] }
hostile.timer = { status: 'running', durationSeconds: 60, remainingSeconds: 90, runStartedAt: null }
storage.setItem(ARC_TABLE_LIVE_STORAGE_KEY, JSON.stringify(hostile))
const repaired = loadArcTableLiveState(storage)
if (!repaired) throw new Error('Malformed Version 2 transient state must repair safely instead of crashing the planner.')
if (repaired.people.roster.length !== 1 || repaired.people.selectedId !== null || repaired.people.projected) throw new Error('Malformed roster identity and selection must repair to possible state.')
if (repaired.media.activeId !== null || repaired.media.projected) throw new Error('Impossible active media state must repair to no active projection.')
if (repaired.passes.passes.length !== 1 || repaired.passes.passes[0].personId !== null) throw new Error('Duplicate pass IDs and unknown pass ownership must repair safely.')
if (repaired.timer.status !== 'paused' || repaired.timer.remainingSeconds !== 60 || repaired.timer.runStartedAt !== null) throw new Error('Impossible countdown state must clamp and remove invalid running origin.')

if (!saveArcTableLiveState(repaired, storage) || !loadArcTableLiveState(storage)) throw new Error('Repaired Version 2 live state must round-trip.')

console.log('ArcTable live-session persistence contract passed')
