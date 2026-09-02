import type { Plan, Workspace } from "./domain";

export type RecoveryImpact = {
  planId: string;
  title: string;
  courseId: string | null;
  fromDate: string;
  toDate: string | null;
  fixed: boolean;
  collisionTitles: string[];
};

export type RecoveryPreview = {
  disruptionDate: string;
  impacts: RecoveryImpact[];
  movableCount: number;
  fixedCount: number;
  collisionCount: number;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

function daysBetween(start: string, end: string) {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000);
}

function isInstructionalDate(workspace: Workspace, value: string) {
  const date = parseDate(value);
  const day = date.getDay();
  if (!workspace.calendar.weekendsVisible && (day === 0 || day === 6)) return false;
  return !workspace.calendar.noSchoolDates.some((item) => item.date === value);
}

export function nextInstructionalDate(workspace: Workspace, value: string) {
  let candidate = addDays(value, 1);
  for (let guard = 0; guard < 370; guard += 1) {
    if (isInstructionalDate(workspace, candidate)) return candidate;
    candidate = addDays(candidate, 1);
  }
  return null;
}

export function previewDisruption(workspace: Workspace, disruptionDate: string): RecoveryPreview {
  const affected = workspace.plans.filter((plan) => plan.location === "calendar" && plan.date === disruptionDate);
  const affectedIds = new Set(affected.map((plan) => plan.id));
  const targetDate = nextInstructionalDate(workspace, disruptionDate);

  const impacts = affected.map((plan) => {
    const collisionTitles = !plan.fixedDate && targetDate
      ? workspace.plans
          .filter((candidate) => candidate.location === "calendar" && candidate.date === targetDate && candidate.courseId === plan.courseId && !affectedIds.has(candidate.id))
          .map((candidate) => candidate.title)
      : [];

    return {
      planId: plan.id,
      title: plan.title,
      courseId: plan.courseId,
      fromDate: disruptionDate,
      toDate: plan.fixedDate ? null : targetDate,
      fixed: plan.fixedDate,
      collisionTitles
    };
  });

  return {
    disruptionDate,
    impacts,
    movableCount: impacts.filter((item) => !item.fixed && item.toDate).length,
    fixedCount: impacts.filter((item) => item.fixed).length,
    collisionCount: impacts.filter((item) => item.collisionTitles.length > 0).length
  };
}

export function applyRecoveryPreview(workspace: Workspace, preview: RecoveryPreview): Workspace {
  const impactById = new Map(preview.impacts.map((impact) => [impact.planId, impact]));
  const plans: Plan[] = workspace.plans.map((plan) => {
    const impact = impactById.get(plan.id);
    if (!impact || impact.fixed || !impact.toDate) return plan;

    const shiftedEndDate = plan.endDate
      ? addDays(plan.endDate, daysBetween(impact.fromDate, impact.toDate))
      : plan.endDate;

    return {
      ...plan,
      date: impact.toDate,
      endDate: shiftedEndDate,
      details: {
        ...plan.details,
        lastRecoveryFrom: impact.fromDate,
        lastRecoveryTo: impact.toDate
      }
    };
  });

  return { ...workspace, plans, updatedAt: new Date().toISOString() };
}
