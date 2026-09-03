import { assertISODate, type SchoolCalendar } from '../calendar'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { validateSectionScheduleWorkspace, type SectionScheduleWorkspace } from './sectionScheduleWorkspace'
import type { SameDayLessonApproval } from './sameDayApproval'
import type { ShiftUndoToken } from './shiftOperation'

const STORAGE_KEY = 'arc.shift.v1'

export type ShiftPersistenceInput = {
  calendarId: string
  overrides: SectionLessonDateOverride[]
  sameDayApprovals: SameDayLessonApproval[]
  undo: ShiftUndoToken | null
}

type StoredShiftStateV1 = {
  schemaVersion: 1
  input: {
    calendarId: string
    overrides: SectionLessonDateOverride[]
    undo: ShiftUndoToken | null
  }
}

type StoredShiftStateV2 = {
  schemaVersion: 2
  input: ShiftPersistenceInput
}

type ParsedShiftState = {
  input: ShiftPersistenceInput
  undoStatus: 'none' | 'parsed' | 'malformed'
}

export type ShiftLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; input: ShiftPersistenceInput; undoStatus: 'none' | 'restored' | 'discarded' }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeShiftState(input: ShiftPersistenceInput): string {
  return JSON.stringify({ schemaVersion: 2, input } satisfies StoredShiftStateV2)
}

export function deserializeShiftState(raw: string): ShiftPersistenceInput | null {
  return parseStoredShiftState(raw)?.input ?? null
}

export function validateShiftPersistenceInput(
  input: ShiftPersistenceInput,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): { scheduleErrors: string[]; undoValid: boolean } {
  const schedule: SectionScheduleWorkspace = {
    calendarId: input.calendarId,
    overrides: input.overrides,
    sameDayApprovals: input.sameDayApprovals,
  }
  const scheduleErrors = validateSectionScheduleWorkspace(schedule, calendar, planning, units, lessons)
  const undoValid = scheduleErrors.length === 0 && (
    !input.undo || validateUndoAgainstSchedule(input.undo, input, calendar, planning, units, lessons)
  )
  return { scheduleErrors, undoValid }
}

export function saveShiftStateToBrowser(input: ShiftPersistenceInput): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeShiftState(input))
    return true
  } catch {
    return false
  }
}

export function loadShiftStateFromBrowser(
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): ShiftLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }

  if (!raw) return { status: 'empty' }
  const parsed = parseStoredShiftState(raw)
  if (!parsed) return { status: 'invalid' }
  if (parsed.input.calendarId !== calendar.id) return { status: 'empty' }

  const validation = validateShiftPersistenceInput(parsed.input, calendar, planning, units, lessons)
  if (validation.scheduleErrors.length > 0) return { status: 'invalid' }

  if (parsed.undoStatus === 'malformed' || !validation.undoValid) {
    return {
      status: 'restored',
      input: { ...parsed.input, undo: null },
      undoStatus: 'discarded',
    }
  }

  return {
    status: 'restored',
    input: parsed.input,
    undoStatus: parsed.input.undo ? 'restored' : 'none',
  }
}

function parseStoredShiftState(raw: string): ParsedShiftState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredShiftStateV1 | StoredShiftStateV2>
    if ((parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) || !parsed.input) return null
    if (typeof parsed.input.calendarId !== 'string') return null
    if (!Array.isArray(parsed.input.overrides)) return null

    const overrides = parseOverrides(parsed.input.overrides)
    if (!overrides) return null

    let sameDayApprovals: SameDayLessonApproval[] = []
    if (parsed.schemaVersion === 2) {
      const value = (parsed.input as Partial<ShiftPersistenceInput>).sameDayApprovals
      if (!Array.isArray(value)) return null
      const approvals = parseSameDayApprovals(value)
      if (!approvals) return null
      sameDayApprovals = approvals
    }

    const undoValue = parsed.input.undo
    if (undoValue === null) {
      return { input: { calendarId: parsed.input.calendarId, overrides, sameDayApprovals, undo: null }, undoStatus: 'none' }
    }

    const undo = parseUndoToken(undoValue)
    if (!undo) {
      return { input: { calendarId: parsed.input.calendarId, overrides, sameDayApprovals, undo: null }, undoStatus: 'malformed' }
    }

    return { input: { calendarId: parsed.input.calendarId, overrides, sameDayApprovals, undo }, undoStatus: 'parsed' }
  } catch {
    return null
  }
}

