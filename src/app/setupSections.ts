import type { WorkspaceMode } from './useWorkspaceMode'

/**
 * Setup destinations reachable from the calendar-stage setup header.
 * Unit/Lesson libraries stay in Settings → Planning, not this chrome.
 */
export type SetupSectionId =
  | 'calendar-setup'
  | 'terms'
  | 'classes'
  | 'teaching-day'
  | 'import'

/** Legacy setup destinations removed from setup chrome; still valid workspace modes via Settings. */
export type RetiredSetupSectionId = 'units' | 'lessons'

export type SetupSection = {
  id: SetupSectionId
  label: string
  shortLabel: string
}

export const SETUP_SECTIONS: SetupSection[] = [
  { id: 'calendar-setup', label: 'Calendar', shortLabel: 'Calendar' },
  { id: 'terms', label: 'Terms', shortLabel: 'Terms' },
  { id: 'classes', label: 'Courses', shortLabel: 'Courses' },
  { id: 'teaching-day', label: 'Teaching day', shortLabel: 'Teaching day' },
  { id: 'import', label: 'Import', shortLabel: 'Import' },
]

/** Where to send teachers who land on a retired Units/Lessons setup destination. */
export const SETUP_FALLBACK_SECTION: SetupSectionId = 'classes'

export type OnboardingSectionId = 'welcome' | 'calendar' | 'classes' | 'day'

export type OnboardingSection = {
  id: OnboardingSectionId
  label: string
}

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'calendar', label: 'School year' },
  { id: 'classes', label: 'Courses' },
  { id: 'day', label: 'Teaching day' },
]

export function isSetupWorkspaceMode(mode: WorkspaceMode): mode is SetupSectionId {
  return SETUP_SECTIONS.some((section) => section.id === mode)
}

export function isRetiredSetupWorkspaceMode(mode: WorkspaceMode): mode is RetiredSetupSectionId {
  return mode === 'units' || mode === 'lessons'
}

export function setupSectionLabel(mode: WorkspaceMode): string | null {
  return SETUP_SECTIONS.find((section) => section.id === mode)?.label ?? null
}

/** Map a workspace mode onto a setup-header destination, redirecting retired Units/Lessons. */
export function resolveSetupSectionId(mode: WorkspaceMode): SetupSectionId | null {
  if (isRetiredSetupWorkspaceMode(mode)) return SETUP_FALLBACK_SECTION
  if (isSetupWorkspaceMode(mode)) return mode
  return null
}
