import type { Plan } from "./domain";
import { shiftPlanTree } from "./plan-tree";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dayDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export function movePlanToCalendarDate(plans: Plan[], id: string, date: string, courseId: string): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!plan) return plans;

  if (plan.type === "unit" && plan.date) {
    return shiftPlanTree(plans, id, dayDelta(plan.date, date), courseId);
  }

  return plans.map((item) => {
    if (item.id !== id) return item;
    const changingCourse = item.courseId !== courseId;
    const detachFromUnit = Boolean(item.parentUnitId && changingCourse);
    return {
      ...item,
      courseId,
      date,
      location: "calendar",
      parentUnitId: detachFromUnit ? null : item.parentUnitId,
      childOrder: detachFromUnit ? null : item.childOrder
    };
  });
}
