import { createCourse, type Course } from './courses'
import { stableTextHash, type ImportProvenance } from './importProvenance'
import { createLesson, type Lesson } from './lessons'
import { createUnit, type Unit } from './units'

export const CURRICULUM_CSV_FIELDS = [
  'Course',
  'Order',
  'Unit',
  'Unit Length',
  'Item Type',
  'Title',
  'Item Length',
  'Content/Resources',
  'Homework/Next Up',
  'Important Notes',
] as const

export type CurriculumCsvField = typeof CURRICULUM_CSV_FIELDS[number]
export type ImportSeverity = 'notice' | 'review' | 'fatal'

export type ImportIssue = {
  id: string
  row: number | null
  field: CurriculumCsvField | null
  severity: ImportSeverity
  message: string
}

export type CurriculumCandidate = {
  candidateId: string
  sourceRow: number
  fields: Record<CurriculumCsvField, string>
  detectedType: 'unit' | 'lesson' | 'unknown'
  fingerprint: string
  sourceValueHash: string
  issues: ImportIssue[]
}

export type CurriculumParseResult = {
  sourceIdentity: string
  headers: CurriculumCsvField[]
  candidates: CurriculumCandidate[]
  issues: ImportIssue[]
  canPreview: boolean
}

export type CurriculumImportProposal = {
  sourceIdentity: string
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
  issues: ImportIssue[]
  skippedRows: number[]
}

const HEADER_ALIASES: Record<string, CurriculumCsvField> = {
  course: 'Course',
  order: 'Order',
  unit: 'Unit',
  'unit length': 'Unit Length',
  'item type': 'Item Type',
  type: 'Item Type',
  title: 'Title',
  'item length': 'Item Length',
  'content/resources': 'Content/Resources',
  'content / resources': 'Content/Resources',
  resources: 'Content/Resources',
  'homework/next up': 'Homework/Next Up',
  'homework / next up': 'Homework/Next Up',
  homework: 'Homework/Next Up',
  'important notes': 'Important Notes',
  notes: 'Important Notes',
}

const MAX_SOURCE_LENGTH = 2_000_000
const MAX_ROWS = 5_000

export function parseCurriculumCsv(source: string, sourceIdentity: string): CurriculumParseResult {
  const issues: ImportIssue[] = []
  const identity = sourceIdentity.trim()
  if (!identity) issues.push(issue(null, null, 'fatal', 'Give this source a stable name before review.'))
  if (source.length > MAX_SOURCE_LENGTH) issues.push(issue(null, null, 'fatal', 'This CSV is larger than Arc can safely review in browser storage.'))
  let matrix: string[][] = []
  try {
    matrix = parseCsvMatrix(source.replace(/^\uFEFF/, ''))
  } catch (error) {
    issues.push(issue(null, null, 'fatal', error instanceof Error ? error.message : String(error)))
  }
  if (matrix.length === 0) issues.push(issue(null, null, 'fatal', 'The CSV is empty.'))
  if (matrix.length > MAX_ROWS + 1) issues.push(issue(null, null, 'fatal', `This CSV has more than ${MAX_ROWS} rows.`))

  const rawHeaders = matrix[0] ?? []
  const mappedHeaders = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)] ?? null)
  const present = mappedHeaders.filter((header): header is CurriculumCsvField => Boolean(header))
  const duplicates = present.filter((header, index) => present.indexOf(header) !== index)
  for (const duplicate of new Set(duplicates)) issues.push(issue(1, duplicate, 'fatal', `The CSV contains ${duplicate} more than once.`))
  for (const required of ['Course', 'Unit', 'Item Type', 'Title'] as CurriculumCsvField[]) {
    if (!present.includes(required)) issues.push(issue(1, required, 'fatal', `The CSV needs a ${required} column.`))
  }
  rawHeaders.forEach((header, index) => {
    if (header.trim() && !mappedHeaders[index]) issues.push(issue(1, null, 'notice', `Arc will ignore the unsupported column “${header.trim()}”.`))
  })

  const candidates: CurriculumCandidate[] = []
  if (!issues.some((candidate) => candidate.severity === 'fatal')) {
    matrix.slice(1).forEach((cells, index) => {
      const sourceRow = index + 2
      if (cells.every((cell) => !cell.trim())) return
      const fields = emptyFields()
      mappedHeaders.forEach((header, columnIndex) => { if (header) fields[header] = (cells[columnIndex] ?? '').trim() })
      const rowIssues: ImportIssue[] = []
      if (cells.length > rawHeaders.length && cells.slice(rawHeaders.length).some((cell) => cell.trim())) rowIssues.push(issue(sourceRow, null, 'review', 'This row has values beyond the final header.'))
      if (!fields.Course) rowIssues.push(issue(sourceRow, 'Course', 'review', 'Choose a Course for this row.'))
      if (!fields.Unit) rowIssues.push(issue(sourceRow, 'Unit', 'review', 'Choose a Unit for this row.'))
      if (!fields.Title) rowIssues.push(issue(sourceRow, 'Title', 'review', 'Give this row a title.'))
      const detectedType = detectItemType(fields['Item Type'])
      if (detectedType === 'unknown') rowIssues.push(issue(sourceRow, 'Item Type', 'review', 'Choose whether this row is a Unit or Lesson.'))
      if (fields.Order && (!Number.isInteger(Number(fields.Order)) || Number(fields.Order) < 1)) rowIssues.push(issue(sourceRow, 'Order', 'review', 'Order must be a positive whole number.'))
      const structuralPath = normalizePath([fields.Course, fields.Unit, fields['Item Type'], fields.Order || String(sourceRow)])
      const fingerprint = stableTextHash(['curriculum-csv', identity, String(sourceRow), structuralPath].join('|'))
      const sourceValueHash = stableTextHash(CURRICULUM_CSV_FIELDS.map((field) => fields[field]).join('|'))
      candidates.push({ candidateId: `candidate-${fingerprint}`, sourceRow, fields, detectedType, fingerprint, sourceValueHash, issues: rowIssues })
    })
  }
  if (candidates.length === 0 && !issues.some((candidate) => candidate.severity === 'fatal')) issues.push(issue(null, null, 'fatal', 'The CSV has headers but no curriculum rows.'))
  return { sourceIdentity: identity, headers: present, candidates, issues, canPreview: !issues.some((candidate) => candidate.severity === 'fatal') }
}

