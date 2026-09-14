import type { SetupCapabilities } from '../planning'
import { minimumPlanningSetupEstablished } from '../planning'

/** Day-only nudge when teaching-day order or explicit planning block is still missing. Bell times and curriculum stay in Settings. */
export function ProgressiveSetupPrompt({ capabilities, onOpenTeachingDay }: { capabilities: SetupCapabilities; onOpenTeachingDay: () => void; onOpenImport?: () => void }) {
  if (minimumPlanningSetupEstablished(capabilities)) return null
  if (!capabilities.coursesEstablished) return null
  return (
    <aside className="progressive-setup" aria-label="Teaching day setup">
      <p className="section-label">When you’re ready</p>
      <div>
        <button type="button" onClick={onOpenTeachingDay}>
          <strong>Shape the teaching day</strong>
          <span>Add period order and mark Planning explicitly.</span>
        </button>
      </div>
    </aside>
  )
}
