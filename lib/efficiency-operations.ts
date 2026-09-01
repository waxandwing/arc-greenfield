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

export type ShiftConflict = {
  rootId: string;
  planId: string;
  kind: "fixed-date" | "lesson-collision";
  targetDate: string | null;
  conflictingPlanId: string | null;
};

export type ShiftPreflight = {
  courseIds: string[];
  fromDate: string;
  direction: 1 | -1;
  rootIds: string[];
  movableRootIds: string[];
  blockedRootIds: string[];
  affectedPlanIds: string[];
  conflicts: ShiftConflict[];
};

function shiftedInstructionalDate(calendar: SchoolCalendar, value: string | null, direction: 1 | -1): string | null {
  if (!value) return null;
  return nextInstructionalDate(calendar, value, direction);
}

/**
 * Preflight a one-instructional-day Shift without mutating the workspace.
 * A root is blocked as a whole when any member of its tree is fixed or when
 * moving one of its lessons would collide with a lesson that is not moving.
 */
export function previewInstructionalShift(
  workspace: Workspace,
  courseIds: string[],
  fromDate: string,
  direction: 1 | -1 = 1
): ShiftPreflight {
  const courseSet = new Set(courseIds);
  const roots = workspace.plans.filter((plan) =>
    plan.location === "calendar" &&
    !plan.parentUnitId &&
    Boolean(plan.date) &&
    plan.date! >= fromDate &&
    Boolean(plan.courseId && courseSet.has(plan.courseId))
  );

  const rootTrees = roots.map((root) => ({
    root,
    tree: root.type === "unit" ? collectPlanTree(workspace.plans, root.id) : [root]
  }));
  const movingIds = new Set(rootTrees.flatMap(({ tree }) => tree.map((plan) => plan.id)));
  const conflicts: ShiftConflict[] = [];
  const blockedRootIds = new Set<string>();

  for (const { root, tree } of rootTrees) {
    for (const plan of tree) {
      if (plan.fixedDate) {
        blockedRootIds.add(root.id);
        conflicts.push({
          rootId: root.id,
          planId: plan.id,
          kind: "fixed-date",
          targetDate: plan.date,
          conflictingPlanId: null
        });
      }
    }

    if (blockedRootIds.has(root.id)) continue;

    for (const plan of tree) {
      if (plan.type !== "lesson" || !plan.date || !plan.courseId) continue;
      const targetDate = shiftedInstructionalDate(workspace.calendar, plan.date, direction);
      const collision = workspace.plans.find((candidate) =>
        !movingIds.has(candidate.id) &&
        candidate.location === "calendar" &&
        candidate.type === "lesson" &&
        candidate.courseId === plan.courseId &&
        candidate.date === targetDate
      );
      if (!collision) continue;
      blockedRootIds.add(root.id);
      conflicts.push({
        rootId: root.id,
        planId: plan.id,
        kind: "lesson-collision",
        targetDate,
        conflictingPlanId: collision.id
      });
    }
  }

  const rootIds = roots.map((root) => root.id);
  const movableRootIds = rootIds.filter((id) => !blockedRootIds.has(id));
  const affectedPlanIds = rootTrees
    .filter(({ root }) => !blockedRootIds.has(root.id))
    .flatMap(({ tree }) => tree.map((plan) => plan.id));

  return {
    courseIds: [...courseSet],
    fromDate,
    direction,
    rootIds,
    movableRootIds,
    blockedRootIds: rootIds.filter((id) => blockedRootIds.has(id)),
    affectedPlanIds,
    conflicts
  };
}

/** Apply exactly the preflighted safe roots as one workspace mutation. */
export function applyInstructionalShift(workspace: Workspace, preflight: ShiftPreflight): Workspace {
  if (preflight.movableRootIds.length === 0) return workspace;
  const movableRootIds = new Set(preflight.movableRootIds);
  const memberToRoot = new Map<string, string>();
  for (const rootId of preflight.movableRootIds) {
    const root = workspace.plans.find((plan) => plan.id === rootId);
    if (!root) continue;
    const tree = root.type === "unit" ? collectPlanTree(workspace.plans, rootId) : [root];
    tree.forEach((plan) => memberToRoot.set(plan.id, rootId));
  }

  const plans = workspace.plans.map((plan) => {
    const rootId = memberToRoot.get(plan.id);
    if (!rootId || !movableRootIds.has(rootId)) return plan;
    return {
      ...plan,
      date: shiftedInstructionalDate(workspace.calendar, plan.date, preflight.direction),
      endDate: shiftedInstructionalDate(workspace.calendar, plan.endDate, preflight.direction)
    };
  });
  return { ...workspace, plans };
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
