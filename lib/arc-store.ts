import { create } from "zustand";
import { emptyWorkspace, type PriorityTier, type TaskContext, type Workspace } from "./domain";
import { migrateLegacyPriorities, moveObjectToTaskBar, updateTaskContext } from "./object-lifecycle";
import { movePlanToCalendarDate } from "./plan-operations";
import { collectPlanTree, movePlanTreeToIdeas } from "./plan-tree";
import { canRedo, canUndo, commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace, type WorkspaceHistory } from "./workspace-history";
import { loadWorkspaceResult, saveWorkspace } from "./workspace-store";

export type ArcStore = {
  history: WorkspaceHistory;
  hydrated: boolean;
  recoveryAvailable: boolean;
  selectedObjectId: string | null;
  lastSavedAt: string | null;
  hydrate: () => void;
  commit: (updater: (workspace: Workspace) => Workspace) => void;
  replace: (workspace: Workspace) => void;
  selectObject: (id: string | null) => void;
  sendToFridge: (id: string) => void;
  sendToTaskBar: (id: string, tier: PriorityTier) => void;
  scheduleObject: (id: string, date: string, courseId: string | null) => void;
  patchTaskContext: (id: string, patch: Partial<TaskContext>) => void;
  undo: () => void;
  redo: () => void;
};

function persist(history: WorkspaceHistory): string | null {
  if (typeof window === "undefined") return null;
  return saveWorkspace(history.present).savedAt;
}

export const useArcStore = create<ArcStore>((set, get) => ({
  history: createWorkspaceHistory(emptyWorkspace()),
  hydrated: false,
  recoveryAvailable: false,
  selectedObjectId: null,
  lastSavedAt: null,

  hydrate() {
    const loaded = loadWorkspaceResult();
    const workspace = migrateLegacyPriorities(loaded.workspace);
    const history = createWorkspaceHistory(workspace);

    // If the active payload is unreadable, workspace-store has quarantined the
    // original raw data. Do NOT auto-save the empty fallback over the active key.
    const recoveryAvailable = loaded.status === "recovery-needed";
    const lastSavedAt = recoveryAvailable ? null : persist(history);
    set({ history, hydrated: true, recoveryAvailable, lastSavedAt });
  },

  commit(updater) {
    const current = get().history;
    const nextWorkspace = {
      ...updater(current.present),
      updatedAt: new Date().toISOString()
    };
    const nextHistory = commitWorkspace(current, nextWorkspace);
    const lastSavedAt = persist(nextHistory);
    set({ history: nextHistory, lastSavedAt });
  },

  replace(workspace) {
    const current = get().history;
    const nextWorkspace = { ...workspace, updatedAt: new Date().toISOString() };
    const nextHistory = commitWorkspace(current, nextWorkspace);
    const lastSavedAt = persist(nextHistory);
    set({ history: nextHistory, lastSavedAt });
  },

  selectObject(id) {
    set({ selectedObjectId: id });
  },

  sendToFridge(id) {
    get().commit((workspace) => ({
      ...workspace,
      plans: movePlanTreeToIdeas(workspace.plans, id)
    }));
  },

  sendToTaskBar(id, tier) {
    get().commit((workspace) => {
      const treeIds = new Set(collectPlanTree(workspace.plans, id).map((plan) => plan.id));
      return {
        ...workspace,
        plans: workspace.plans.map((plan) => treeIds.has(plan.id) ? moveObjectToTaskBar(plan, tier) : plan)
      };
    });
  },

  scheduleObject(id, date, courseId) {
    // Scheduling without a class is not a valid calendar placement. More
    // importantly, the guarded movement engine owns fixed-date protection.
    if (!courseId) return;
    get().commit((workspace) => ({
      ...workspace,
      plans: movePlanToCalendarDate(workspace.plans, id, date, courseId)
    }));
  },

  patchTaskContext(id, patch) {
    get().commit((workspace) => ({
      ...workspace,
      plans: workspace.plans.map((plan) => plan.id === id ? updateTaskContext(plan, patch) : plan)
    }));
  },

  undo() {
    const current = get().history;
    if (!canUndo(current)) return;
    const next = undoWorkspace(current);
    const lastSavedAt = persist(next);
    set({ history: next, selectedObjectId: null, lastSavedAt });
  },

  redo() {
    const current = get().history;
    if (!canRedo(current)) return;
    const next = redoWorkspace(current);
    const lastSavedAt = persist(next);
    set({ history: next, selectedObjectId: null, lastSavedAt });
  }
}));
