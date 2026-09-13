import { buildCurriculumImportProposal, canonicalValueHash, classifyReimport, parseCurriculumCsv } from './curriculumImport'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }

const header = 'Course,Order,Unit,Unit Length,Item Type,Title,Item Length,Content/Resources,Homework/Next Up,Important Notes'
const csv = `${header}\nArt,1,Line,2 weeks,Lesson,"Contour, slowly",45 min,https://example.com,Bring pencil,"Model \"\"slow looking\"\""\nArt,2,Line,2 weeks,Lesson,"Contour, slowly",45 min,,,`
const parsed = parseCurriculumCsv(csv, 'art-2026.csv')
assert(parsed.canPreview, 'A canonical CSV must reach preview without mutating truth.')
assert(parsed.candidates.length === 2, 'Quoted commas must not split curriculum rows.')
assert(parsed.candidates[0].fields.Title === 'Contour, slowly', 'Quoted values must parse faithfully.')
const proposal = buildCurriculumImportProposal({ parsed, calendarId: 'calendar', now: new Date('2026-09-13T12:00:00.000Z') })
assert(proposal.courses.length === 1 && proposal.units.length === 1 && proposal.lessons.length === 2, 'Grouping must create one Course and Unit while preserving duplicate Lesson titles.')
assert(proposal.lessons[0].id !== proposal.lessons[1].id, 'Lesson identity must not deduplicate by title.')
assert(proposal.lessons.every((lesson) => lesson.plannedDate === null), 'Undated curriculum must stay unscheduled.')
assert(proposal.lessons[0].importProvenance?.sourceRow === '2', 'Imported records must retain source-row provenance.')

const missingType = parseCurriculumCsv(`${header}\nArt,1,Line,, ,Contour,,,,`, 'bad.csv')
assert(missingType.candidates[0].issues.some((issue) => issue.field === 'Item Type'), 'Missing item type must require review rather than destructive guessing.')
assert(buildCurriculumImportProposal({ parsed: missingType, calendarId: 'calendar' }).lessons.length === 0, 'Unresolved rows must not enter a proposal by default.')
assert(!parseCurriculumCsv('Course,Unit,Item Type,Title\n"Art,Line,Lesson,Oops', 'broken.csv').canPreview, 'Unclosed quotes must fail closed.')
assert(!parseCurriculumCsv('Course,Unit,Item Type,Title,Title\nArt,Line,Lesson,A,B', 'duplicate-header.csv').canPreview, 'Duplicate canonical headers must fail closed.')
const bomCrlf = parseCurriculumCsv('\uFEFF Course , Unit , Item Type , Title\r\n Art , Line , Activity , Study ', 'windows.csv')
assert(bomCrlf.canPreview && bomCrlf.candidates[0].detectedType === 'lesson', 'BOM, CRLF, whitespace, and supported mixed item labels must normalize safely.')
const malformed = parseCurriculumCsv('Course,Unit,Item Type,Title\nArt,Line,Lesson,Study,orphan', 'malformed.csv')
assert(malformed.candidates[0].issues.some((issue) => issue.message.includes('beyond the final header')), 'Extra row cells must be held for review.')

const lesson = proposal.lessons[0]
assert(classifyReimport(lesson, lesson, canonicalValueHash(lesson)) === 'unchanged', 'An untouched identical import must be unchanged.')
const locallyEdited = { ...lesson, title: 'Local edit' }
assert(classifyReimport(lesson, locallyEdited, canonicalValueHash(locallyEdited)) === 'changed-locally', 'Local edits must not be silently overwritten.')
const upstreamCsv = csv.replace('Contour, slowly', 'Contour with ink')
const upstream = buildCurriculumImportProposal({ parsed: parseCurriculumCsv(upstreamCsv, 'art-2026.csv'), calendarId: 'calendar', now: new Date('2026-09-14T12:00:00.000Z') }).lessons[0]
assert(upstream.importProvenance?.fingerprint === lesson.importProvenance?.fingerprint, 'A source edit in the same structural row must retain its re-import fingerprint.')
assert(classifyReimport(upstream, lesson, canonicalValueHash(lesson)) === 'changed-upstream', 'Changed source content must be distinguished from a new Lesson.')
assert(classifyReimport(upstream, locallyEdited, canonicalValueHash(locallyEdited)) === 'conflict', 'Simultaneous source and local edits must require explicit conflict resolution.')

console.log('hostile curriculum import contract passed')
