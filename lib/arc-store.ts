import { create } from "zustand";
import { emptyWorkspace, type PriorityTier, type TaskContext, type Workspace } from "./domain";
import { canRedo, canUndo, commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace, type WorkspaceHistory } from "./workspace-history";
import { loadWorkspace, saveWorkspace } from "./workspace-store";
import { moveObjectToCalendar, moveObjectToFridge, moveObjectToTaskBar, updateTaskContext, type ArcPlanningObject } from "./object-lifecycle";

export type ArcStore = {
  history: WorkspaceHistory;
  hydrated: boolean;
  selectedObjectId: string | null;
  hydrate: () => void;
  commit: (updater: (workspace: Workspace) => Workspace) => void;
  selectObject: (id: string | null) => void;
  sendToFridge: (id: string) => void;
  sendToTaskBar: (id: string, tier: PriorityTier) => void;
  scheduleObject: (id: string, date: string, courseId: string | null) => void;
  patchTaskContext: (id: string, patch: Partial<TaskContext>) => void;
  undo: () => void;
  redo: () => void;
};

function replacePlan(workspace: Workspace, id: string, updater: (plan: ArcPlanningObject) => ArcPlanningObject): Workspace {
  return {
    ...workspace,
    plans: workspace.plans.map((plan) => plan.id === id ? updater(plan as ArcPlanningObject) : plan)
  };
}

function persist(history: WorkspaceHistory) {
  if (typeof window !== "undefined") saveWorkspace(history.present);
}

export const useArcStore = create<ArcStore>((set, get) => ({
  history: createWorkspaceHistory(emptyWorkspace()),
  hydrated: false,
  selectedObjectId: null,

  hydrate() {
    const workspace = loadWorkspace();
    set({ history: createWorkspaceHistory(workspace), hydrated: true });
  },

  commit(updater) {
    const current = get().history;
    const nextWorkspace = {
      ...updater(current.present),
      updatedAt: new Date().toISOString()
    };
    const nextHistory = commitWorkspace(current, nextWorkspace);
    persist(nextHistory);
    set({ history: nextHistory });
  },

  selectObject(id) {
    set({ selectedObjectId: id });
  },

  sendToFridge(id) {
    get().commit((workspace) => replacePlan(workspace, id, moveObjectToFridge));
  },

  sendToTaskBar(id, tier) {
    get().commit((workspace) => replacePlan(workspace, id, (plan) => moveObjectToTaskBar(plan, tier)));
  },

  scheduleObject(id, date, courseId) {
    get().commit((workspace) => replacePlan(workspace, id, (plan) => moveObjectToCalendar(plan, { date, courseId })));
  },

  patchTaskContext(id, patch) {
    get().commit((workspace) => replacePlan(workspace, id, (plan) => updateTaskContext(plan, patch)));
  },

  undo() {
    const current = get().history;
    if (!canUndo(current)) return;
    const next = undoWorkspace(current);
    persist(next);
    set({ history: next, selectedObjectId: null });
  },

  redo() {
    const current = get().history;
    if (!canRedo(current)) return;
    const next = redoWorkspace(current);
    persist(next);
    set({ history: next, selectedObjectId: null });
  }
}));
