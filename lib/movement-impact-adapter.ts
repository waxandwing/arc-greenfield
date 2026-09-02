import type { Workspace } from "./domain";
import { nextCourseMeetingDate, type ShiftPreflight } from "./efficiency-operations";
import { emptyMovementImpactSet, type MovementImpactSet } from "./continuity-domain";

/**
 * Transitional adapter from the current Shift preflight into the canonical
 * movement impact vocabulary. It does not execute the move.
 * Trace: A2K-MOV-002, A2K-EVT-001, A2K-UI-007.
 */
export function shiftPreflightToImpactSet(workspace: Workspace, preflight: ShiftPreflight): MovementImpactSet {
  const impact = emptyMovementImpactSet();
  const affected = new Set(preflight.affectedPlanIds);

  for (const plan of workspace.plans) {
    if (!affected.has(plan.id)) continue;
    const toDate = plan.date
      ? nextCourseMeetingDate(workspace, plan.courseId, plan.date, preflight.direction)
      : null;
    impact.shifted.push({
      id: plan.id,
      fromDate: plan.date,
      toDate,
      label: plan.title
    });
  }

  for (const conflict of preflight.conflicts) {
    const plan = workspace.plans.find((item) => item.id === conflict.planId);
    if (conflict.kind === "fixed-date") {
      impact.protected.push({
        id: conflict.planId,
        fromDate: plan?.date ?? conflict.targetDate,
        toDate: plan?.date ?? conflict.targetDate,
        label: plan?.title
      });
      continue;
    }

    const collision = workspace.plans.find((item) => item.id === conflict.conflictingPlanId);
    impact.errors.push(
      `${plan?.title ?? "Plan"} cannot shift to ${conflict.targetDate ?? "the target meeting"}` +
      `${collision ? ` because ${collision.title} is already there` : " because the target is occupied"}.`
    );
  }

  if (preflight.movableRootIds.length > 0) {
    impact.warnings.push(
      `${preflight.movableRootIds.length} plan sequence${preflight.movableRootIds.length === 1 ? "" : "s"} can move one class meeting.`
    );
  }

  if (preflight.blockedRootIds.length > 0) {
    impact.warnings.push(
      `${preflight.blockedRootIds.length} plan sequence${preflight.blockedRootIds.length === 1 ? " is" : "s are"} protected or blocked and will not move.`
    );
  }

  return impact;
}
