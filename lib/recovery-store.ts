import type { Workspace } from "./domain";

const RECOVERY_KEY = "arc.greenfield.recovery.undo.v1";

export type RecoveryCheckpoint = {
  createdAt: string;
  label: string;
  workspace: Workspace;
};

export function saveRecoveryCheckpoint(workspace: Workspace, label: string) {
  if (typeof window === "undefined") return;
  const checkpoint: RecoveryCheckpoint = {
    createdAt: new Date().toISOString(),
    label,
    workspace
  };
  window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(checkpoint));
}

export function loadRecoveryCheckpoint(): RecoveryCheckpoint | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RECOVERY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecoveryCheckpoint;
  } catch {
    return null;
  }
}

export function clearRecoveryCheckpoint() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECOVERY_KEY);
}
