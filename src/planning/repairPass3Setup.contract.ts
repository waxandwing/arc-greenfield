import { minimumPlanningSetupEstablished, assessSetupCapabilities, type SetupCapabilities } from './setupCapabilities'
import { deserializeOnboardingDraft, serializeOnboardingDraft, type OnboardingDraft } from './onboardingPersistence'
import { hydrateSchoolCalendar } from '../calendar/hydration'
import { hydratePlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'setup-calendar',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})

const planning = hydratePlanningWorkspace({
  calendarId: calendar.id,
  courses: [{ id: 'course-a', title: 'Art' }],
  sections: [{ id: 'section-a', calendarId: calendar.id, courseId: 'course-a', name: 'Period 1' }],
  teachingDay: {
    blocks: [
      { id: 'b1', label: 'Period 1', type: 'teaching', order: 1, sectionId: 'section-a', startTime: null, endTime: null },
      { id: 'b2', label: 'Planning', type: 'planning', order: 2, sectionId: null, startTime: null, endTime: null },
    ],
  },
})

const capabilities = assessSetupCapabilities({ calendar, planning, lessons: { calendarId: calendar.id, lessons: [], deliveryStates: [] } })
assert(minimumPlanningSetupEstablished(capabilities), 'Returning teacher with day order + planning must bypass onboarding.')

const returningDraft = deserializeOnboardingDraft(serializeOnboardingDraft({
  stage: 'welcome',
  dismissed: false,
  firstCapturePromptDismissed: true,
}))
assert(returningDraft, 'Returning draft must deserialize.')
assert(
  resolveOnboardingStageForTest(returningDraft, capabilities) === 'landed',
  'Valid persisted setup must not trap returning teachers in welcome.',
)

function resolveOnboardingStageForTest(draft: OnboardingDraft, capabilities: SetupCapabilities): OnboardingDraft['stage'] {
  if (draft.stage === 'landed') return 'landed'
  if (draft.stage === 'day') return 'day'
  if (draft.stage === 'classes') return capabilities.calendarEstablished ? 'classes' : 'calendar'
  if (draft.stage === 'calendar') return 'calendar'
  if (draft.stage === 'welcome' && !capabilities.calendarEstablished) return 'welcome'
  if (!capabilities.calendarEstablished) return 'calendar'
  if (!capabilities.coursesEstablished || !capabilities.sectionsEstablished) return 'classes'
  if (!capabilities.dayOrderEstablished || !capabilities.planningPeriodEstablished) return 'day'
  return 'landed'
}

const freshDraft = deserializeOnboardingDraft(serializeOnboardingDraft({
  stage: 'welcome',
  dismissed: false,
  firstCapturePromptDismissed: false,
  schoolNcesId: 'nces:120144001406',
}))
assert(freshDraft?.schoolNcesId === 'nces:120144001406', 'School lookup selection must survive onboarding persistence.')

console.log('repair pass 3 setup contract passed')
