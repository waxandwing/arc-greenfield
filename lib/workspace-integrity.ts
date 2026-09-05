import type { Plan, Workspace } from "./domain";

export function hasUniquePlanIds(workspace: Workspace): boolean {
  const ids = workspace.plans.map((plan) => plan.id);
  return new Set(ids).size === ids.length;
}

function needsDetach(plan: Plan, byId: Map<string, Plan>): boolean {
  if (!plan.parentUnitId) return false;
  if (plan.type !== "lesson") return true;

  const parent = byId.get(plan.parentUnitId);
  if (!parent || parent.type !== "unit") return true;

  // A Lesson cannot remain nested under a Unit from a different Course. Detach
  // rather than rewriting either object's Course, which would invent teaching truth.
  if (plan.courseId !== parent.courseId) return true;

  return false;
}

export function repairPlanRelationships(workspace: Workspace): Workspace {
  const byId = new Map(workspace.plans.map((plan) => [plan.id, plan]));
  let changed = false;

  const plans = workspace.plans.map((plan) => {
    if (!needsDetach(plan, byId)) return plan;
    changed = true;
    return {
      ...plan,
      parentUnitId: null,
      childOrder: null
    };
  });

  return changed ? { ...workspace, plans } : workspace;
}
