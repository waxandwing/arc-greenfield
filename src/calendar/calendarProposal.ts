import { validateHydrationInput, type CalendarHydrationInput } from './hydration'
import type { CalendarSource } from './types'

export type CalendarEvidence = {
  id: string
  source: Exclude<CalendarSource, 'manual'>
  label: string
  locator?: string
  capturedAt?: string
}

export type CalendarProposal = {
  id: string
  input: CalendarHydrationInput
  evidence: CalendarEvidence[]
  warnings: string[]
  reviewedAt: string | null
}

export type CalendarProposalDraft = {
  proposalId: string
  input: CalendarHydrationInput
  evidence: CalendarEvidence[]
}

export function buildCalendarProposal(draft: CalendarProposalDraft): CalendarProposal {
  const evidence = draft.evidence.map((item) => ({ ...item }))
  const errors = validateProposalEvidence(draft.input, evidence)
  if (errors.length > 0) throw new Error(`Cannot build calendar proposal. ${errors.join(' ')}`)

  const input: CalendarHydrationInput = {
    ...draft.input,
    exceptions: draft.input.exceptions?.map((day) => ({ ...day })),
    quarters: draft.input.quarters?.map((boundary) => ({ ...boundary })),
    semesters: draft.input.semesters?.map((boundary) => ({ ...boundary })),
    provenance: evidence.map((item) => ({ ...item })),
  }

  return {
    id: draft.proposalId,
    input,
    evidence,
    warnings: proposalWarnings(input),
    reviewedAt: null,
  }
}

export function reviewCalendarProposal(proposal: CalendarProposal, reviewedAt: string): CalendarProposal {
  if (!reviewedAt.trim()) throw new Error('Calendar proposal review requires a review timestamp.')
  return {
    ...proposal,
    input: cloneInput(proposal.input),
    evidence: proposal.evidence.map((item) => ({ ...item })),
    warnings: [...proposal.warnings],
    reviewedAt,
  }
}

export function commitCalendarProposal(proposal: CalendarProposal): CalendarHydrationInput {
  if (!proposal.reviewedAt) throw new Error('Review this calendar proposal before committing it.')

  const errors = [
    ...validateHydrationInput(proposal.input),
    ...validateProposalEvidence(proposal.input, proposal.evidence),
  ]
  if (errors.length > 0) throw new Error(`Cannot commit calendar proposal. ${errors.join(' ')}`)

  return cloneInput({
    ...proposal.input,
    provenance: proposal.evidence.map((item) => ({ ...item })),
  })
}

export function validateProposalEvidence(input: CalendarHydrationInput, evidence: CalendarEvidence[]): string[] {
  const errors: string[] = []
  if (input.patternSource === 'manual') {
    errors.push('Source-backed calendar proposals cannot use the manual pattern source.')
    return errors
  }
  if (evidence.length === 0) errors.push('Source-backed calendar proposals require provenance evidence.')

  const ids = new Set<string>()
  for (const item of evidence) {
    if (!item.id.trim()) errors.push('Calendar provenance evidence is missing an id.')
    if (ids.has(item.id)) errors.push(`Calendar provenance evidence id ${item.id} is duplicated.`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`Calendar provenance evidence ${item.id || 'item'} is missing a label.`)
    if (item.source !== input.patternSource) {
      errors.push(`Calendar provenance evidence ${item.id || 'item'} does not match pattern source ${input.patternSource}.`)
    }
  }
  return errors
}

function proposalWarnings(input: CalendarHydrationInput): string[] {
  const warnings: string[] = []
  if (input.patternConfidence !== 'confirmed') {
    warnings.push(`Calendar pattern confidence is ${input.patternConfidence}; review inferred or mixed dates before commit.`)
  }
  const uncertain = (input.exceptions ?? []).filter((day) => day.confidence && day.confidence !== 'confirmed')
  if (uncertain.length > 0) {
    warnings.push(`${uncertain.length} calendar exception${uncertain.length === 1 ? '' : 's'} require confidence review.`)
  }
  return warnings
}

function cloneInput(input: CalendarHydrationInput): CalendarHydrationInput {
  return {
    ...input,
    instructionalWeekdays: [...input.instructionalWeekdays],
    exceptions: input.exceptions?.map((day) => ({ ...day })),
    quarters: input.quarters?.map((boundary) => ({ ...boundary })),
    semesters: input.semesters?.map((boundary) => ({ ...boundary })),
    provenance: input.provenance?.map((item) => ({ ...item })),
  }
}
