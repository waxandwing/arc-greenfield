import { DeskPostIt } from './DeskPostIt'

/**
 * Loose accent post-its on the wood — replacements for former tray-chrome baked stickies.
 * Siblings of the IDEAS tray under arc-desk-surface so landscape tray chrome can change independently.
 */
export function DeskAccentPostIts() {
  return (
    <>
      <DeskPostIt
        postItId="accent-mustard"
        tone="mustard"
        defaultPosition={{ leftPct: 34.5, topPct: 1.2 }}
        tiltDeg={-6}
        testId="arc-desk-post-it-accent-mustard"
        aria-label="Mustard post-it"
      />
      <DeskPostIt
        postItId="accent-pink"
        tone="pink"
        defaultPosition={{ leftPct: 39.2, topPct: 0.6 }}
        tiltDeg={4}
        testId="arc-desk-post-it-accent-pink"
        aria-label="Pink post-it"
      />
      <DeskPostIt
        postItId="accent-blue"
        tone="blue"
        defaultPosition={{ leftPct: 48.5, topPct: 1.4 }}
        tiltDeg={-3}
        testId="arc-desk-post-it-accent-blue"
        aria-label="Blue post-it"
      />
    </>
  )
}
