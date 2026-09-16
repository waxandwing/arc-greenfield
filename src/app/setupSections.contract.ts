import {
  isRetiredSetupWorkspaceMode,
  isSetupWorkspaceMode,
  SETUP_FALLBACK_SECTION,
  SETUP_SECTIONS,
  ONBOARDING_SECTIONS,
  resolveSetupSectionId,
  setupSectionLabel,
} from './setupSections'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(SETUP_SECTIONS.map((section) => section.id).join(',') === 'calendar-setup,terms,classes,teaching-day,import', 'Setup sections must cover setup-header destinations in order without Units or Lessons.')
assert(ONBOARDING_SECTIONS.map((section) => section.id).join(',') === 'welcome,calendar,classes,day', 'Onboarding sections must cover guided setup stages.')
assert(isSetupWorkspaceMode('terms'), 'Terms is a setup workspace mode.')
assert(isSetupWorkspaceMode('calendar-setup'), 'Calendar setup is a setup workspace mode.')
assert(!isSetupWorkspaceMode('calendar'), 'Live calendar mode is not a setup section.')
assert(!isSetupWorkspaceMode('recovery'), 'Recovery is not a setup section.')
assert(!isSetupWorkspaceMode('units'), 'Units belong in Settings Planning, not setup chrome.')
assert(!isSetupWorkspaceMode('lessons'), 'Lessons belong in Settings Planning, not setup chrome.')
assert(isRetiredSetupWorkspaceMode('units') && isRetiredSetupWorkspaceMode('lessons'), 'Units and Lessons remain reachable workspace modes outside setup.')
assert(resolveSetupSectionId('units') === SETUP_FALLBACK_SECTION, 'Retired Units setup must redirect to Courses.')
assert(resolveSetupSectionId('lessons') === SETUP_FALLBACK_SECTION, 'Retired Lessons setup must redirect to Courses.')
assert(setupSectionLabel('classes') === 'Courses', 'Courses label must stay teacher-facing.')
assert(setupSectionLabel('teaching-day') === 'Teaching day', 'Teaching day label must stay teacher-facing.')
assert(setupSectionLabel('units') === null, 'Units must not carry a setup-section label.')
assert(setupSectionLabel('lessons') === null, 'Lessons must not carry a setup-section label.')

console.log('setup sections contract passed')
