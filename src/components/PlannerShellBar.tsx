import type { ReactNode } from 'react'
import { publicAssetUrl } from '../publicAssetUrl'

/** High-res stacked mark for planner chrome (not the 70×59 arc-mark.png). */
const ARC_MARK_ASSET = 'assets/arc/arc-mark-stacked.png'

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
        <img src={publicAssetUrl(ARC_MARK_ASSET)} alt="Arc" data-testid="arc-mark-logo" />
      </button>
      <div className="planner-shell-bar-controls">
        {capture}
        {trailing}
      </div>
    </div>
  )
}
