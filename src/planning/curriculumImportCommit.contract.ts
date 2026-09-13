import { hydrateSchoolCalendar } from '../calendar/hydration'
import { buildCurriculumImportProposal, parseCurriculumCsv } from './curriculumImport'
import { commitCurriculumImport, prepareCurriculumCommit, type ImportStorage } from './curriculumImportCommit'
import { LESSON_STORAGE_KEY } from './lessonPersistence'
import { PLANNING_WORKSPACE_STORAGE_KEY } from './workspacePersistence'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }

const calendar = hydrateSchoolCalendar({ id: 'calendar', schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] })
const csv = 'Course,Order,Unit,Item Type,Title,Content/Resources,Homework/Next Up,Important Notes\nArt,1,Line,Lesson,Contour,https://example.com,Practice,Look slowly'
const proposal = buildCurriculumImportProposal({ parsed: parseCurriculumCsv(csv, 'art.csv'), calendarId: calendar.id, now: new Date('2026-09-13T12:00:00.000Z') })
const prepared = prepareCurriculumCommit({ proposal, calendar, planning: { calendarId: calendar.id, courses: [], sections: [], notes: [] }, units: { calendarId: calendar.id, units: [] }, lessons: { calendarId: calendar.id, lessons: [], deliveryStates: [] }, now: new Date('2026-09-13T12:01:00.000Z') })
assert(prepared.receipt.created.courses === 1 && prepared.receipt.created.units === 1 && prepared.receipt.created.lessons === 1, 'Preview must produce an exact canonical change receipt.')

const backing = new Map<string, string>([[PLANNING_WORKSPACE_STORAGE_KEY, 'old-planning'], [LESSON_STORAGE_KEY, 'old-lessons']])
let writes = 0
const failingStorage: ImportStorage = { getItem: (key) => backing.get(key) ?? null, setItem: (key, value) => { writes += 1; if (writes === 2) throw new Error('quota'); backing.set(key, value) }, removeItem: (key) => { backing.delete(key) } }
const failed = commitCurriculumImport(prepared, failingStorage)
assert(!failed.saved && failed.rollbackSucceeded, 'A failed multi-store import must report rollback.')
assert(backing.get(PLANNING_WORKSPACE_STORAGE_KEY) === 'old-planning' && backing.get(LESSON_STORAGE_KEY) === 'old-lessons', 'A failed import must restore every prior canonical value.')

const working = new Map<string, string>()
const storage: ImportStorage = { getItem: (key) => working.get(key) ?? null, setItem: (key, value) => { working.set(key, value) }, removeItem: (key) => { working.delete(key) } }
assert(commitCurriculumImport(prepared, storage).saved, 'Explicit confirmation may atomically commit all canonical stores.')
assert(working.size === 3, 'A successful curriculum commit must write planning, Unit, and Lesson truth together.')

const changedProposal = buildCurriculumImportProposal({ parsed: parseCurriculumCsv(csv.replace('Contour', 'Contour in ink'), 'art.csv'), calendarId: calendar.id, now: new Date('2026-09-14T12:00:00.000Z') })
let requiredDecision = false
try { prepareCurriculumCommit({ proposal: changedProposal, calendar, planning: prepared.planning, units: prepared.units, lessons: prepared.lessons }) } catch { requiredDecision = true }
assert(requiredDecision, 'A changed upstream record must not overwrite canonical truth without a decision.')
const fingerprint = changedProposal.lessons[0].importProvenance?.fingerprint
assert(Boolean(fingerprint), 'Changed import needs a stable fingerprint for resolution.')
const kept = prepareCurriculumCommit({ proposal: changedProposal, calendar, planning: prepared.planning, units: prepared.units, lessons: prepared.lessons, decisions: { [fingerprint!]: 'keep-local' } })
assert(kept.lessons.lessons[0].title === 'Contour' && kept.receipt.keptLocal === 1, 'Keep local must preserve teacher-edited canonical truth.')

console.log('atomic curriculum import contract passed')
