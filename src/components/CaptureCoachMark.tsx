import { useEffect, useRef } from 'react'

type Props = {
  onDismiss: () => void
}

export function CaptureCoachMark({ onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      className="capture-coach-mark"
      role="status"
      tabIndex={-1}
      aria-labelledby="capture-coach-title"
      data-testid="capture-coach-mark"
    >
      <p className="section-label">Capture</p>
      <strong id="capture-coach-title">Jot a thought without leaving your view.</strong>
      <p>Use <span className="capture-coach-target">+ Capture</span> anytime. Workspace stays optional.</p>
      <button type="button" className="quiet-button" onClick={onDismiss}>Got it</button>
    </div>
  )
}
