import type { Plan } from "./domain";
import { calendarDayDelta, shiftDateKey } from "./date-utils";

export function collectPlanTree(plans: Plan[], rootId: string): Plan[] {
  if (!plans.some((plan) => plan.id === rootId)) return [];

  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const plan of plans) {
      if (plan.parentUnitId && ids.has(plan.parentUnitId) && !ids.has(plan.id)) {
        ids.add(plan.id);
        added = true;
      }
    }
  }
  return plans.filter((plan) => ids.has(plan.id));
}

export function resolveTreeRootId(plans: Plan[], planId: string): string | null {
  let current = plans.find((plan) => plan.id === planId);
  if (!current) return null;

  const visited = new Set<string>();
  while (current.parentUnitId && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = plans.find((plan) => plan.id === current!.parentUnitId);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

export function shiftPlanTree(
  plans: Plan[],
  rootId: string,
  deltaDays: number,
  courseId?: string | null
): Plan[] {
  const tree = collectPlanTree(plans, rootId);
  if (tree.length === 0) return plans;

  const targetCourseId = courseId === undefined ? null : courseId;
  const isNoOp = deltaDays === 0 && tree.every((plan) =>
    plan.location === "calendar" &&
    (courseId === undefined || plan.courseId === targetCourseId)
  );
  if (isNoOp) return plans;

  const treeIds = new Set(tree.map((plan) => plan.id));
  return plans.map((plan) => {
    if (!treeIds.has(plan.id)) return plan;
    return {
      ...plan,
      courseId: courseId === undefined ? plan.courseId : courseId,
      date: shiftDateKey(plan.date, deltaDays),
      endDate: shiftDateKey(plan.endDate, deltaDays),
      location: "calendar" as const
    };
  });
}

export function movePlanTreeToIdeas(plans: Plan[], rootId: string): Plan[] {
  const tree = collectPlanTree(plans, rootId);
  if (tree.length === 0 || tree.every((plan) => plan.location === "ideas")) return plans;

  const treeIds = new Set(tree.map((plan) => plan.id));
  return plans.map((plan) => treeIds.has(plan.id) ? { ...plan, location: "ideas" as const } : plan);
}

export function deletePlanTree(plans: Plan[], rootId: string): Plan[] {
  const tree = collectPlanTree(plans, rootId);
  if (tree.length === 0) return plans;

  const treeIds = new Set(tree.map((plan) => plan.id));
  return plans.filter((plan) => !treeIds.has(plan.id));
}

export function clonePlanTree(
  plans: Plan[],
  rootId: string,
  targetDate?: string | null,
  targetCourseId?: string | null
): Plan[] {
  const tree = collectPlanTree(plans, rootId);
  const root = tree.find((plan) => plan.id === rootId);
  if (!root) return [];

  const idMap = new Map(tree.map((plan) => [plan.id, crypto.randomUUID()]));
  const deltaDays = targetDate && root.date ? calendarDayDelta(root.date, targetDate) : 0;

  return tree.map((plan) => ({
    ...plan,
    id: idMap.get(plan.id)!,
    parentUnitId: plan.parentUnitId ? idMap.get(plan.parentUnitId) ?? plan.parentUnitId : null,
    continuationOfId: plan.continuationOfId ? idMap.get(plan.continuationOfId) ?? plan.continuationOfId : null,
    courseId: targetCourseId === undefined ? plan.courseId : targetCourseId,
    date: targetDate === null ? plan.date : shiftDateKey(plan.date, deltaDays),
    endDate: targetDate === null ? plan.endDate : shiftDateKey(plan.endDate, deltaDays),
    location: targetDate === null ? "ideas" : "calendar"
  }));
}

export function orderedUnitChildren(plans: Plan[], unitId: string): Plan[] {
  return plans
    .filter((plan) => plan.parentUnitId === unitId)
    .sort((a, b) => (a.childOrder ?? Number.MAX_SAFE_INTEGER) - (b.childOrder ?? Number.MAX_SAFE_INTEGER));
}
