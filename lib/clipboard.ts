import type { Plan, Workspace } from "./domain";
import { clonePlanTree, collectPlanTree, deletePlanTree, resolveTreeRootId } from "./plan-tree";

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
  const rootId = resolveTreeRootId(workspace.plans, selectedPlanId);
  if (!rootId) return null;
  const root = workspace.plans.find((plan) => plan.id === rootId);
  if (!root) return null;
  const tree = structuredClone(collectPlanTree(workspace.plans, rootId));
  return {
    mode,
    sourceRootId: rootId,
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
  // Clone from the clipboard snapshot, not the live workspace. This makes cross-view
  // cut/paste safe even after the source tree has been removed from the workspace.
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return { workspace, pastedRootId: null };

  const tempPlans = clipboard.tree;
  const targetDate = target.location === "ideas" ? null : target.date;
  const clones = clonePlanTree(tempPlans, clipboard.sourceRootId, targetDate, target.courseId);
  const pastedRoot = clones.find((plan) => plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({
    ...plan,
    location: target.location,
    courseId: target.courseId,
    // Ideas visually ignores dates, but the cloned tree keeps its relative timing so
    // a later paste back to Month/Quarter can preserve lesson spacing.
    date: target.location === "ideas" ? plan.date : plan.date,
    endDate: target.location === "ideas" ? plan.endDate : plan.endDate
  }));

  return {
    workspace: { ...workspace, plans: [...workspace.plans, ...normalized] },
    pastedRootId: pastedRoot?.id ?? null
  };
}
