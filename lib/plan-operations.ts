import type { Plan, PlanLocation } from "./domain";
import { collectPlanTree, deletePlanTree, orderedUnitChildren, shiftPlanTree } from "./plan-tree";

function parseDate(value: string) {
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

function dayDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

function normalizeChildOrder(plans: Plan[], unitId: string): Plan[] {
  const ordered = orderedUnitChildren(plans, unitId);
  const order = new Map(ordered.map((child, index) => [child.id, index]));
  return plans.map((plan) => order.has(plan.id) ? { ...plan, childOrder: order.get(plan.id)! } : plan);
}

export type CalendarTarget = {
  kind: "calendar";
  date: string;
  courseId: string;
};

export type FridgeTarget = {
  kind: "fridge";
};

export type UnitTarget = {
  kind: "unit";
  unitId: string;
  position?: number;
};

export type PlanTarget = CalendarTarget | FridgeTarget | UnitTarget;

export function movePlanToCalendarDate(plans: Plan[], id: string, date: string, courseId: string): Plan[] {
  return movePlan(plans, id, { kind: "calendar", date, courseId });
}

export function movePlan(plans: Plan[], id: string, target: PlanTarget): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!plan) return plans;

  if (target.kind === "fridge") {
    const ids = new Set(collectPlanTree(plans, id).map((item) => item.id));
    return plans.map((item) => ids.has(item.id)
      ? { ...item, location: "fridge" as PlanLocation }
      : item);
  }

  if (target.kind === "unit") {
    return nestLesson(plans, id, target.unitId, target.position);
  }

  if (plan.type === "unit" && plan.date) {
    return shiftPlanTree(plans, id, dayDelta(plan.date, target.date), target.courseId);
  }

  return plans.map((item) => {
    if (item.id !== id) return item;
    const changingCourse = item.courseId !== target.courseId;
    const detachFromUnit = Boolean(item.parentUnitId && changingCourse);
    return {
      ...item,
      courseId: target.courseId,
      date: target.date,
      location: "calendar" as const,
      parentUnitId: detachFromUnit ? null : item.parentUnitId,
      childOrder: detachFromUnit ? null : item.childOrder
    };
  });
}

export function nestLesson(plans: Plan[], lessonId: string, unitId: string, position?: number): Plan[] {
  const lesson = plans.find((item) => item.id === lessonId);
  const unit = plans.find((item) => item.id === unitId);
  if (!lesson || lesson.type !== "lesson" || !unit || unit.type !== "unit") return plans;
  if (lesson.id === unit.id) return plans;

  const siblings = orderedUnitChildren(plans, unitId).filter((item) => item.id !== lessonId);
  const index = Math.max(0, Math.min(position ?? siblings.length, siblings.length));
  const reordered = [...siblings.slice(0, index), lesson, ...siblings.slice(index)];
  const childOrder = new Map(reordered.map((item, i) => [item.id, i]));
  const unitStart = unit.date;
  const unitEnd = unit.endDate ?? unit.date;

  return plans.map((item) => {
    if (item.id === lessonId) {
      let date = item.date;
      if (unitStart && (!date || date < unitStart)) date = unitStart;
      if (unitEnd && date && date > unitEnd) date = unitEnd;
      return {
        ...item,
        parentUnitId: unitId,
        childOrder: childOrder.get(item.id) ?? index,
        courseId: unit.courseId,
        date,
        location: unit.location
      };
    }
    if (childOrder.has(item.id)) return { ...item, childOrder: childOrder.get(item.id)! };
    return item;
  });
}

export function detachLesson(plans: Plan[], lessonId: string, target?: CalendarTarget | FridgeTarget): Plan[] {
  const lesson = plans.find((item) => item.id === lessonId);
  if (!lesson || lesson.type !== "lesson" || !lesson.parentUnitId) return plans;
  const priorUnitId = lesson.parentUnitId;

  let next = plans.map((item) => item.id === lessonId
    ? {
        ...item,
        parentUnitId: null,
        childOrder: null,
        location: target?.kind === "fridge" ? "fridge" as const : item.location,
        date: target?.kind === "calendar" ? target.date : item.date,
        courseId: target?.kind === "calendar" ? target.courseId : item.courseId
      }
    : item);
  next = normalizeChildOrder(next, priorUnitId);
  return next;
}

export function movePlanTreeToLocation(plans: Plan[], rootId: string, location: PlanLocation): Plan[] {
  const ids = new Set(collectPlanTree(plans, rootId).map((item) => item.id));
  return plans.map((item) => ids.has(item.id) ? { ...item, location } : item);
}

export function deleteSelection(plans: Plan[], selectedId: string): Plan[] {
  const selected = plans.find((item) => item.id === selectedId);
  if (!selected) return plans;
  if (selected.type === "unit") return deletePlanTree(plans, selectedId);
  if (selected.parentUnitId) {
    const parentUnitId = selected.parentUnitId;
    return normalizeChildOrder(plans.filter((item) => item.id !== selectedId), parentUnitId);
  }
  return plans.filter((item) => item.id !== selectedId);
}

export function moveUnitTreeByDelta(plans: Plan[], unitId: string, deltaDays: number, courseId?: string | null): Plan[] {
  const unit = plans.find((item) => item.id === unitId);
  if (!unit || unit.type !== "unit") return plans;
  return shiftPlanTree(plans, unitId, deltaDays, courseId);
}

export function moveLoosePlanByDelta(plans: Plan[], planId: string, deltaDays: number): Plan[] {
  return plans.map((item) => item.id === planId
    ? { ...item, date: shiftDate(item.date, deltaDays), endDate: shiftDate(item.endDate, deltaDays) }
    : item);
}