function validateUndoAgainstSchedule(
  token: ShiftUndoToken,
  current: ShiftPersistenceInput,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): boolean {
  if (!token.operationId.trim() || !token.sectionId.trim()) return false
  if (!planning.sections.some((section) => section.id === token.sectionId)) return false
  if (!allOverridesBelongToSection(token.previousSectionOverrides, token.sectionId)) return false
  if (!allOverridesBelongToSection(token.appliedSectionOverrides, token.sectionId)) return false
  if (hasDuplicateOverrideKeys(token.previousSectionOverrides) || hasDuplicateOverrideKeys(token.appliedSectionOverrides)) return false

  const currentSectionOverrides = normalizeOverrides(current.overrides.filter((override) => override.sectionId === token.sectionId))
  const appliedSectionOverrides = normalizeOverrides(token.appliedSectionOverrides)
  if (JSON.stringify(currentSectionOverrides) !== JSON.stringify(appliedSectionOverrides)) return false

  const previousFullSchedule: SectionScheduleWorkspace = {
    calendarId: calendar.id,
    overrides: [
      ...current.overrides.filter((override) => override.sectionId !== token.sectionId),
      ...token.previousSectionOverrides,
    ],
    sameDayApprovals: current.sameDayApprovals,
  }
  return validateSectionScheduleWorkspace(previousFullSchedule, calendar, planning, units, lessons).length === 0
}

function parseOverrides(value: unknown[]): SectionLessonDateOverride[] | null {
  const result: SectionLessonDateOverride[] = []
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null
    const override = candidate as Partial<SectionLessonDateOverride>
    if (typeof override.sectionId !== 'string' || typeof override.lessonId !== 'string' || typeof override.plannedDate !== 'string') return null
    try {
      assertISODate(override.plannedDate)
    } catch {
      return null
    }
    result.push({ sectionId: override.sectionId, lessonId: override.lessonId, plannedDate: override.plannedDate })
  }
  return result
}

function parseSameDayApprovals(value: unknown[]): SameDayLessonApproval[] | null {
  const result: SameDayLessonApproval[] = []
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null
    const approval = candidate as Partial<SameDayLessonApproval>
    if (typeof approval.sectionId !== 'string' || typeof approval.date !== 'string' || !Array.isArray(approval.lessonIds)) return null
    if (!approval.lessonIds.every((lessonId) => typeof lessonId === 'string')) return null
    try {
      assertISODate(approval.date)
    } catch {
      return null
    }
    result.push({ sectionId: approval.sectionId, date: approval.date, lessonIds: [...approval.lessonIds] })
  }
  return result
}

function parseUndoToken(value: unknown): ShiftUndoToken | null {
  if (!value || typeof value !== 'object') return null
  const token = value as Partial<ShiftUndoToken>
  if (typeof token.operationId !== 'string' || typeof token.sectionId !== 'string') return null
  if (!Array.isArray(token.previousSectionOverrides) || !Array.isArray(token.appliedSectionOverrides)) return null
  const previousSectionOverrides = parseOverrides(token.previousSectionOverrides)
  const appliedSectionOverrides = parseOverrides(token.appliedSectionOverrides)
  if (!previousSectionOverrides || !appliedSectionOverrides) return null
  return { operationId: token.operationId, sectionId: token.sectionId, previousSectionOverrides, appliedSectionOverrides }
}

function allOverridesBelongToSection(overrides: SectionLessonDateOverride[], sectionId: string): boolean {
  return overrides.every((override) => override.sectionId === sectionId)
}

function hasDuplicateOverrideKeys(overrides: SectionLessonDateOverride[]): boolean {
  const keys = new Set<string>()
  for (const override of overrides) {
    const key = `${override.sectionId}:${override.lessonId}`
    if (keys.has(key)) return true
    keys.add(key)
  }
  return false
}

function normalizeOverrides(overrides: SectionLessonDateOverride[]): SectionLessonDateOverride[] {
  return overrides
    .map((override) => ({ ...override }))
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.lessonId.localeCompare(b.lessonId) || a.plannedDate.localeCompare(b.plannedDate))
}
