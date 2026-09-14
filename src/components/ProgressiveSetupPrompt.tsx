import type { SetupCapabilities } from '../planning'

/** Everyday planner surfaces: day-order / planning-period / bell-time only. Curriculum stays in Settings/import. */
export function ProgressiveSetupPrompt({ capabilities, onOpenTeachingDay }: { capabilities: SetupCapabilities; onOpenTeachingDay: () => void; onOpenImport?: () => void }) {
  if (!capabilities.coursesEstablished) return null
  const needsDay = !capabilities.dayOrderEstablished || !capabilities.planningPeriodEstablished
  const needsTimes = capabilities.dayOrderEstablished && !capabilities.bellTimesEstablished
  if (!needsDay && !needsTimes) return null
  return (
    <aside className="progressive-setup" aria-label="Optional setup">
      <p className="section-label">When you’re ready</p>
      <div>
        {needsDay ? (
          <button type="button" onClick={onOpenTeachingDay}>
            <strong>Shape the teaching day</strong>
            <span>Add the real order and mark Planning explicitly.</span>
          </button>
        ) : (
          <button type="button" onClick={onOpenTeachingDay}>
            <strong>Finish bell times</strong>
            <span>The day already works without them.</span>
          </button>
        )}
      </div>
    </aside>
  )
}
