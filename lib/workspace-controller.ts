import type { Workspace } from "./domain";
import type { WorkspaceHistory } from "./workspace-history";
import { commitWorkspace, redoWorkspace, undoWorkspace } from "./workspace-history";
import {
  moveWorkspacePlanToCalendar,
  moveWorkspacePlanToIdeas
} from "./workspace-plan-operations";

export type WorkspaceCommand =
  | { type: "plan.move-to-ideas"; planId: string }
  | { type: "plan.move-to-calendar"; planId: string; date: string; courseId: string };

function applyCommand(workspace: Workspace, command: WorkspaceCommand): Workspace {
  switch (command.type) {
    case "plan.move-to-ideas":
      return moveWorkspacePlanToIdeas(workspace, command.planId);
    case "plan.move-to-calendar":
      return moveWorkspacePlanToCalendar(workspace, command.planId, command.date, command.courseId);
  }
}

/**
 * Single mutation owner for canonical workspace commands.
 * One command equals one history entry. Persistence subscribes to history.present;
 * UI components never persist or directly edit Plan fields.
 */
export function dispatchWorkspaceCommand(
  history: WorkspaceHistory,
  command: WorkspaceCommand
): WorkspaceHistory {
  const next = applyCommand(history.present, command);
  if (next === history.present) return history;
  return commitWorkspace(history, {
    ...next,
    updatedAt: new Date().toISOString()
  });
}

export function undoWorkspaceCommand(history: WorkspaceHistory): WorkspaceHistory {
  return undoWorkspace(history);
}

export function redoWorkspaceCommand(history: WorkspaceHistory): WorkspaceHistory {
  return redoWorkspace(history);
}
