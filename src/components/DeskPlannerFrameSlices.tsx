import { deskSliceUsesEnabled } from '../desk/deskSliceRuntime'
import { DeskChromeSlice } from './DeskChromeSlice'

/** Figma-derived planner spread accents (live grid stays in `.b01-calendar-owner`). */
export function DeskPlannerFrameSlices() {
  if (!deskSliceUsesEnabled()) return null
  return (
    <div className="arc-desk-planner-frame-slices" aria-hidden="true" data-testid="desk-planner-frame-slices">
      <DeskChromeSlice sliceId="planner-frame-top-accent" />
      <DeskChromeSlice sliceId="planner-frame-left-accent" />
    </div>
  )
}
