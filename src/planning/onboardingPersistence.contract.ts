import { deserializeOnboardingDraft, serializeOnboardingDraft } from './onboardingPersistence'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const draft = { stage: 'day' as const, dismissed: false, firstCapturePromptDismissed: true }
assert(deserializeOnboardingDraft(serializeOnboardingDraft(draft))?.stage === 'day', 'Partial onboarding must survive refresh at its unresolved stage.')
assert(deserializeOnboardingDraft('{"schemaVersion":2,"draft":{"stage":"day"}}') === null, 'Unknown onboarding persistence must fail closed.')
assert(deserializeOnboardingDraft('{"schemaVersion":1,"draft":{"stage":"confetti"}}') === null, 'Unsupported onboarding steps must not trap the planner.')
const partial = { ...draft, stage: 'classes' as const, planningDraft: { calendarId: 'calendar', courses: [{ id: 'course', title: 'Unconfirmed Art' }], sections: [] } }
assert(deserializeOnboardingDraft(serializeOnboardingDraft(partial))?.planningDraft?.courses[0].title === 'Unconfirmed Art', 'Unconfirmed setup typing must survive Back and refresh without becoming canonical.')
console.log('onboarding persistence contract passed')
