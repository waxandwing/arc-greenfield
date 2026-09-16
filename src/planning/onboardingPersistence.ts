export const ONBOARDING_STORAGE_KEY = 'arc.onboarding.v1'

export type OnboardingStage = 'welcome' | 'calendar' | 'classes' | 'day' | 'landed'

export type OnboardingDraft = {
  stage: OnboardingStage
  dismissed: boolean
  firstCapturePromptDismissed: boolean
  /** Selected NCES school token (`nces:…`) for bell-schedule lookup during Build your day. */
  schoolNcesId?: string
  calendarDraft?: CalendarHydrationInput
  planningDraft?: PlanningWorkspaceInput
  intent?: 'guided' | 'import' | 'simple'
}

const DEFAULT_DRAFT: OnboardingDraft = {
  stage: 'welcome',
  dismissed: false,
  firstCapturePromptDismissed: false,
}

export function serializeOnboardingDraft(draft: OnboardingDraft): string {
  return JSON.stringify({ schemaVersion: 1, draft })
}

export function deserializeOnboardingDraft(raw: string): OnboardingDraft | null {
  try {
    const parsed = JSON.parse(raw) as { schemaVersion?: unknown; draft?: Partial<OnboardingDraft> }
    if (parsed.schemaVersion !== 1 || !parsed.draft) return null
    const stage = parsed.draft.stage
    if (!stage || !['welcome', 'calendar', 'classes', 'day', 'landed'].includes(stage)) return null
    return {
      stage,
      dismissed: parsed.draft.dismissed === true,
      firstCapturePromptDismissed: parsed.draft.firstCapturePromptDismissed === true,
      schoolNcesId: typeof parsed.draft.schoolNcesId === 'string' && parsed.draft.schoolNcesId.trim()
        ? parsed.draft.schoolNcesId.trim()
        : undefined,
      calendarDraft: isCalendarDraft(parsed.draft.calendarDraft) ? parsed.draft.calendarDraft : undefined,
      planningDraft: isPlanningDraft(parsed.draft.planningDraft) ? parsed.draft.planningDraft : undefined,
      intent:
        parsed.draft.intent === 'import'
          ? 'import'
          : parsed.draft.intent === 'guided'
            ? 'guided'
            : parsed.draft.intent === 'simple'
              ? 'simple'
              : undefined,
    }
  } catch {
    return null
  }
}

function isCalendarDraft(value: unknown): value is CalendarHydrationInput {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CalendarHydrationInput>
  return typeof candidate.id === 'string' && typeof candidate.schoolYearLabel === 'string' && typeof candidate.firstDay === 'string' && typeof candidate.lastDay === 'string' && Array.isArray(candidate.instructionalWeekdays) && Array.isArray(candidate.exceptions)
}

function isPlanningDraft(value: unknown): value is PlanningWorkspaceInput {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PlanningWorkspaceInput>
  return typeof candidate.calendarId === 'string' && Array.isArray(candidate.courses) && Array.isArray(candidate.sections)
}

export function loadOnboardingDraft(): OnboardingDraft {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
    return raw ? deserializeOnboardingDraft(raw) ?? DEFAULT_DRAFT : DEFAULT_DRAFT
  } catch {
    return DEFAULT_DRAFT
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft): boolean {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, serializeOnboardingDraft(draft))
    return true
  } catch {
    return false
  }
}
import type { CalendarHydrationInput } from '../calendar'
import type { PlanningWorkspaceInput } from './workspace'
