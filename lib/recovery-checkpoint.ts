import type { Workspace } from "./domain";

const RECOVERY_PREFIX = "arc.recovery.checkpoint.v1";

export type RecoveryCheckpoint = {
  createdAt: string;
  label: string;
  workspace: Workspace;
};

function checkpointKey(ownerId: string | null) {
  return `${RECOVERY_PREFIX}:${ownerId ?? "device"}`;
}

export function saveRecoveryCheckpoint(workspace: Workspace, label: string): void {
  if (typeof window === "undefined") return;
  const checkpoint: RecoveryCheckpoint = {
    createdAt: new Date().toISOString(),
    label,
    workspace: structuredClone(workspace)
  };
  window.localStorage.setItem(checkpointKey(workspace.ownerId), JSON.stringify(checkpoint));
}

export function loadRecoveryCheckpoint(ownerId: string | null): RecoveryCheckpoint | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(checkpointKey(ownerId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecoveryCheckpoint;
  } catch {
    return null;
  }
}

export function clearRecoveryCheckpoint(ownerId: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(checkpointKey(ownerId));
}
