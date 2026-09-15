import {
  isSetupWorkspaceMode,
  SETUP_SECTIONS,
  ONBOARDING_SECTIONS,
  setupSectionLabel,
} from './setupSections.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(SETUP_SECTIONS.map((section) => section.id).join(',') === 'calendar-setup,terms,classes,teaching-day,units,lessons,import', 'Setup sections must cover Settings destinations in order.')
assert(ONBOARDING_SECTIONS.map((section) => section.id).join(',') === 'welcome,calendar,classes,day', 'Onboarding sections must cover guided setup stages.')
assert(isSetupWorkspaceMode('terms'), 'Terms is a setup workspace mode.')
assert(isSetupWorkspaceMode('calendar-setup'), 'Calendar setup is a setup workspace mode.')
assert(!isSetupWorkspaceMode('calendar'), 'Live calendar mode is not a setup section.')
assert(!isSetupWorkspaceMode('recovery'), 'Recovery is not a setup section.')
assert(setupSectionLabel('classes') === 'Courses', 'Courses label must stay teacher-facing.')
assert(setupSectionLabel('teaching-day') === 'Teaching day', 'Teaching day label must stay teacher-facing.')

console.log('setup sections contract passed')
