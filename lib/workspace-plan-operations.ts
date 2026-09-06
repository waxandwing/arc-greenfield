import type { Plan, Workspace } from "./domain";
import { movePlanToCalendarDate } from "./plan-operations";
import { movePlanTreeToIdeas } from "./plan-tree";

export type PlanDestination =
  | { location: "ideas" }
  | { location: "calendar"; date: string; courseId: string };

/**
 * Canonical plan relocation seam for Arc.
 *
 * UI surfaces do not mutate Plan fields directly. They request a destination;
 * this operation applies the domain mutation and returns the next Workspace.
 * History/persistence remain separate owners around this pure mutation.
 */
export function relocatePlan(
  workspace: Workspace,
  planId: string,
  destination: PlanDestination
): Workspace {
  const plan = workspace.plans.find((item) => item.id === planId);
  if (!plan) return workspace;

  if (destination.location === "calendar") {
    const plans = movePlanToCalendarDate(
      workspace.plans,
      planId,
      destination.date,
      destination.courseId
    );
    return plans === workspace.plans ? workspace : { ...workspace, plans };
  }

  let plans = movePlanTreeToIdeas(workspace.plans, planId);

  // A lesson/note removed from a Unit becomes an independent Ideas object.
  // Units retain their own tree so the grouped plan can be parked/restored as one object.
  if (plan.type !== "unit" && plan.parentUnitId) {
    plans = plans.map((item) =>
      item.id === planId
        ? { ...item, parentUnitId: null, childOrder: null }
        : item
    );
  }

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

export function planById(plans: Plan[], planId: string): Plan | undefined {
  return plans.find((plan) => plan.id === planId);
}
