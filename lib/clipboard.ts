import type { Plan, Workspace } from "./domain";
import { clonePlanTree, collectPlanTree, deletePlanTree } from "./plan-tree";

export type ClipboardMode = "copy" | "cut";

export type ArcClipboard = {
  mode: ClipboardMode;
  sourceRootId: string;
  sourceCourseId: string | null;
  sourceDate: string | null;
  tree: Plan[];
};

export type PasteTarget = {
  date: string | null;
  courseId: string | null;
  location: "calendar" | "ideas";
};

export type PasteResult = {
  workspace: Workspace;
  pastedRootId: string | null;
  nextClipboard: ArcClipboard | null;
};

export type CutBlocker = {
  code: "fixed-date";
  fixedPlans: Array<Pick<Plan, "id" | "title" | "date">>;
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

function shiftDate(value: string | null, deltaDays: number): string | null {
  if (!value) return null;
  const date = parseDate(value);
  date.setDate(date.getDate() + deltaDays);
  return formatDate(date);
}

export function cutBlocker(workspace: Workspace, selectedPlanId: string): CutBlocker | null {
  const fixedPlans = collectPlanTree(workspace.plans, selectedPlanId)
    .filter((plan) => plan.fixedDate && Boolean(plan.date))
    .map((plan) => ({ id: plan.id, title: plan.title, date: plan.date }));
  return fixedPlans.length ? { code: "fixed-date", fixedPlans } : null;
}

export function createClipboard(workspace: Workspace, selectedPlanId: string, mode: ClipboardMode): ArcClipboard | null {
  const selected = workspace.plans.find((plan) => plan.id === selectedPlanId);
  if (!selected) return null;

  // Cut is movement, so a fixed date cannot enter a relocation path that lacks
  // an explicit override. Copy is allowed because it creates a distinct object.
  if (mode === "cut" && cutBlocker(workspace, selectedPlanId)) return null;

  const tree = structuredClone(collectPlanTree(workspace.plans, selectedPlanId));
  const normalizedTree = tree.map((plan) => {
    if (plan.id !== selectedPlanId) return plan;
    return {
      ...plan,
      // A selected Unit remains the root of its full tree. A selected nested Lesson
      // becomes a standalone clipboard root instead of retaining a stale Unit link.
      parentUnitId: selected.type === "unit" ? plan.parentUnitId : null,
      childOrder: selected.type === "unit" ? plan.childOrder : null
    };
  });

  return {
    mode,
    sourceRootId: selectedPlanId,
    sourceCourseId: selected.courseId,
    sourceDate: selected.date,
    tree: normalizedTree
  };
}

export function applyCut(workspace: Workspace, clipboard: ArcClipboard): Workspace {
  if (clipboard.mode !== "cut") return workspace;
  return { ...workspace, plans: deletePlanTree(workspace.plans, clipboard.sourceRootId) };
}

function relocateCutTree(clipboard: ArcClipboard, target: PasteTarget): Plan[] {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return [];
  const targetDate = target.location === "calendar" ? target.date : null;
  const deltaDays = targetDate && sourceRoot.date
    ? Math.round((parseDate(targetDate).getTime() - parseDate(sourceRoot.date).getTime()) / 86400000)
    : 0;

  return clipboard.tree.map((plan) => ({
    ...plan,
    // A Cut is a relocation of the SAME canonical object. IDs and relationships
    // therefore remain unchanged. Only placement metadata moves.
    courseId: target.courseId,
    date: target.location === "calendar" ? shiftDate(plan.date, deltaDays) : plan.date,
    endDate: target.location === "calendar" ? shiftDate(plan.endDate, deltaDays) : plan.endDate,
    location: target.location,
    arcLocation: target.location === "calendar" ? "calendar" : "fridge"
  }));
}

export function pasteClipboard(workspace: Workspace, clipboard: ArcClipboard, target: PasteTarget): PasteResult {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return { workspace, pastedRootId: null, nextClipboard: clipboard };

  if (clipboard.mode === "cut") {
    const relocated = relocateCutTree(clipboard, target);
    const pastedRoot = relocated.find((plan) => plan.id === clipboard.sourceRootId) ?? relocated[0] ?? null;
    if (!pastedRoot) return { workspace, pastedRootId: null, nextClipboard: clipboard };

    // Cut is only valid after the source tree has been removed. If any of the
    // stable IDs still exist, appending the relocated tree would create two
    // canonical records with one identity. Fail closed and keep the clipboard.
    const occupiedIds = new Set(workspace.plans.map((plan) => plan.id));
    if (relocated.some((plan) => occupiedIds.has(plan.id))) {
      return { workspace, pastedRootId: null, nextClipboard: clipboard };
    }

    return {
      workspace: { ...workspace, plans: [...workspace.plans, ...relocated] },
      pastedRootId: pastedRoot.id,
      nextClipboard: null
    };
  }

  const targetDate = target.location === "ideas" ? null : target.date;
  const clones = clonePlanTree(clipboard.tree, clipboard.sourceRootId, targetDate, target.courseId);
  const pastedRoot = clones.find((plan) => plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({
    ...plan,
    location: target.location,
    arcLocation: target.location === "calendar" ? "calendar" as const : "fridge" as const,
    courseId: target.courseId
  }));
  const nextWorkspace = { ...workspace, plans: [...workspace.plans, ...normalized] };

  return {
    workspace: nextWorkspace,
    pastedRootId: pastedRoot?.id ?? null,
    nextClipboard: clipboard
  };
}
