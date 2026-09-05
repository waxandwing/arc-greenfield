import type { Workspace } from "./domain";
import { repairOrphanedCoursePlans } from "./course-operations";

export type WorkspaceHistory = {
  past: Workspace[];
  present: Workspace;
  future: Workspace[];
};

const HISTORY_LIMIT = 50;

function snapshot(workspace: Workspace): Workspace {
  return structuredClone(workspace);
}

function semanticWorkspace(workspace: Workspace): Workspace {
  // updatedAt is persistence metadata, not a user-visible planning mutation.
  // Ignoring it here prevents rejected/no-op actions from polluting Undo.
  return { ...workspace, updatedAt: "" };
}

export function workspacesSemanticallyEqual(a: Workspace, b: Workspace): boolean {
  return JSON.stringify(semanticWorkspace(a)) === JSON.stringify(semanticWorkspace(b));
}

export function createWorkspaceHistory(workspace: Workspace): WorkspaceHistory {
  return { past: [], present: snapshot(repairOrphanedCoursePlans(workspace)), future: [] };
}

export function commitWorkspace(history: WorkspaceHistory, next: Workspace): WorkspaceHistory {
  const repaired = repairOrphanedCoursePlans(next);
  if (workspacesSemanticallyEqual(history.present, repaired)) return history;

  const past = [...history.past, snapshot(history.present)].slice(-HISTORY_LIMIT);
  return { past, present: snapshot(repaired), future: [] };
}

export function undoWorkspace(history: WorkspaceHistory): WorkspaceHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: snapshot(previous),
    future: [snapshot(history.present), ...history.future].slice(0, HISTORY_LIMIT)
  };
}

export function redoWorkspace(history: WorkspaceHistory): WorkspaceHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, snapshot(history.present)].slice(-HISTORY_LIMIT),
    present: snapshot(next),
    future: history.future.slice(1)
  };
}

export function canUndo(history: WorkspaceHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: WorkspaceHistory): boolean {
  return history.future.length > 0;
}
