import type { Plan } from "./domain";
import { collectPlanTree, shiftPlanTree } from "./plan-tree";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dayDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export type CalendarMoveBlocker = {
  code: "fixed-date";
  rootId: string;
  fixedPlans: Array<Pick<Plan, "id" | "title" | "date">>;
};

export function calendarMoveBlocker(plans: Plan[], id: string, date: string): CalendarMoveBlocker | null {
  const plan = plans.find((item) => item.id === id);
  if (!plan || !plan.date || plan.date === date) return null;

  const candidates = plan.type === "unit" ? collectPlanTree(plans, id) : [plan];
  const fixedPlans = candidates
    .filter((item) => item.fixedDate && Boolean(item.date))
    .map((item) => ({ id: item.id, title: item.title, date: item.date }));

  if (!fixedPlans.length) return null;
  return { code: "fixed-date", rootId: id, fixedPlans };
}

export function movePlanToCalendarDate(plans: Plan[], id: string, date: string, courseId: string): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!plan) return plans;

  // Fixed dates are a domain invariant, not a UI preference. Any caller that
  // attempts to move a fixed object (or a Unit containing one) to a different
  // date fails closed unless a future explicit override path is invoked.
  if (calendarMoveBlocker(plans, id, date)) return plans;

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
      arcLocation: "calendar",
      parentUnitId: detachFromUnit ? null : item.parentUnitId,
      childOrder: detachFromUnit ? null : item.childOrder
    };
  });
}
