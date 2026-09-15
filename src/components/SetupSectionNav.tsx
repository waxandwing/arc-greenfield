import type { OnboardingSection, SetupSection, SetupSectionId, OnboardingSectionId } from '../app/setupSections'

type SetupProps = {
  kind: 'setup'
  sections: SetupSection[]
  activeId: SetupSectionId
  disabledIds?: ReadonlySet<SetupSectionId>
  onSelect: (id: SetupSectionId) => void
}

type OnboardingProps = {
  kind: 'onboarding'
  sections: OnboardingSection[]
  activeId: OnboardingSectionId
  disabledIds?: ReadonlySet<OnboardingSectionId>
  onSelect: (id: OnboardingSectionId) => void
}

type Props = SetupProps | OnboardingProps

export function SetupSectionNav(props: Props) {
  const label = props.kind === 'onboarding' ? 'Onboarding steps' : 'Setup sections'

  return (
    <nav className="setup-section-nav" aria-label={label} data-testid="setup-section-nav">
      {props.sections.map((section) => {
        const disabled = props.disabledIds?.has(section.id as never) ?? false
        const current = section.id === props.activeId
        return (
          <button
            key={section.id}
            type="button"
            className={`setup-section-nav-item${current ? ' setup-section-nav-item--current' : ''}`}
            aria-current={current ? 'page' : undefined}
            disabled={disabled}
            title={disabled ? 'Finish earlier setup steps first.' : section.label}
            onClick={() => {
              if (disabled || current) return
              if (props.kind === 'setup') props.onSelect(section.id as SetupSectionId)
              else props.onSelect(section.id as OnboardingSectionId)
            }}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
