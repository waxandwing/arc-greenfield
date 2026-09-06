import type { Workspace } from "./domain";
import { movePlanToCalendarDate } from "./plan-operations";
import { collectPlanTree, movePlanTreeToIdeas } from "./plan-tree";

export type PlanDestination =
  | { location: "ideas" }
  | { location: "calendar"; date: string; courseId: string };

/**
 * Canonical plan relocation seam for Arc.
 * Location determines whether a plan is scheduled; date values on parked Unit trees
 * remain internal anchors so relative Lesson offsets can be restored on reschedule.
 */
export function relocatePlan(
  workspace: Workspace,
  planId: string,
  destination: PlanDestination
): Workspace {
  const plan = workspace.plans.find((item) => item.id === planId);
  if (!plan) return workspace;

  if (destination.location === "calendar") {
    const plans = movePlanToCalendarDate(workspace.plans, planId, destination.date, destination.courseId);
    return plans === workspace.plans ? workspace : { ...workspace, plans };
  }

  if (plan.type === "unit") {
    const tree = collectPlanTree(workspace.plans, planId);
    if (tree.length > 0 && tree.every((item) => item.location === "ideas")) return workspace;
    return { ...workspace, plans: movePlanTreeToIdeas(workspace.plans, planId) };
  }

  if (plan.location === "ideas" && !plan.parentUnitId) return workspace;

  const plans = movePlanTreeToIdeas(workspace.plans, planId).map((item) =>
    item.id === planId && item.parentUnitId
      ? { ...item, parentUnitId: null, childOrder: null }
      : item
  );
  return { ...workspace, plans };
}

export function moveWorkspacePlanToIdeas(workspace: Workspace, planId: string): Workspace {
  return relocatePlan(workspace, planId, { location: "ideas" });
}

export function moveWorkspacePlanToCalendar(
  workspace: Workspace,
  planId: string,
  date: string,
  courseId: string
): Workspace {
  return relocatePlan(workspace, planId, { location: "calendar", date, courseId });
}
