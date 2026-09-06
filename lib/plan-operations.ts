import type { Plan } from "./domain";
import { calendarDayDelta } from "./date-utils";
import { shiftPlanTree } from "./plan-tree";

export function movePlanToCalendarDate(plans: Plan[], id: string, date: string, courseId: string): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!plan) return plans;

  if (plan.type === "unit" && plan.date) {
    const delta = calendarDayDelta(plan.date, date);
    if (delta === 0 && plan.courseId === courseId && plan.location === "calendar") return plans;
    return shiftPlanTree(plans, id, delta, courseId);
  }

  const changingCourse = plan.courseId !== courseId;
  const detachFromUnit = Boolean(plan.parentUnitId && changingCourse);
  if (
    plan.date === date &&
    plan.courseId === courseId &&
    plan.location === "calendar" &&
    !detachFromUnit
  ) return plans;

  return plans.map((item) => item.id === id ? {
    ...item,
    courseId,
    date,
    location: "calendar",
    parentUnitId: detachFromUnit ? null : item.parentUnitId,
    childOrder: detachFromUnit ? null : item.childOrder
  } : item);
}
