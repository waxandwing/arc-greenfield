import type { ReactNode } from 'react'
import { DeskPostIt } from './DeskPostIt'

type Props = {
  children: ReactNode
}

/**
 * Upper-right mustard paper sticky — live desk object (not tray raster).
 * Type-first writing surface; captures land in IDEAS / tray.
 * Grip strip for drag; note body stays editable (same contract as accent post-its).
 */
export function DeskQuickCaptureSticky({ children }: Props) {
  return (
    <DeskPostIt
      postItId="quick-capture"
      tone="mustard"
      defaultPosition={{ leftPct: 79.5, topPct: 4 }}
      tiltDeg={-2.2}
      className="arc-desk-capture-sticky"
      testId="arc-desk-quick-capture"
      aria-label="Quick capture sticky"
    >
      <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid="arc-desk-quick-capture-grip" />
      <p className="arc-desk-capture-sticky-title">Quick capture</p>
      <div className="arc-desk-capture-sticky-well">{children}</div>
    </DeskPostIt>
  )
}
