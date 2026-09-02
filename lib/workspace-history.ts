import type { Workspace } from "./domain";
import { repairOrphanedCoursePlans } from "./course-operations";
import { saveWorkspace } from "./workspace-store";

export type WorkspaceHistory = {
  past: Workspace[];
  present: Workspace;
  future: Workspace[];
};

const HISTORY_LIMIT = 50;

function snapshot(workspace: Workspace): Workspace {
  return structuredClone(workspace);
}

function persistBrowserWorkspace(workspace: Workspace): void {
  if (typeof window === "undefined") return;
  saveWorkspace(workspace);
}

export function createWorkspaceHistory(workspace: Workspace): WorkspaceHistory {
  return { past: [], present: snapshot(repairOrphanedCoursePlans(workspace)), future: [] };
}

export function commitWorkspace(history: WorkspaceHistory, next: Workspace): WorkspaceHistory {
  const past = [...history.past, snapshot(history.present)].slice(-HISTORY_LIMIT);
  const repaired = repairOrphanedCoursePlans(next);
  const present = snapshot(repaired);
  persistBrowserWorkspace(present);
  return { past, present, future: [] };
}

export function undoWorkspace(history: WorkspaceHistory): WorkspaceHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  const next = {
    past: history.past.slice(0, -1),
    present: snapshot(previous),
    future: [snapshot(history.present), ...history.future].slice(0, HISTORY_LIMIT)
  };
  persistBrowserWorkspace(next.present);
  return next;
}

export function redoWorkspace(history: WorkspaceHistory): WorkspaceHistory {
  const nextWorkspace = history.future[0];
  if (!nextWorkspace) return history;
  const next = {
    past: [...history.past, snapshot(history.present)].slice(-HISTORY_LIMIT),
    present: snapshot(nextWorkspace),
    future: history.future.slice(1)
  };
  persistBrowserWorkspace(next.present);
  return next;
}

export function canUndo(history: WorkspaceHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: WorkspaceHistory): boolean {
  return history.future.length > 0;
}
