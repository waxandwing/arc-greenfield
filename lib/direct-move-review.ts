import type { Plan } from "./domain";
import { collectPlanTree } from "./plan-tree";

export type DirectMoveReview = {
  allowed: boolean;
  reason: string | null;
  conflictingPlanId: string | null;
  protectedPlanId: string | null;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(value: string | null, deltaDays: number) {
  if (!value) return null;
  const date = parseDate(value);
  date.setDate(date.getDate() + deltaDays);
  return formatDate(date);
}

function dateDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export function reviewDirectCalendarMove(plans: Plan[], planId: string, targetDate: string, targetCourseId: string): DirectMoveReview {
  const source = plans.find((plan) => plan.id === planId);
  if (!source) return { allowed: false, reason: "That plan is no longer available.", conflictingPlanId: null, protectedPlanId: null };

  const tree = source.type === "unit" ? collectPlanTree(plans, source.id) : [source];
  const movingIds = new Set(tree.map((plan) => plan.id));
  const placementChanges = source.date !== targetDate || source.courseId !== targetCourseId || source.location !== "calendar";
  const protectedPlan = placementChanges ? tree.find((plan) => plan.fixedDate) : null;
  if (protectedPlan) {
    return {
      allowed: false,
      reason: protectedPlan.id === source.id
        ? `${protectedPlan.title} is fixed to its current date.`
        : `${protectedPlan.title} is fixed inside this Unit, so the Unit stays put.`,
      conflictingPlanId: null,
      protectedPlanId: protectedPlan.id
    };
  }

  const delta = source.date ? dateDelta(source.date, targetDate) : 0;
  const lessons = tree.filter((plan) => plan.type === "lesson");
  for (const lesson of lessons) {
    const landingDate = source.type === "unit"
      ? (source.date ? shiftDate(lesson.date, delta) : lesson.date ?? targetDate)
      : targetDate;
    if (!landingDate) continue;
    const collision = plans.find((candidate) =>
      !movingIds.has(candidate.id) &&
      candidate.location === "calendar" &&
      candidate.type === "lesson" &&
      candidate.courseId === targetCourseId &&
      candidate.date === landingDate
    );
    if (collision) {
      return {
        allowed: false,
        reason: `${collision.title} is already scheduled there. Nothing moved.`,
        conflictingPlanId: collision.id,
        protectedPlanId: null
      };
    }
  }

  return { allowed: true, reason: null, conflictingPlanId: null, protectedPlanId: null };
}
