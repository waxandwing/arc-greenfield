import type { ArcView, Plan, PlanLocation, PlanType, PriorityTier, Workspace } from "./domain";
import { deletePlanTree, orderedUnitChildren } from "./plan-tree";
import {
  deletePriority,
  movePriority,
  renamePriority,
  reorderPriority
} from "./priority-operations";
import {
  moveWorkspacePlanToCalendar,
  moveWorkspacePlanToIdeas
} from "./workspace-plan-operations";
import type { WorkspaceHistory } from "./workspace-history";
import { commitWorkspace, redoWorkspace, undoWorkspace } from "./workspace-history";

export type WorkspaceCommand =
  | {
      type: "plan.create";
      id: string;
      title: string;
      planType: PlanType;
      courseId: string | null;
      date: string | null;
      location: PlanLocation;
    }
  | { type: "plan.add-child"; id: string; unitId: string; title: string }
  | { type: "plan.rename"; planId: string; title: string }
  | { type: "plan.delete"; planId: string }
  | { type: "plan.move-to-ideas"; planId: string }
  | { type: "plan.move-to-calendar"; planId: string; date: string; courseId: string }
  | { type: "unit.toggle-collapsed"; unitId: string }
  | { type: "priority.add"; id: string; tier: PriorityTier; title: string; scope?: "school" | "personal" }
  | { type: "priority.toggle"; priorityId: string }
  | { type: "priority.rename"; priorityId: string; title: string }
  | { type: "priority.delete"; priorityId: string }
  | { type: "priority.move"; priorityId: string; tier: PriorityTier }
  | { type: "priority.reorder"; priorityId: string; direction: -1 | 1 };

function createPlan(
  id: string,
  planType: PlanType,
  title: string,
  courseId: string | null,
  date: string | null,
  location: PlanLocation,
  parentUnitId: string | null = null,
  childOrder: number | null = null
): Plan {
  return {
    id,
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

function applyCommand(workspace: Workspace, command: WorkspaceCommand): Workspace {
  switch (command.type) {
    case "plan.create": {
      const title = command.title.trim();
      if (!title || workspace.plans.some((plan) => plan.id === command.id)) return workspace;
      const plan = createPlan(
        command.id,
        command.planType,
        title,
        command.courseId,
        command.date,
        command.location
      );
      return { ...workspace, plans: [...workspace.plans, plan] };
    }

    case "plan.add-child": {
      const title = command.title.trim();
      const unit = workspace.plans.find((plan) => plan.id === command.unitId && plan.type === "unit");
      if (!title || !unit || workspace.plans.some((plan) => plan.id === command.id)) return workspace;
      const lesson = createPlan(
        command.id,
        "lesson",
        title,
        unit.courseId,
        unit.date,
        unit.location,
        unit.id,
        orderedUnitChildren(workspace.plans, unit.id).length
      );
      return { ...workspace, plans: [...workspace.plans, lesson] };
    }

    case "plan.rename": {
      const title = command.title.trim();
      const plan = workspace.plans.find((item) => item.id === command.planId);
      if (!plan || !title || plan.title === title) return workspace;
      return {
        ...workspace,
        plans: workspace.plans.map((item) => item.id === command.planId ? { ...item, title } : item)
      };
    }

    case "plan.delete":
      return workspace.plans.some((plan) => plan.id === command.planId)
        ? { ...workspace, plans: deletePlanTree(workspace.plans, command.planId) }
        : workspace;

    case "plan.move-to-ideas":
      return moveWorkspacePlanToIdeas(workspace, command.planId);

    case "plan.move-to-calendar":
      return moveWorkspacePlanToCalendar(workspace, command.planId, command.date, command.courseId);

    case "unit.toggle-collapsed": {
      if (!workspace.plans.some((plan) => plan.id === command.unitId && plan.type === "unit")) return workspace;
      const collapsed = new Set(workspace.preferences.collapsedUnitIds);
      if (collapsed.has(command.unitId)) collapsed.delete(command.unitId);
      else collapsed.add(command.unitId);
      return {
        ...workspace,
        preferences: { ...workspace.preferences, collapsedUnitIds: [...collapsed] }
      };
    }

    case "priority.add": {
      const title = command.title.trim();
      if (!title || workspace.priorities.some((priority) => priority.id === command.id)) return workspace;
      return {
        ...workspace,
        priorities: [
          ...workspace.priorities,
          {
            id: command.id,
            title,
            tier: command.tier,
            completed: false,
            scope: command.scope ?? "school"
          }
        ]
      };
    }

    case "priority.toggle": {
      const priority = workspace.priorities.find((item) => item.id === command.priorityId);
      if (!priority) return workspace;
      return {
        ...workspace,
        priorities: workspace.priorities.map((item) =>
          item.id === command.priorityId ? { ...item, completed: !item.completed } : item
        )
      };
    }

    case "priority.rename":
      return renamePriority(workspace, command.priorityId, command.title);

    case "priority.delete":
      return deletePriority(workspace, command.priorityId);

    case "priority.move":
      return movePriority(workspace, command.priorityId, command.tier);

    case "priority.reorder":
      return reorderPriority(workspace, command.priorityId, command.direction);
  }
}

/** Persistent content mutation boundary. One meaningful command creates one history entry. */
export function dispatchWorkspaceCommand(
  history: WorkspaceHistory,
  command: WorkspaceCommand
): WorkspaceHistory {
  const next = applyCommand(history.present, command);
  if (next === history.present) return history;
  return commitWorkspace(history, { ...next, updatedAt: new Date().toISOString() });
}

/** Commit a domain-produced replacement, such as a clipboard cut/paste result. */
export function commitWorkspaceReplacement(
  history: WorkspaceHistory,
  next: Workspace
): WorkspaceHistory {
  if (next === history.present) return history;
  return commitWorkspace(history, { ...next, updatedAt: new Date().toISOString() });
}

/** Navigation preference persists but is intentionally not a user-content Undo event. */
export function setLastUsedView(history: WorkspaceHistory, view: ArcView): WorkspaceHistory {
  if (history.present.preferences.lastUsedView === view) return history;
  return {
    ...history,
    present: {
      ...history.present,
      preferences: { ...history.present.preferences, lastUsedView: view },
      updatedAt: new Date().toISOString()
    }
  };
}

function preserveNavigationPreference(previous: WorkspaceHistory, next: WorkspaceHistory): WorkspaceHistory {
  if (next === previous) return previous;
  return setLastUsedView(next, previous.present.preferences.lastUsedView);
}

export function undoWorkspaceCommand(history: WorkspaceHistory): WorkspaceHistory {
  return preserveNavigationPreference(history, undoWorkspace(history));
}

export function redoWorkspaceCommand(history: WorkspaceHistory): WorkspaceHistory {
  return preserveNavigationPreference(history, redoWorkspace(history));
}
