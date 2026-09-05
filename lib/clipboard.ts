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

export function canPasteClipboardToTarget(clipboard: ArcClipboard, target: PasteTarget): boolean {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return false;

  if (target.location === "ideas") return true;
  if (!target.date) return false;

  // Day Notes are represented by a calendar target with no course. Only free-standing
  // note/magnet objects may use that lane.
  if (target.courseId === null) return sourceRoot.type === "note";

  // Class calendar lanes schedule Units and Lessons only.
  return sourceRoot.type === "unit" || sourceRoot.type === "lesson";
}

export function pasteClipboard(workspace: Workspace, clipboard: ArcClipboard, target: PasteTarget): PasteResult {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot || !canPasteClipboardToTarget(clipboard, target)) {
    return { workspace, pastedRootId: null, nextClipboard: clipboard };
  }

  const targetDate = target.location === "ideas" ? null : target.date;
  const clones = clonePlanTree(clipboard.tree, clipboard.sourceRootId, targetDate, target.courseId);
  const pastedRoot = clones.find((plan) => plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({
    ...plan,
    location: target.location,
    courseId: sourceRoot.type === "note" && target.location === "calendar" ? null : target.courseId,
    parentUnitId: sourceRoot.type === "note" ? null : plan.parentUnitId,
    childOrder: sourceRoot.type === "note" ? null : plan.childOrder
  }));
  const nextWorkspace = { ...workspace, plans: [...workspace.plans, ...normalized] };

  return {
    workspace: nextWorkspace,
    pastedRootId: pastedRoot?.id ?? null,
    // Copy remains reusable. Cut is consumed after one successful paste. Returning
    // this explicitly lets React clear its clipboard state without mutating props.
    nextClipboard: clipboard.mode === "cut" ? null : clipboard
  };
}
