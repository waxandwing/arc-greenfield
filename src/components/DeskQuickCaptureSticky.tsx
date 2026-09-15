import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Upper-right yellow sticky — hosts existing GlobalCapture affordance (behavior unchanged). */
export function DeskQuickCaptureSticky({ children }: Props) {
  return (
    <div className="arc-desk-capture-sticky" data-testid="arc-desk-quick-capture">
      <p className="arc-desk-capture-sticky-title">Quick capture</p>
      <div className="arc-desk-capture-sticky-well">{children}</div>
    </div>
  )
}
