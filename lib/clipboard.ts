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
  const root = workspace.plans.find((plan) => plan.id === selectedPlanId);
  if (!root) return null;
  const tree = structuredClone(collectPlanTree(workspace.plans, selectedPlanId));
  return {
    mode,
    sourceRootId: selectedPlanId,
    sourceCourseId: root.courseId,
    sourceDate: root.date,
    tree
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
  const pastedRoot = clones.find((plan) => plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({ ...plan, location: target.location, courseId: target.courseId }));

  return {
    workspace: { ...workspace, plans: [...workspace.plans, ...normalized] },
    pastedRootId: pastedRoot?.id ?? null
  };
}
