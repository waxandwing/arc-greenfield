import {
  ARC_TABLE_LIVE_STORAGE_KEY,
  clearArcTableLiveState,
  createArcTableLiveState,
  elapsedLiveMinutes,
  loadArcTableLiveState,
  saveArcTableLiveState,
} from './arcTableLiveState'
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
if (!saveArcTableLiveState(live, storage)) throw new Error('ArcTable live state should save.')
const restored = loadArcTableLiveState(storage)
if (!restored || restored.session.lessonId !== session.lessonId) throw new Error('ArcTable live state should restore the same Lesson.')
if (elapsedLiveMinutes(restored, new Date('2026-10-16T15:43:10.000Z')) !== 23) throw new Error('ArcTable elapsed time should survive navigation and restore.')
if (!clearArcTableLiveState(storage) || memory.has(ARC_TABLE_LIVE_STORAGE_KEY)) throw new Error('Ending ArcTable should clear only the live-session key.')

console.log('ArcTable live-session persistence contract passed')