export function buildCurriculumImportProposal(input: {
  parsed: CurriculumParseResult
  calendarId: string
  now?: Date
  includeRows?: number[]
}): CurriculumImportProposal {
  if (!input.parsed.canPreview) throw new Error('Resolve fatal CSV issues before previewing changes.')
  const included = new Set(input.includeRows ?? input.parsed.candidates.filter((candidate) => candidate.issues.length === 0).map((candidate) => candidate.sourceRow))
  const rows = input.parsed.candidates.filter((candidate) => included.has(candidate.sourceRow) && candidate.detectedType !== 'unknown' && candidate.fields.Course && candidate.fields.Unit && candidate.fields.Title)
  const importedAt = (input.now ?? new Date()).toISOString()
  const courses: Course[] = []
  const units: Unit[] = []
  const lessons: Lesson[] = []

  for (const row of rows) {
    let course = courses.find((candidate) => candidate.title.toLocaleLowerCase() === row.fields.Course.toLocaleLowerCase())
    if (!course) {
      const provenance = provenanceFor(row, input.parsed.sourceIdentity, importedAt, normalizePath([row.fields.Course]), stableTextHash(row.fields.Course), false)
      course = createCourse({ id: `course-import-${stableTextHash(`${input.parsed.sourceIdentity}|${row.fields.Course}`)}`, title: row.fields.Course, importProvenance: provenance })
      courses.push(course)
    }
    let unit = units.find((candidate) => candidate.courseId === course!.id && candidate.title.toLocaleLowerCase() === row.fields.Unit.toLocaleLowerCase())
    if (!unit) {
      const provenance = provenanceFor(row, input.parsed.sourceIdentity, importedAt, normalizePath([row.fields.Course, row.fields.Unit]), stableTextHash(row.fields.Unit), false)
      unit = createUnit({ id: `unit-import-${stableTextHash(`${input.parsed.sourceIdentity}|${row.fields.Course}|${row.fields.Unit}`)}`, calendarId: input.calendarId, courseId: course.id, title: row.fields.Unit, importProvenance: provenance })
      units.push(unit)
    }
    if (row.detectedType === 'lesson') {
      const sequence = row.fields.Order ? Number(row.fields.Order) : lessons.filter((lesson) => lesson.unitId === unit.id).length + 1
      const resources = importedResources(row)
      const directions = [row.fields['Important Notes'], row.fields['Homework/Next Up'] ? `Next: ${row.fields['Homework/Next Up']}` : ''].filter(Boolean)
      const materials = row.fields['Content/Resources'] ? [row.fields['Content/Resources']] : []
      const lessonValueHash = stableTextHash([row.fields.Title, sequence, directions.join('\n'), materials.join('\n'), '', resources.map((resource) => `${resource.title}:${resource.source}`).join('\n')].join('|'))
      lessons.push(createLesson({
        id: `lesson-import-${row.fingerprint}`,
        calendarId: input.calendarId,
        courseId: course.id,
        unitId: unit.id,
        title: row.fields.Title,
        sequence,
        plannedDate: null,
        directions,
        materials,
        phases: [],
        resources,
        importProvenance: provenanceFor(row, input.parsed.sourceIdentity, importedAt, normalizePath([row.fields.Course, row.fields.Unit, row.fields['Item Type'], row.fields.Order || String(row.sourceRow)]), lessonValueHash),
      }))
    }
  }

  const includedRows = new Set(rows.map((row) => row.sourceRow))
  return {
    sourceIdentity: input.parsed.sourceIdentity,
    courses,
    units,
    lessons,
    issues: [...input.parsed.issues, ...input.parsed.candidates.flatMap((candidate) => candidate.issues)],
    skippedRows: input.parsed.candidates.filter((candidate) => !includedRows.has(candidate.sourceRow)).map((candidate) => candidate.sourceRow),
  }
}

