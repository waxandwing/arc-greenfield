import type { SchoolCalendar } from '../calendar'
import { classifyReimport, canonicalValueHash, type CurriculumImportProposal, type ReimportState } from './curriculumImport'
import type { Course } from './courses'
import { hydrateLessonWorkspace, type LessonWorkspace } from './lessonWorkspace'
import { LESSON_STORAGE_KEY, serializeLessons } from './lessonPersistence'
import type { Lesson } from './lessons'
import { hydrateUnitWorkspace, type UnitWorkspace } from './unitWorkspace'
import { serializeUnits, UNIT_STORAGE_KEY } from './unitPersistence'
import type { Unit } from './units'
import { hydratePlanningWorkspace, type PlanningWorkspace } from './workspace'
import { PLANNING_WORKSPACE_STORAGE_KEY, serializePlanningWorkspace } from './workspacePersistence'

export type ReimportDecision = 'keep-local' | 'use-source' | 'create-copy'
export type CurriculumImportReceipt = {
  sourceIdentity: string
  created: { courses: number; units: number; lessons: number }
  updated: { courses: number; units: number; lessons: number }
  keptLocal: number
  skippedUnchanged: number
  skippedRows: number[]
  committedAt: string
}

export type PreparedCurriculumCommit = {
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  receipt: CurriculumImportReceipt
}

export type ImportStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function prepareCurriculumCommit(input: {
  proposal: CurriculumImportProposal
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  decisions?: Record<string, ReimportDecision>
  courseMatches?: Record<string, string>
  now?: Date
}): PreparedCurriculumCommit {
  const decisions = input.decisions ?? {}
  const receipt: CurriculumImportReceipt = {
    sourceIdentity: input.proposal.sourceIdentity,
    created: { courses: 0, units: 0, lessons: 0 },
    updated: { courses: 0, units: 0, lessons: 0 },
    keptLocal: 0,
    skippedUnchanged: 0,
    skippedRows: [...input.proposal.skippedRows],
    committedAt: (input.now ?? new Date()).toISOString(),
  }
  const explicitCourseMatches = input.courseMatches ?? {}
  for (const [proposedId, existingId] of Object.entries(explicitCourseMatches)) {
    if (!input.proposal.courses.some((course) => course.id === proposedId) || !input.planning.courses.some((course) => course.id === existingId)) throw new Error('A confirmed Course match no longer exists. Review the import again.')
  }
  const unmatchedCourses = input.proposal.courses.filter((course) => !explicitCourseMatches[course.id])
  const courseResult = reconcileRecords(input.planning.courses, unmatchedCourses, decisions, 'courses', receipt)
  const courseIdMap = new Map(input.proposal.courses.map((course) => [course.id, explicitCourseMatches[course.id] ?? courseResult.idMap.get(course.id) ?? course.id]))
  const proposedUnits = input.proposal.units.map((unit) => ({ ...unit, courseId: courseIdMap.get(unit.courseId) ?? unit.courseId }))
  const unitResult = reconcileRecords(input.units.units, proposedUnits, decisions, 'units', receipt)
  const unitIdMap = new Map(input.proposal.units.map((unit, index) => [unit.id, unitResult.idMap.get(proposedUnits[index].id) ?? proposedUnits[index].id]))
  const proposedLessons = input.proposal.lessons.map((lesson) => ({ ...lesson, courseId: courseIdMap.get(lesson.courseId) ?? lesson.courseId, unitId: unitIdMap.get(lesson.unitId) ?? lesson.unitId }))
  const lessonResult = reconcileRecords(input.lessons.lessons, proposedLessons, decisions, 'lessons', receipt)

  const planning = hydratePlanningWorkspace({ ...input.planning, courses: courseResult.records })
  const units = hydrateUnitWorkspace({ ...input.units, units: unitResult.records }, input.calendar, planning)
  const lessons = hydrateLessonWorkspace({ ...input.lessons, lessons: lessonResult.records }, input.calendar, planning, units)
  return { planning, units, lessons, receipt }
}

export function commitCurriculumImport(prepared: PreparedCurriculumCommit, storage: ImportStorage = window.localStorage): { saved: boolean; rollbackSucceeded: boolean } {
  const entries: Array<[string, string]> = [
    [PLANNING_WORKSPACE_STORAGE_KEY, serializePlanningWorkspace(prepared.planning)],
    [UNIT_STORAGE_KEY, serializeUnits(prepared.units)],
    [LESSON_STORAGE_KEY, serializeLessons(prepared.lessons)],
  ]
  const previous = new Map(entries.map(([key]) => [key, storage.getItem(key)]))
  try {
    for (const [key, value] of entries) storage.setItem(key, value)
    return { saved: true, rollbackSucceeded: true }
  } catch {
    let rollbackSucceeded = true
    for (const [key] of entries) {
      try {
        const value = previous.get(key)
        if (value === null || value === undefined) storage.removeItem(key)
        else storage.setItem(key, value)
      } catch { rollbackSucceeded = false }
    }
    return { saved: false, rollbackSucceeded }
  }
}

function reconcileRecords<T extends Course | Unit | Lesson>(existing: T[], incoming: T[], decisions: Record<string, ReimportDecision>, kind: keyof CurriculumImportReceipt['created'], receipt: CurriculumImportReceipt): { records: T[]; idMap: Map<string, string> } {
  const records = existing.map((record) => ({ ...record })) as T[]
  const idMap = new Map<string, string>()
  for (const proposed of incoming) {
    const fingerprint = proposed.importProvenance?.fingerprint
    const matchIndex = fingerprint ? records.findIndex((record) => record.importProvenance?.fingerprint === fingerprint) : -1
    const match = matchIndex >= 0 ? records[matchIndex] : undefined
    const state: ReimportState = classifyReimport(proposed, match, match ? canonicalValueHash(match) : undefined)
    const decision = fingerprint ? decisions[fingerprint] : undefined
    if (state === 'new' || decision === 'create-copy') {
      const record = decision === 'create-copy' ? { ...proposed, id: `${proposed.id}-copy-${records.length + 1}` } as T : proposed
      records.push(record)
      idMap.set(proposed.id, record.id)
      receipt.created[kind] += 1
      continue
    }
    if (!match) continue
    idMap.set(proposed.id, match.id)
    if (state === 'unchanged') { receipt.skippedUnchanged += 1; continue }
    if (decision === 'keep-local') { receipt.keptLocal += 1; continue }
    if (decision !== 'use-source') throw new Error(`Choose how to resolve ${state.replace('-', ' ')} imported content before committing.`)
    records[matchIndex] = { ...proposed, id: match.id } as T
    receipt.updated[kind] += 1
  }
  return { records, idMap }
}
