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

const SETUP_STEPS = [
  { id: 'calendar', label: 'School year' },
  { id: 'classes', label: 'Courses' },
  { id: 'day', label: 'Teaching day' },
  { id: 'done', label: 'Done' },
] as const

export function ArcOnboarding(props: Props) {
  const stage = resolveOnboardingStage(props.draft, props.capabilities)
  function dismissSetup() {
    props.onChangeDraft({ ...props.draft, dismissed: true })
    props.onCancelSetup?.()
  }
  function beginGuided() {
    props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'guided' })
  }
  function beginImport() {
    props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'import' })
  }
  function beginSimple() {
    props.onChangeDraft({ ...props.draft, stage: 'calendar', intent: 'simple' })
  }

  if (stage === 'welcome') {
    return (
      <div className="onboarding-welcome-wrap">
        <section className="onboarding-welcome" aria-labelledby="onboarding-title">
          <p className="section-label">Welcome to Arc</p>
          <h2 id="onboarding-title" className="onboarding-editorial-title">
            Arc is where your plan lives when the plan changes.
          </h2>
          <p>Anchor your school year first so dates stay honest. Add courses and a teaching day when you are ready.</p>
          <div className="onboarding-actions" role="group" aria-label="How to start">
            <button type="button" className="primary-button" onClick={beginGuided}>
              Set up my school year
            </button>
            <button type="button" className="quiet-button" onClick={beginImport}>
              Import what I already have
            </button>
            <button type="button" className="text-button" onClick={beginSimple}>
              Just set my school year
            </button>
          </div>
          <ul className="onboarding-path-outcomes">
            <li>
              <strong>Set up my school year</strong> — guided path through school year, courses, then teaching day.
            </li>
            <li>
              <strong>Import what I already have</strong> — confirm school year first, then bring in curriculum.
            </li>
            <li>
              <strong>Just set my school year</strong> — minimal start; courses and teaching day can wait.
            </li>
          </ul>
          <p className="onboarding-footnote">
            Choosing Import? First confirm your school year so imported dates land correctly. You do not need everything on day one.
          </p>
        </section>
      </div>
    )
  }

  if (stage === 'calendar') {
    const isImport = props.draft.intent === 'import'
    const isSimple = props.draft.intent === 'simple'
    return (
      <div className="onboarding-stage">
        <OnboardingBack label="Back to welcome" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'welcome' })} />
        <OnboardingStepRail current="calendar" />
        {isImport ? (
          <p className="onboarding-stage-callout" role="status">
            First confirm your school year so dates land correctly. Then Arc will open import.
          </p>
        ) : null}
        {isSimple ? (
          <p className="onboarding-stage-callout" role="status">
            Just set your school year for now — courses and teaching day can wait.
          </p>
        ) : null}
        <CalendarSetup
          initialValue={props.draft.calendarDraft ?? props.calendarInput}
          onDraftChange={(calendarDraft) => props.onChangeDraft({ ...props.draft, calendarDraft })}
          onSchoolIdentitySelected={(candidate) => props.onChangeDraft({ ...props.draft, schoolNcesId: candidate.id })}
          loadedSchoolNcesId={props.draft.schoolNcesId}
          onSave={(calendar, input) => {
            if (!props.onUseCalendar(calendar, input)) return
            if (isImport) {
              props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined })
              props.onOpenImport()
              return
            }
            if (isSimple) {
              props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, calendarDraft: undefined })
              return
            }
            props.onChangeDraft({ ...props.draft, stage: 'classes', calendarDraft: undefined })
          }}
          onCancel={props.calendar ? dismissSetup : undefined}
        />
      </div>
    )
  }

  if (stage === 'classes' && props.calendar) {
    return (
      <div className="onboarding-stage">
        <OnboardingBack label="Back to School year" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'calendar' })} />
        <OnboardingStepRail current="classes" />
        <ClassSetup
          calendarId={props.calendar.id}
          initialValue={props.draft.planningDraft ?? props.planningInput}
          onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })}
          onSave={(input, workspace) => {
            if (props.onUseClasses(input, workspace)) props.onChangeDraft({ ...props.draft, stage: 'day', planningDraft: input })
          }}
          onCancel={dismissSetup}
        />
      </div>
    )
  }

  if (stage === 'day' && props.planningInput) {
    return (
      <div className="onboarding-stage">
        <OnboardingBack label="Back to Courses" onClick={() => props.onChangeDraft({ ...props.draft, stage: 'classes' })} />
        <OnboardingStepRail current="day" />
        <TeachingDaySetup
          initialValue={props.draft.planningDraft ?? props.planningInput}
          schoolNcesId={props.draft.schoolNcesId}
          calendarProvenance={props.calendarInput?.provenance}
          onDraftChange={(planningDraft) => props.onChangeDraft({ ...props.draft, planningDraft })}
          onSave={(input, workspace) => {
            if (props.onUseClasses(input, workspace)) {
              props.onLandInDay()
              props.onChangeDraft({ ...props.draft, stage: 'landed', dismissed: true, planningDraft: undefined })
            }
          }}
          onCancel={dismissSetup}
        />
      </div>
    )
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

function OnboardingBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="onboarding-back text-button" onClick={onClick}>
      ← {label}
    </button>
  )
}

function OnboardingStepRail({ current }: { current: 'calendar' | 'classes' | 'day' }) {
  const currentIndex = SETUP_STEPS.findIndex((step) => step.id === current)
  return (
    <ol className="onboarding-step-rail" aria-label="Setup progress">
      {SETUP_STEPS.map((step, index) => {
        const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
        return (
          <li key={step.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="onboarding-step-rail-mark" aria-hidden="true">
              {state === 'complete' ? '✓' : index + 1}
            </span>
            <span className="onboarding-step-rail-label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
