import { lookupSchoolBellSchedule, ncesSchoolIdFromToken, type BellScheduleBlockProposal } from './schoolBellScheduleLookup'
import type { ISODate } from './types'

export type SchoolYearDateSuggestion = {
  schoolYearLabel: string
  firstDay: ISODate
  lastDay: ISODate
  sourceLabel: string
}

export type ClassTimeDraft = {
  id: string
  label: string
  startTime: string
  endTime: string
  kind: 'teaching' | 'planning' | 'non-teaching'
}

/** OCPS 2026–27 instructional year (matches curated calendar parser / Oak Ridge demo). */
const OCPS_2026_27: SchoolYearDateSuggestion = {
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-11',
  lastDay: '2027-05-26',
  sourceLabel: 'OCPS 2026–27 instructional calendar (suggested — confirm or edit)',
}

/** NCES school ids with known district year bounds for setup prefill. */
const SCHOOL_YEAR_BY_NCES: Record<string, SchoolYearDateSuggestion> = {
  '120144001406': OCPS_2026_27, // Oak Ridge High
  '120144001234': OCPS_2026_27, // Colonial High
  '120150003045': OCPS_2026_27, // Winter Park High
}

/** Sensible high-school demo periods when no curated bell schedule exists. */
export const DEFAULT_CLASS_TIME_DRAFTS: ClassTimeDraft[] = [
  { id: 'default-p1', label: 'Period 1', startTime: '08:00', endTime: '08:50', kind: 'teaching' },
  { id: 'default-p2', label: 'Period 2', startTime: '08:55', endTime: '09:45', kind: 'teaching' },
  { id: 'default-p3', label: 'Period 3', startTime: '09:50', endTime: '10:40', kind: 'teaching' },
  { id: 'default-lunch', label: 'Lunch', startTime: '10:40', endTime: '11:10', kind: 'non-teaching' },
  { id: 'default-p4', label: 'Period 4', startTime: '11:15', endTime: '12:05', kind: 'teaching' },
  { id: 'default-plan', label: 'Planning', startTime: '12:10', endTime: '13:00', kind: 'planning' },
  { id: 'default-p5', label: 'Period 5', startTime: '13:05', endTime: '13:55', kind: 'teaching' },
  { id: 'default-p6', label: 'Period 6', startTime: '14:00', endTime: '14:50', kind: 'teaching' },
]

export function suggestSchoolYearDates(schoolToken: string | null | undefined): SchoolYearDateSuggestion | null {
  const schoolId = ncesSchoolIdFromToken(schoolToken)
  if (!schoolId) return null
  return SCHOOL_YEAR_BY_NCES[schoolId] ?? null
}

export function classTimeDraftsForSchool(schoolToken: string | null | undefined): {
  drafts: ClassTimeDraft[]
  sourceLabel: string
  fromSchoolData: boolean
} {
  const schoolId = ncesSchoolIdFromToken(schoolToken)
  if (schoolId) {
    const result = lookupSchoolBellSchedule({ ncesSchoolId: schoolId, sectionCount: 0 })
    if (result.status === 'found') {
      return {
        drafts: result.blocks.map((block, index) => draftFromBellBlock(block, index)),
        sourceLabel: result.sourceLabel,
        fromSchoolData: true,
      }
    }
  }
  return {
    drafts: DEFAULT_CLASS_TIME_DRAFTS.map((row) => ({ ...row })),
    sourceLabel: 'Demo class times (editable — confirm against your bell schedule)',
    fromSchoolData: false,
  }
}

function draftFromBellBlock(block: BellScheduleBlockProposal, index: number): ClassTimeDraft {
  return {
    id: `bell-${index}-${block.label.toLowerCase().replace(/\s+/g, '-')}`,
    label: block.label,
    startTime: block.startTime ?? '',
    endTime: block.endTime ?? '',
    kind: block.type,
  }
}
