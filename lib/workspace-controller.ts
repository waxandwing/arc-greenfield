import type { Plan, PlanLocation, PlanType, PriorityTier, Workspace } from "./domain";
import { deletePlanTree, orderedUnitChildren } from "./plan-tree";
import {
  deletePriority,
  movePriority,
  renamePriority,
  reorderPriority
} from "./priority-operations";
import type { WorkspaceHistory } from "./workspace-history";
import { commitWorkspace, redoWorkspace, undoWorkspace } from "./workspace-history";
import {
  moveWorkspacePlanToCalendar,
  moveWorkspacePlanToIdeas
} from "./workspace-plan-operations";

export type WorkspaceCommand =
  | {
      type: "plan.create";
      title: string;
      planType: PlanType;
      courseId: string | null;
      date: string | null;
      location: PlanLocation;
    }
  | { type: "plan.add-child"; unitId: string; title: string }
  | { type: "plan.rename"; planId: string; title: string }
  | { type: "plan.delete"; planId: string }
  | { type: "plan.move-to-ideas"; planId: string }
  | { type: "plan.move-to-calendar"; planId: string; date: string; courseId: string }
  | { type: "unit.toggle-collapsed"; unitId: string }
  | { type: "priority.add"; tier: PriorityTier; title: string; scope?: "school" | "personal" }
  | { type: "priority.toggle"; priorityId: string }
  | { type: "priority.rename"; priorityId: string; title: string }
  | { type: "priority.delete"; priorityId: string }
  | { type: "priority.move"; priorityId: string; tier: PriorityTier }
  | { type: "priority.reorder"; priorityId: string; direction: -1 | 1 };

export type WorkspaceDispatchResult = {
  history: WorkspaceHistory;
  createdId: string | null;
};

function createPlan(
  planType: PlanType,
  title: string,
  courseId: string | null,
  date: string | null,
  location: PlanLocation,
  parentUnitId: string | null = null,
  childOrder: number | null = null
): Plan {
  return {
    id: crypto.randomUUID(),
    type: planType,
    title,
    courseId,
    date,
    endDate: planType === "unit" ? date : null,
    location,
    parentUnitId,
    childOrder,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {}
  };
}

function applyCommand(
  workspace: Workspace,
  command: WorkspaceCommand
): { workspace: Workspace; createdId: string | null } {
  switch (command.type) {
    case "plan.create": { const title = command.title.trim(); if (!title) return { workspace, createdId: null }; const plan = createPlan(command.planType, title, command.courseId, command.date, command.location); return { workspace: { ...workspace, plans: [...workspace.plans, plan] }, createdId: plan.id }; }
    case "plan.add-child": { const title = command.title.trim(); if (!title) return { workspace, createdId: null }; const unit = workspace.plans.find((plan) => plan.id === command.unitId && plan.type === "unit"); if (!unit) return { workspace, createdId: null }; const lesson = createPlan("lesson", title, unit.courseId, unit.date, unit.location, unit.id, orderedUnitChildren(workspace.plans, unit.id).length); return { workspace: { ...workspace, plans: [...workspace.plans, lesson] }, createdId: lesson.id }; }
    case "plan.rename": { const title = command.title.trim(); const plan = workspace.plans.find((item) => item.id === command.planId); if (!plan || !title || plan.title === title) return { workspace, createdId: null }; return { workspace: { ...workspace, plans: workspace.plans.map((item) => item.id === command.planId ? { ...item, title } : item) }, createdId: null }; }
    case "plan.delete": { if (!workspace.plans.some((plan) => plan.id === command.planId)) return { workspace, createdId: null }; return { workspace: { ...workspace, plans: deletePlanTree(workspace.plans, command.planId) }, createdId: null }; }
    case "plan.move-to-ideas": return { workspace: moveWorkspacePlanToIdeas(workspace, command.planId), createdId: null };
    case "plan.move-to-calendar": return { workspace: moveWorkspacePlanToCalendar(workspace, command.planId, command.date, command.courseId), createdId: null };
    case "unit.toggle-collapsed": { if (!workspace.plans.some((plan) => plan.id === command.unitId && plan.type === "unit")) return { workspace, createdId: null }; const collapsed = new Set(workspace.preferences.collapsedUnitIds); if (collapsed.has(command.unitId)) collapsed.delete(command.unitId); else collapsed.add(command.unitId); return { workspace: { ...workspace, preferences: { ...workspace.preferences, collapsedUnitIds: [...collapsed] } }, createdId: null }; }
    case "priority.add": { const title = command.title.trim(); if (!title) return { workspace, createdId: null }; const id = crypto.randomUUID(); return { workspace: { ...workspace, priorities: [...workspace.priorities, { id, title, tier: command.tier, completed: false, scope: command.scope ?? "school" }] }, createdId: id }; }
    case "priority.toggle": { const priority = workspace.priorities.find((item) => item.id === command.priorityId); if (!priority) return { workspace, createdId: null }; return { workspace: { ...workspace, priorities: workspace.priorities.map((item) => item.id === command.priorityId ? { ...item, completed: !item.completed } : item) }, createdId: null }; }
    case "priority.rename": return { workspace: renamePriority(workspace, command.priorityId, command.title), createdId: null };
    case "priority.delete": return { workspace: deletePriority(workspace, command.priorityId), createdId: null };
    case "priority.move": return { workspace: movePriority(workspace, command.priorityId, command.tier), createdId: null };
    case "priority.reorder": return { workspace: reorderPriority(workspace, command.priorityId, command.direction), createdId: null };
  }
}

/**
 * Canonical mutation boundary for persistent Arc workspace state.
 * One meaningful command creates one history entry. No-op commands create none.
 */
export function dispatchWorkspaceCommand(
  history: WorkspaceHistory,
  command: WorkspaceCommand
): WorkspaceDispatchResult {
  const result = applyCommand(history.present, command);
  if (result.workspace === history.present) return { history, createdId: result.createdId };
  return {
    history: commitWorkspace(history, { ...result.workspace, updatedAt: new Date().toISOString() }),
    createdId: result.createdId
  };
}

/** Commit a domain-produced workspace replacement (for example clipboard paste/cut). */
export function commitWorkspaceReplacement(
  history: WorkspaceHistory,
  next: Workspace
): WorkspaceHistory {
  if (next === history.present) return history;
  return commitWorkspace(history, { ...next, updatedAt: new Date().toISOString() });
}

export const undoWorkspaceCommand = undoWorkspace;
export const redoWorkspaceCommand = redoWorkspace;
