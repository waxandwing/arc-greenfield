import type { TeachingDayBlockType } from '../planning/teachingDay'

export type BellScheduleBlockProposal = {
  label: string
  type: TeachingDayBlockType
  startTime: string | null
  endTime: string | null
  /** Zero-based index into the teacher's section list when type is teaching. */
  sectionIndex?: number
}

export type BellScheduleLookupResult =
  | {
      status: 'found'
      sourceLabel: string
      sourceLocator: string
      blocks: BellScheduleBlockProposal[]
    }
  | {
      status: 'unavailable'
      message: string
    }

export type BellScheduleLookupQuery = {
  ncesSchoolId: string
  sectionCount: number
}

type LookupOptions = {
  fetchImpl?: typeof fetch
}

/** Extract NCES school id from provenance or onboarding (`nces:120144001406` → `120144001406`). */
export function ncesSchoolIdFromToken(token: string | null | undefined): string | null {
  if (!token?.trim()) return null
  const trimmed = token.trim()
  if (trimmed.startsWith('nces:')) return trimmed.slice('nces:'.length) || null
  if (/^\d{12}$/.test(trimmed)) return trimmed
  return null
}

export function resolveBellScheduleSchoolId(input: {
  onboardingSchoolNcesId?: string | null
  calendarProvenance?: Array<{ id?: string; locator?: string }> | null
}): string | null {
  const fromDraft = ncesSchoolIdFromToken(input.onboardingSchoolNcesId)
  if (fromDraft) return fromDraft
  for (const item of input.calendarProvenance ?? []) {
    const fromId = ncesSchoolIdFromToken(item.id)
    if (fromId) return fromId
    const locator = item.locator ?? ''
    const match = locator.match(/ID=(\d{12})/i)
    if (match) return match[1]
  }
  return null
}

const CURATED_BELL_SCHEDULES: Record<string, BellScheduleBlockProposal[]> = {
  '120144001406': [
    { label: 'Period 1', type: 'teaching', startTime: '07:20', endTime: '08:10', sectionIndex: 0 },
    { label: 'Period 2', type: 'teaching', startTime: '08:14', endTime: '09:04', sectionIndex: 1 },
    { label: 'Period 3', type: 'teaching', startTime: '09:08', endTime: '09:58', sectionIndex: 2 },
    { label: 'Lunch', type: 'non-teaching', startTime: '09:58', endTime: '10:28' },
    { label: 'Period 4', type: 'teaching', startTime: '10:32', endTime: '11:22', sectionIndex: 3 },
    { label: 'Planning', type: 'planning', startTime: '11:26', endTime: '12:16' },
    { label: 'Period 6', type: 'teaching', startTime: '12:20', endTime: '13:10', sectionIndex: 4 },
    { label: 'Period 7', type: 'teaching', startTime: '13:14', endTime: '14:04', sectionIndex: 5 },
  ],
}

/**
 * Arc proposes bell schedules from curated district feeds keyed by NCES school id.
 * Teachers confirm before blocks become canonical teaching-day order.
 */
export function lookupSchoolBellSchedule(
  query: BellScheduleLookupQuery,
  _options: LookupOptions = {},
): BellScheduleLookupResult {
  const schoolId = ncesSchoolIdFromToken(query.ncesSchoolId)
  if (!schoolId) {
    return { status: 'unavailable', message: 'Couldn\'t find reliable schedule. Build your day manually.' }
  }
  const template = CURATED_BELL_SCHEDULES[schoolId]
  if (!template) {
    return { status: 'unavailable', message: 'Couldn\'t find reliable schedule. Build your day manually.' }
  }
  const teachingSlots = template.filter((block) => block.type === 'teaching').length
  if (query.sectionCount > 0 && teachingSlots < query.sectionCount) {
    return {
      status: 'unavailable',
      message: 'Couldn\'t find reliable schedule. Build your day manually.',
    }
  }
  const blocks = template.map((block) => ({ ...block }))
  return {
    status: 'found',
    sourceLabel: 'Curated OCPS bell schedule (teacher confirmation required)',
    sourceLocator: `https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=${encodeURIComponent(schoolId)}`,
    blocks,
  }
}
