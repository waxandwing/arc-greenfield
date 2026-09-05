import type { Plan } from "./domain";

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(value: string | null, deltaDays: number): string | null {
  if (!value) return null;
  const date = parseDate(value);
  date.setDate(date.getDate() + deltaDays);
  return formatDate(date);
}

function isCalendarPlaced(plan: Plan) {
  return plan.arcLocation ? plan.arcLocation === "calendar" : plan.location === "calendar";
}

export function collectPlanTree(plans: Plan[], rootId: string): Plan[] {
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

export function shiftPlanTree(plans: Plan[], rootId: string, deltaDays: number, courseId?: string | null): Plan[] {
  const tree = collectPlanTree(plans, rootId);

  // Fixed dates are anchors. Tree-level movement must fail closed rather than
  // shifting around them or silently breaking them. A future explicit override
  // must be a separate, auditable operation rather than a flag hidden here.
  if (deltaDays !== 0 && tree.some((plan) => plan.fixedDate && Boolean(plan.date))) return plans;

  const treeIds = new Set(tree.map((plan) => plan.id));
  return plans.map((plan) => {
    if (!treeIds.has(plan.id)) return plan;
    return {
      ...plan,
      courseId: courseId === undefined ? plan.courseId : courseId,
      date: shiftDate(plan.date, deltaDays),
      endDate: shiftDate(plan.endDate, deltaDays),
      location: "calendar" as const,
      arcLocation: "calendar" as const
    };
  });
}

export type UnitUnplaceBlocker = {
  code: "scheduled-children";
  unitId: string;
  scheduledChildren: Array<Pick<Plan, "id" | "title" | "date">>;
};

export function unitUnplaceBlocker(plans: Plan[], rootId: string): UnitUnplaceBlocker | null {
  const root = plans.find((plan) => plan.id === rootId);
  if (!root || root.type !== "unit") return null;

  const scheduledChildren = collectPlanTree(plans, rootId)
    .filter((plan) => plan.id !== rootId && isCalendarPlaced(plan))
    .map((plan) => ({ id: plan.id, title: plan.title, date: plan.date }));

  return scheduledChildren.length
    ? { code: "scheduled-children", unitId: rootId, scheduledChildren }
    : null;
}

export function movePlanTreeToIdeas(plans: Plan[], rootId: string): Plan[] {
  const root = plans.find((plan) => plan.id === rootId);
  if (!root) return plans;

  // "Put in Fridge" is UNPLACE, not "unschedule this whole teaching tree".
  // A Unit must first reconcile its scheduled child Lessons. Once it has no
  // scheduled children, only the selected Unit changes surface; descendants
  // keep their own canonical placement/state.
  if (unitUnplaceBlocker(plans, rootId)) return plans;

  return plans.map((plan) => plan.id === rootId ? {
    ...plan,
    location: "ideas" as const,
    arcLocation: "fridge" as const
  } : plan);
}

export function deletePlanTree(plans: Plan[], rootId: string): Plan[] {
  const treeIds = new Set(collectPlanTree(plans, rootId).map((plan) => plan.id));
  return plans.filter((plan) => !treeIds.has(plan.id));
}

export function clonePlanTree(plans: Plan[], rootId: string, targetDate?: string | null, targetCourseId?: string | null): Plan[] {
  const tree = collectPlanTree(plans, rootId);
  const root = tree.find((plan) => plan.id === rootId);
  if (!root) return [];

  const idMap = new Map(tree.map((plan) => [plan.id, crypto.randomUUID()]));
  const deltaDays = targetDate && root.date
    ? Math.round((parseDate(targetDate).getTime() - parseDate(root.date).getTime()) / 86400000)
    : 0;

  return tree.map((plan) => ({
    ...plan,
    id: idMap.get(plan.id)!,
    parentUnitId: plan.parentUnitId ? idMap.get(plan.parentUnitId) ?? plan.parentUnitId : null,
    continuationOfId: plan.continuationOfId ? idMap.get(plan.continuationOfId) ?? plan.continuationOfId : null,
    courseId: targetCourseId === undefined ? plan.courseId : targetCourseId,
    date: targetDate === null ? plan.date : shiftDate(plan.date, deltaDays),
    endDate: targetDate === null ? plan.endDate : shiftDate(plan.endDate, deltaDays),
    location: targetDate === null ? "ideas" : "calendar",
    arcLocation: targetDate === null ? "fridge" : "calendar"
  }));
}

export function orderedUnitChildren(plans: Plan[], unitId: string): Plan[] {
  return plans
    .filter((plan) => plan.parentUnitId === unitId)
    .sort((a, b) => (a.childOrder ?? Number.MAX_SAFE_INTEGER) - (b.childOrder ?? Number.MAX_SAFE_INTEGER));
}
