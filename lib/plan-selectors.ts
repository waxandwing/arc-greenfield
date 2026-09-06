import type { Plan, Workspace } from "./domain";
import { orderedUnitChildren } from "./plan-tree";

export type UnitSpanPosition = "spanSingle" | "spanStart" | "spanMiddle" | "spanEnd" | "";

export function ownerUnit(workspace: Workspace, plan: Plan): Plan | null {
  if (!plan.parentUnitId) return null;
  return workspace.plans.find((candidate) => candidate.id === plan.parentUnitId && candidate.type === "unit") ?? null;
}

export function planCoversDate(plan: Plan, date: string): boolean {
  if (plan.type !== "unit" || !plan.date) return plan.date === date;
  const end = plan.endDate ?? plan.date;
  return plan.date <= date && end >= date;
}

export function unitSpanPosition(plan: Plan, date: string): UnitSpanPosition {
  if (plan.type !== "unit" || !plan.date) return "";
  const end = plan.endDate ?? plan.date;
  if (plan.date === date && end === date) return "spanSingle";
  if (plan.date === date) return "spanStart";
  if (end === date) return "spanEnd";
  return "spanMiddle";
}

export function rootPlansForDate(workspace: Workspace, courseId: string, date: string): Plan[] {
  return workspace.plans.filter((plan) =>
    plan.location === "calendar" &&
    plan.parentUnitId === null &&
    plan.courseId === courseId &&
    planCoversDate(plan, date)
  );
}

export function nestedLessonsForDate(workspace: Workspace, courseId: string, date: string): Plan[] {
  return workspace.plans.filter((plan) => {
    if (
      plan.location !== "calendar" ||
      plan.courseId !== courseId ||
      plan.type !== "lesson" ||
      !plan.parentUnitId ||
      plan.date !== date
    ) return false;
    const unit = ownerUnit(workspace, plan);
    return Boolean(unit && !workspace.preferences.collapsedUnitIds.includes(unit.id));
  });
}

export function unitChildren(workspace: Workspace, unitId: string): Plan[] {
  return orderedUnitChildren(workspace.plans, unitId);
}

export function shortPlanDate(value: string | null): string {
  if (!value) return "unscheduled";
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}
