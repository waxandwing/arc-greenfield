import type { Plan, SchoolCalendar, Workspace } from "./domain";
import { collectPlanTree } from "./plan-tree";

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

function shiftDate(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function isInstructionalDay(calendar: SchoolCalendar, value: string): boolean {
  const day = parseDate(value).getDay();
  if (day === 0 || day === 6) return false;
  return !calendar.noSchoolDates.some((item) => item.date === value);
}

export function nextInstructionalDate(calendar: SchoolCalendar, value: string, direction: 1 | -1 = 1): string {
  let next = value;
  do next = shiftDate(next, direction); while (!isInstructionalDay(calendar, next));
  return next;
}

export function tackLesson(workspace: Workspace, lessonId: string): Workspace {
  const lesson = workspace.plans.find((plan) => plan.id === lessonId && plan.type === "lesson");
  if (!lesson?.date || lesson.fixedDate) return workspace;
  const next = nextInstructionalDate(workspace.calendar, lesson.date);
  return {
    ...workspace,
    plans: workspace.plans.map((plan) => plan.id === lessonId ? { ...plan, date: next, location: "calendar" as const } : plan)
  };
}

export function extendLesson(workspace: Workspace, lessonId: string): { workspace: Workspace; continuationId: string | null } {
  const lesson = workspace.plans.find((plan) => plan.id === lessonId && plan.type === "lesson");
  if (!lesson?.date) return { workspace, continuationId: null };
  const next = nextInstructionalDate(workspace.calendar, lesson.date);
  const continuationId = crypto.randomUUID();
  const siblings = lesson.parentUnitId
    ? workspace.plans.filter((plan) => plan.parentUnitId === lesson.parentUnitId)
    : [];
  const continuation: Plan = {
    ...lesson,
    id: continuationId,
    title: `${lesson.title} · continued`,
    date: next,
    fixedDate: false,
    continuationOfId: lesson.id,
    childOrder: lesson.parentUnitId ? siblings.length : null
  };
  return { workspace: { ...workspace, plans: [...workspace.plans, continuation] }, continuationId };
}

export function copyLessonNext(workspace: Workspace, lessonId: string): { workspace: Workspace; copyId: string | null } {
  const lesson = workspace.plans.find((plan) => plan.id === lessonId && plan.type === "lesson");
  if (!lesson?.date) return { workspace, copyId: null };
  const copyId = crypto.randomUUID();
  const next = nextInstructionalDate(workspace.calendar, lesson.date);
  const siblings = lesson.parentUnitId
    ? workspace.plans.filter((plan) => plan.parentUnitId === lesson.parentUnitId)
    : [];
  const copy: Plan = {
    ...lesson,
    id: copyId,
    date: next,
    continuationOfId: null,
    fixedDate: false,
    childOrder: lesson.parentUnitId ? siblings.length : null
  };
  return { workspace: { ...workspace, plans: [...workspace.plans, copy] }, copyId };
}

export function reuseWeek(workspace: Workspace, weekStart: string): { workspace: Workspace; createdIds: string[] } {
  const weekEnd = shiftDate(weekStart, 4);
  const roots = workspace.plans.filter((plan) => {
    if (plan.location !== "calendar" || plan.parentUnitId) return false;
    if (!plan.date) return false;
    return plan.date >= weekStart && plan.date <= weekEnd;
  });
  const sourceIds = new Set<string>();
  for (const root of roots) collectPlanTree(workspace.plans, root.id).forEach((plan) => sourceIds.add(plan.id));
  const source = workspace.plans.filter((plan) => sourceIds.has(plan.id));
  const idMap = new Map(source.map((plan) => [plan.id, crypto.randomUUID()]));
  const copies = source.map((plan) => ({
    ...plan,
    id: idMap.get(plan.id)!,
    date: plan.date ? shiftDate(plan.date, 7) : null,
    endDate: plan.endDate ? shiftDate(plan.endDate, 7) : null,
    parentUnitId: plan.parentUnitId ? idMap.get(plan.parentUnitId) ?? null : null,
    continuationOfId: plan.continuationOfId ? idMap.get(plan.continuationOfId) ?? null : null,
    fixedDate: false
  }));
  return {
    workspace: { ...workspace, plans: [...workspace.plans, ...copies] },
    createdIds: copies.map((plan) => plan.id)
  };
}

export function checkpointQuarter(workspace: Workspace, quarterId: string): Workspace {
  const checkpoints = workspace.checkpoints ?? [];
  const checkpoint = {
    id: crypto.randomUUID(),
    label: `${quarterId} checkpoint`,
    quarterId,
    createdAt: new Date().toISOString(),
    plans: structuredClone(workspace.plans),
    preferences: structuredClone(workspace.preferences)
  };
  return { ...workspace, checkpoints: [...checkpoints, checkpoint] };
}
