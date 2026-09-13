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
}

export function ArcOnboarding(props: Props) {
  const stage = resolveStage(props.draft, props.capabilities)
  if (stage === 'welcome') {
    return (
      <div className="onboarding-welcome-wrap"><section className="onboarding-welcome" aria-labelledby="onboarding-title">
        <p className="section-label">Welcome to Arc</p>
        <h1 id="onboarding-title">Arc is where your plan lives when the plan changes.</h1>
        <p>Start with the shape of your real teaching day. You can bring in curriculum, finish bell times, and add detail after the planner is useful.</p>
        <div className="onboarding-actions"><button type="button" className="primary-button" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'guided' })}>Set up my teaching day</button><button type="button" className="quiet-button" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'import' })}>Import what I already have</button><a className="text-button" href="#start-simple">Start simple</a></div>
        <p className="onboarding-footnote">Import uses the same review-and-confirm boundary everywhere in Arc. School year comes first so imported work has a safe home.</p>
      </section><section id="start-simple" className="onboarding-simple" aria-label="Start simple"><CalendarSetup initialValue={props.draft.calendarDraft ?? props.calendarInput} onDraftChange={(calendarDraft) => props.onChangeDraft({ ...props.draft, calendarDraft })} onSave={(calendar, input) => { if (props.onUseCalendar(calendar, input)) props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined }) }} /></section></div>
    )
  }
  if (stage === 'calendar') {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'welcome' })} /><CalendarSetup initialValue={props.draft.calendarDraft ?? props.calendarInput} onDraftChange={(calendarDraft) => props.onChangeDraft({ ...props.draft, calendarDraft })} onSave={(calendar, input) => { if (!props.onUseCalendar(calendar, input)) return; if (props.draft.intent === 'import') { props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined }); props.onOpenImport() } else props.onChangeDraft({ ...props.draft, stage: 'classes', calendarDraft: undefined }) }} /></div>
  }
  if (stage === 'classes' && props.calendar) {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar' })} /><ClassSetup calendarId={props.calendar.id} initialValue={props.draft.planningDraft ?? props.planningInput} onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })} onSave={(input, workspace) => { if (props.onUseClasses(input, workspace)) props.onChangeDraft({ ...props.draft, stage: 'day', planningDraft: input }) }} onCancel={() => props.onChangeDraft({ ...props.draft, dismissed: true })} /></div>
  }
  if (stage === 'day' && props.planningInput) {
    return <div className="onboarding-stage"><OnboardingBack onClick={() => props.onChangeDraft({ ...props.draft, stage: 'classes' })} /><TeachingDaySetup initialValue={props.draft.planningDraft ?? props.planningInput} onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })} onSave={(input, workspace) => { if (props.onUseClasses(input, workspace)) { props.onLandInDay(); props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, planningDraft: undefined }) } }} onCancel={() => props.onChangeDraft({ ...props.draft, dismissed: true })} /></div>
  }
  return null
}

function resolveStage(draft: OnboardingDraft, capabilities: SetupCapabilities): OnboardingDraft['stage'] {
  if (draft.stage === 'welcome' && !capabilities.calendarEstablished) return 'welcome'
  if (!capabilities.calendarEstablished) return 'calendar'
  if (!capabilities.coursesEstablished || !capabilities.sectionsEstablished) return 'classes'
  if (!capabilities.dayOrderEstablished || !capabilities.planningPeriodEstablished) return 'day'
  return 'landed'
}

function OnboardingBack({ onClick }: { onClick: () => void }) { return <button type="button" className="onboarding-back text-button" onClick={onClick}>← Back</button> }
