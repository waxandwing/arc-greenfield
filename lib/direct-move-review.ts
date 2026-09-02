import type { Plan, Workspace } from "./domain";
import { courseMeetsOnDate } from "./efficiency-operations";
import { collectPlanTree } from "./plan-tree";

export type DirectMoveReview = {
  allowed: boolean;
  reason: string | null;
  conflictingPlanId: string | null;
  protectedPlanId: string | null;
  invalidMeetingPlanId: string | null;
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

function readableDate(value: string) {
  return parseDate(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function blocked(reason: string, patch: Partial<DirectMoveReview> = {}): DirectMoveReview {
  return {
    allowed: false,
    reason,
    conflictingPlanId: null,
    protectedPlanId: null,
    invalidMeetingPlanId: null,
    ...patch
  };
}

export function reviewDirectCalendarMove(workspace: Workspace, planId: string, targetDate: string, targetCourseId: string): DirectMoveReview {
  const plans = workspace.plans;
  const source = plans.find((plan) => plan.id === planId);
  if (!source) return blocked("That plan is no longer available.");

  const tree = source.type === "unit" ? collectPlanTree(plans, source.id) : [source];
  const movingIds = new Set(tree.map((plan) => plan.id));
  const placementChanges = source.date !== targetDate || source.courseId !== targetCourseId || source.location !== "calendar";
  const protectedPlan = placementChanges ? tree.find((plan) => plan.fixedDate) : null;
  if (protectedPlan) {
    return blocked(
      protectedPlan.id === source.id
        ? `${protectedPlan.title} is fixed to its current date.`
        : `${protectedPlan.title} is fixed inside this Unit, so the Unit stays put.`,
      { protectedPlanId: protectedPlan.id }
    );
  }

  const delta = source.date ? dateDelta(source.date, targetDate) : 0;
  const lessons = tree.filter((plan) => plan.type === "lesson");
  const targetCourse = workspace.courses.find((course) => course.id === targetCourseId);
  for (const lesson of lessons) {
    const landingDate = source.type === "unit"
      ? (source.date ? shiftDate(lesson.date, delta) : lesson.date ?? targetDate)
      : targetDate;
    if (!landingDate) continue;

    if (!courseMeetsOnDate(workspace, targetCourseId, landingDate)) {
      return blocked(
        `${lesson.title} would land on ${readableDate(landingDate)}, when ${targetCourse?.name ?? "that class"} does not meet. Nothing moved.`,
        { invalidMeetingPlanId: lesson.id }
      );
    }

    const collision = plans.find((candidate) =>
      !movingIds.has(candidate.id) &&
      candidate.location === "calendar" &&
      candidate.type === "lesson" &&
      candidate.courseId === targetCourseId &&
      candidate.date === landingDate
    );
    if (collision) {
      return blocked(`${collision.title} is already scheduled there. Nothing moved.`, { conflictingPlanId: collision.id });
    }
  }

  return { allowed: true, reason: null, conflictingPlanId: null, protectedPlanId: null, invalidMeetingPlanId: null };
}
