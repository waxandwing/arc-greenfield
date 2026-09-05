import type { Plan } from "./domain";
import { shiftPlanTree } from "./plan-tree";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dayDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

/**
 * Class calendar cells own Units and Lessons only.
 * Day Notes own note/magnet objects only.
 */
export function movePlanToCalendarDate(plans: Plan[], id: string, date: string, courseId: string): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!plan || plan.type === "note") return plans;

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

export function canPlaceInDayNotes(plan: Plan | null | undefined): plan is Plan {
  return Boolean(plan && plan.type === "note");
}

/**
 * Places a free-standing magnet/note in the Notes area for one day.
 * Units and Lessons are intentionally rejected so Notes never becomes an
 * alternate scheduling lane.
 */
export function moveMagnetToDayNotes(plans: Plan[], id: string, date: string): Plan[] {
  const plan = plans.find((item) => item.id === id);
  if (!canPlaceInDayNotes(plan)) return plans;

  return plans.map((item) => item.id === id ? {
    ...item,
    courseId: null,
    date,
    endDate: null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null
  } : item);
}

export function dayNoteMagnetsForDate(plans: Plan[], date: string): Plan[] {
  return plans.filter((plan) => (
    plan.type === "note" &&
    plan.location === "calendar" &&
    plan.courseId === null &&
    plan.date === date &&
    plan.parentUnitId === null
  ));
}
