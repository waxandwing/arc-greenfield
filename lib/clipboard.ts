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

export function createClipboard(workspace: Workspace, selectedPlanId: string, mode: ClipboardMode): ArcClipboard | null {
  const selected = workspace.plans.find((plan) => plan.id === selectedPlanId);
  if (!selected) return null;

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

export function pasteClipboard(workspace: Workspace, clipboard: ArcClipboard, target: PasteTarget): { workspace: Workspace; pastedRootId: string | null } {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return { workspace, pastedRootId: null };

  const targetDate = target.location === "ideas" ? null : target.date;
  const clones = clonePlanTree(clipboard.tree, clipboard.sourceRootId, targetDate, target.courseId);
  const pastedRoot = clones.find((plan) => plan.id !== undefined && plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({ ...plan, location: target.location, courseId: target.courseId }));

  return {
    workspace: { ...workspace, plans: [...workspace.plans, ...normalized] },
    pastedRootId: pastedRoot?.id ?? null
  };
}
