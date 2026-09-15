import type { WorkspaceMode } from './useWorkspaceMode'

/** Setup destinations reachable from Settings / calendar setup flows. */
export type SetupSectionId =
  | 'calendar-setup'
  | 'terms'
  | 'classes'
  | 'teaching-day'
  | 'units'
  | 'lessons'
  | 'import'

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
  { id: 'units', label: 'Units', shortLabel: 'Units' },
  { id: 'lessons', label: 'Lessons', shortLabel: 'Lessons' },
  { id: 'import', label: 'Import', shortLabel: 'Import' },
]

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

export function setupSectionLabel(mode: WorkspaceMode): string | null {
  return SETUP_SECTIONS.find((section) => section.id === mode)?.label ?? null
}
