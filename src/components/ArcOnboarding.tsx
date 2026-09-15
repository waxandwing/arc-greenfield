import { CalendarSetup } from './CalendarSetup'
import { ClassSetup } from './ClassSetup'
import { TeachingDaySetup } from './TeachingDaySetup'
import type { CalendarHydrationInput, SchoolCalendar } from '../calendar'
import type { OnboardingDraft, PlanningWorkspace, PlanningWorkspaceInput, SetupCapabilities } from '../planning'

type Props = {
  draft: OnboardingDraft
  capabilities: SetupCapabilities
  calendar: SchoolCalendar | null
  calendarInput: CalendarHydrationInput | null
  planningInput: PlanningWorkspaceInput | null
  onChangeDraft: (draft: OnboardingDraft) => void
  onUseCalendar: (calendar: SchoolCalendar, input: CalendarHydrationInput) => boolean
  onUseClasses: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => boolean
  onLandInDay: () => void
  onOpenImport: () => void
  onCancelSetup?: () => void
}

export function ArcOnboarding(props: Props) {
  const stage = resolveOnboardingStage(props.draft, props.capabilities)
  function dismissSetup() {
    props.onChangeDraft({ ...props.draft, dismissed: true })
    props.onCancelSetup?.()
  }
  if (stage === 'welcome') {
    return (
      <div className="onboarding-welcome-wrap"><section className="onboarding-welcome" aria-labelledby="onboarding-title">
        <p className="section-label">Welcome to Arc</p>
        <h2 id="onboarding-title" className="onboarding-editorial-title">Arc is where your plan lives when the plan changes.</h2>
        <p>
          Start by anchoring your school year and teaching week so Arc stays aligned with your real schedule when plans change. Add classes,
          bell times, and curriculum when you are ready—you do not need everything on day one.
        </p>
        <div className="onboarding-actions"><button type="button" className="primary-button" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'guided' })}>Set up my teaching day</button><button type="button" className="quiet-button" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'import' })}>Import what I already have</button><a className="text-button" href="#start-simple">Start simple</a></div>
        <p className="onboarding-footnote">
          Choosing Import? Arc shows what it found and waits for your OK before saving. Set your school year first so imported dates land on
          the right days.
        </p>
      </section><section id="start-simple" className="onboarding-simple" aria-label="Start simple"><CalendarSetup initialValue={props.draft.calendarDraft ?? props.calendarInput} onDraftChange={(calendarDraft) => props.onChangeDraft({ ...props.draft, calendarDraft })} onSchoolIdentitySelected={(candidate) => props.onChangeDraft({ ...props.draft, schoolNcesId: candidate.id })} onSave={(calendar, input) => { if (props.onUseCalendar(calendar, input)) props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined }) }} /></section></div>
    )
  }
  if (stage === 'calendar') {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'welcome' })} /><CalendarSetup initialValue={props.draft.calendarDraft ?? props.calendarInput} onDraftChange={(calendarDraft) => props.onChangeDraft({ ...props.draft, calendarDraft })} onSchoolIdentitySelected={(candidate) => props.onChangeDraft({ ...props.draft, schoolNcesId: candidate.id })} onSave={(calendar, input) => { if (!props.onUseCalendar(calendar, input)) return; if (props.draft.intent === 'import') { props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined }); props.onOpenImport() } else props.onChangeDraft({ ...props.draft, stage: 'classes', calendarDraft: undefined }) }} onCancel={props.calendar ? dismissSetup : undefined} /></div>
  }
  if (stage === 'classes' && props.calendar) {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar' })} /><ClassSetup calendarId={props.calendar.id} initialValue={props.draft.planningDraft ?? props.planningInput} onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })} onSave={(input, workspace) => { if (props.onUseClasses(input, workspace)) props.onChangeDraft({ ...props.draft, stage: 'day', planningDraft: input }) }} onCancel={dismissSetup} /></div>
  }
  if (stage === 'day' && props.planningInput) {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'classes' })} /><TeachingDaySetup initialValue={props.draft.planningDraft ?? props.planningInput} schoolNcesId={props.draft.schoolNcesId} calendarProvenance={props.calendarInput?.provenance} onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })} onSave={(input, workspace) => { if (props.onUseClasses(input, workspace)) { props.onLandInDay(); props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, planningDraft: undefined }) } }} onCancel={dismissSetup} /></div>
  }
  return null
}

export function resolveOnboardingStage(draft: OnboardingDraft, capabilities: SetupCapabilities): OnboardingDraft['stage'] {
  if (draft.stage === 'landed') return 'landed'
  if (draft.stage === 'welcome') return 'welcome'
  if (draft.stage === 'calendar') return 'calendar'
  if (draft.stage === 'classes') return capabilities.calendarEstablished ? 'classes' : 'calendar'
  if (draft.stage === 'day') {
    if (!capabilities.calendarEstablished) return 'calendar'
    if (!capabilities.coursesEstablished || !capabilities.sectionsEstablished) return 'classes'
    return 'day'
  }
  if (!capabilities.calendarEstablished) return 'calendar'
  if (!capabilities.coursesEstablished || !capabilities.sectionsEstablished) return 'classes'
  if (!capabilities.dayOrderEstablished || !capabilities.planningPeriodEstablished) return 'day'
  return 'landed'
}

function OnboardingBack({ onClick }: { onClick: () => void }) { return <button type="button" className="onboarding-back text-button" onClick={onClick}>← Back</button> }
