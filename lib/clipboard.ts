import type { Plan, PlanLocation, Workspace } from "./domain";
import { clonePlanTree, collectPlanTree } from "./plan-tree";
import { deleteSelection } from "./plan-operations";

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
  location: PlanLocation;
};

export type PasteResult = {
  workspace: Workspace;
  pastedRootId: string | null;
  nextClipboard: ArcClipboard | null;
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

function shiftDate(value: string | null, delta: number) {
  if (!value) return null;
  const date = parseDate(value);
  date.setDate(date.getDate() + delta);
  return formatDate(date);
}

function dateDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export function createClipboard(workspace: Workspace, selectedPlanId: string, mode: ClipboardMode): ArcClipboard | null {
  const selected = workspace.plans.find((plan) => plan.id === selectedPlanId);
  if (!selected) return null;
  const tree = structuredClone(collectPlanTree(workspace.plans, selectedPlanId));
  const normalizedTree = tree.map((plan) => plan.id === selectedPlanId && selected.type !== "unit"
    ? { ...plan, parentUnitId: null, childOrder: null }
    : plan);
  return { mode, sourceRootId: selectedPlanId, sourceCourseId: selected.courseId, sourceDate: selected.date, tree: normalizedTree };
}

export function applyCut(workspace: Workspace, clipboard: ArcClipboard): Workspace {
  if (clipboard.mode !== "cut") return workspace;
  return { ...workspace, plans: deleteSelection(workspace.plans, clipboard.sourceRootId) };
}

function placeCutTree(clipboard: ArcClipboard, target: PasteTarget): Plan[] {
  const root = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!root) return [];
  const targetCourseId = target.courseId ?? clipboard.sourceCourseId;
  const delta = target.location === "calendar" && target.date && root.date ? dateDelta(root.date, target.date) : 0;
  return clipboard.tree.map((plan) => {
    let date = plan.date;
    let endDate = plan.endDate;
    if (target.location === "calendar") {
      date = plan.date ? shiftDate(plan.date, delta) : target.date;
      endDate = plan.endDate ? shiftDate(plan.endDate, delta) : (plan.type === "unit" ? target.date : null);
    }
    return { ...plan, courseId: targetCourseId ?? plan.courseId, date, endDate, location: target.location };
  });
}

export function pasteClipboard(workspace: Workspace, clipboard: ArcClipboard, target: PasteTarget): PasteResult {
  const sourceRoot = clipboard.tree.find((plan) => plan.id === clipboard.sourceRootId);
  if (!sourceRoot) return { workspace, pastedRootId: null, nextClipboard: clipboard };

  if (clipboard.mode === "cut") {
    const treeIds = new Set(clipboard.tree.map((plan) => plan.id));
    const basePlans = workspace.plans.filter((plan) => !treeIds.has(plan.id));
    const placed = placeCutTree(clipboard, target);
    return {
      workspace: { ...workspace, plans: [...basePlans, ...placed] },
      pastedRootId: clipboard.sourceRootId,
      nextClipboard: null
    };
  }

  const targetDate = target.location === "calendar" ? target.date : null;
  const targetCourseId = target.courseId ?? clipboard.sourceCourseId;
  const clones = clonePlanTree(clipboard.tree, clipboard.sourceRootId, targetDate, targetCourseId);
  const pastedRoot = clones.find((plan) => plan.parentUnitId === null) ?? clones[0] ?? null;
  const normalized = clones.map((plan) => ({ ...plan, location: target.location, courseId: targetCourseId ?? plan.courseId }));
  return {
    workspace: { ...workspace, plans: [...workspace.plans, ...normalized] },
    pastedRootId: pastedRoot?.id ?? null,
    nextClipboard: clipboard
  };
}
