import type { ReactNode } from 'react'

type Props = {
  onHome: () => void
  homeLabel: string
  capture: ReactNode
  trailing?: ReactNode
}

export function PlannerShellBar({ onHome, homeLabel, capture, trailing }: Props) {
  return (
    <div className="planner-shell-bar" data-testid="planner-shell-bar">
      <button type="button" className="arc-wordmark arc-wordmark--in-planner" aria-label={homeLabel} onClick={onHome}>
        <img src="/assets/arc/arc-mark.png" alt="Arc" data-testid="arc-mark-logo" />
      </button>
      <div className="planner-shell-bar-controls">
        {capture}
        {trailing}
      </div>
    </div>
  )
}