export type ReimportState = 'unchanged' | 'new' | 'changed-upstream' | 'changed-locally' | 'conflict'

export function classifyReimport(incoming: { importProvenance?: ImportProvenance }, existing: { importProvenance?: ImportProvenance } | undefined, currentValueHash?: string): ReimportState {
  if (!existing?.importProvenance || !incoming.importProvenance || existing.importProvenance.fingerprint !== incoming.importProvenance.fingerprint) return 'new'
  const prior = existing.importProvenance.sourceValueHash
  const upstreamChanged = incoming.importProvenance.sourceValueHash !== prior
  const locallyChanged = Boolean(currentValueHash && currentValueHash !== prior)
  if (upstreamChanged && locallyChanged) return 'conflict'
  if (upstreamChanged) return 'changed-upstream'
  if (locallyChanged) return 'changed-locally'
  return 'unchanged'
}

export function canonicalValueHash(record: Course | Unit | Lesson): string {
  if ('unitId' in record) return stableTextHash([record.title, record.sequence, record.directions.join('\n'), record.materials.join('\n'), record.phases.join('\n'), record.resources.map((resource) => `${resource.title}:${resource.source}`).join('\n')].join('|'))
  return stableTextHash(record.title)
}

function parseCsvMatrix(source: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { field += '"'; index += 1 }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"' && field === '') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += char
  }
  if (quoted) throw new Error('The CSV ends inside a quoted value.')
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row) }
  return rows
}

function detectItemType(value: string): CurriculumCandidate['detectedType'] {
  const normalized = value.trim().toLocaleLowerCase()
  if (normalized === 'unit') return 'unit'
  if (['lesson', 'activity', 'project', 'assessment'].includes(normalized)) return 'lesson'
  return 'unknown'
}

function emptyFields(): Record<CurriculumCsvField, string> {
  return Object.fromEntries(CURRICULUM_CSV_FIELDS.map((field) => [field, ''])) as Record<CurriculumCsvField, string>
}

function importedResources(row: CurriculumCandidate): Lesson['resources'] {
  const source = row.fields['Content/Resources']
  if (!/^https?:\/\/\S+$/i.test(source)) return []
  return [{ id: `resource-import-${row.fingerprint}`, title: 'Imported resource', kind: 'link', source }]
}

function normalizeHeader(value: string): string { return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase() }
function normalizePath(values: string[]): string { return values.map((value) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')).join(' > ') }
function issue(row: number | null, field: CurriculumCsvField | null, severity: ImportSeverity, message: string): ImportIssue { return { id: stableTextHash(`${row}|${field}|${severity}|${message}`), row, field, severity, message } }
function provenanceFor(row: CurriculumCandidate, sourceIdentity: string, importedAt: string, structuralPath: string, sourceValueHash: string, includeRow = true): ImportProvenance { return { sourceType: 'curriculum-csv', sourceIdentity, sourceRow: String(row.sourceRow), structuralPath, fingerprint: stableTextHash(['curriculum-csv', sourceIdentity, includeRow ? String(row.sourceRow) : '', structuralPath].join('|')), sourceValueHash, importedAt } }
