import { emptyWorkspace, type Plan, type Workspace } from "./domain";

const STORAGE_KEY = "arc.greenfield.workspace.v1";
const RECOVERY_KEY = "arc.greenfield.workspace.recovery.v1";

export type SaveDestination = "device" | "arc-account" | "google-drive+arc";

export type SaveState = {
  destination: SaveDestination;
  savedAt: string;
};

export type WorkspaceLoadStatus = "loaded" | "empty" | "recovery-needed";

export type WorkspaceLoadResult = {
  workspace: Workspace;
  status: WorkspaceLoadStatus;
  recoveryRaw: string | null;
};

type WorkspaceV1 = Omit<Workspace, "schemaVersion" | "plans" | "preferences"> & {
  schemaVersion: 1;
  plans: Array<Omit<Plan, "endDate">>;
  preferences: Omit<Workspace["preferences"], "collapsedUnitIds">;
};

function migrateWorkspace(parsed: Workspace | WorkspaceV1): Workspace {
  if (parsed.schemaVersion === 2) return parsed;

  return {
    ...parsed,
    schemaVersion: 2,
    plans: parsed.plans.map((plan) => ({ ...plan, endDate: null })),
    preferences: { ...parsed.preferences, collapsedUnitIds: [] }
  };
}

export function decodeWorkspace(raw: string | null): WorkspaceLoadResult {
  if (!raw) return { workspace: emptyWorkspace(), status: "empty", recoveryRaw: null };

  try {
    const parsed = JSON.parse(raw) as Workspace | WorkspaceV1 | { schemaVersion?: unknown };
    if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) {
      return { workspace: emptyWorkspace(), status: "recovery-needed", recoveryRaw: raw };
    }
    return {
      workspace: migrateWorkspace(parsed as Workspace | WorkspaceV1),
      status: "loaded",
      recoveryRaw: null
    };
  } catch {
    return { workspace: emptyWorkspace(), status: "recovery-needed", recoveryRaw: raw };
  }
}

export function loadWorkspaceResult(): WorkspaceLoadResult {
  if (typeof window === "undefined") return { workspace: emptyWorkspace(), status: "empty", recoveryRaw: null };

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const result = decodeWorkspace(raw);

  if (result.status === "recovery-needed" && result.recoveryRaw) {
    // Keep the original unreadable payload outside the active save key before
    // anything can replace it. Never overwrite an earlier recovery payload.
    if (!window.localStorage.getItem(RECOVERY_KEY)) {
      window.localStorage.setItem(RECOVERY_KEY, result.recoveryRaw);
    }
  }

  return result;
}

/** Backwards-compatible convenience for read-only callers. */
export function loadWorkspace(): Workspace {
  return loadWorkspaceResult().workspace;
}

export function hasWorkspaceRecovery(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(RECOVERY_KEY));
}

export function readWorkspaceRecovery(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(RECOVERY_KEY);
}

export function saveWorkspace(workspace: Workspace): SaveState {
  const savedAt = new Date().toISOString();
  const next = { ...workspace, updatedAt: savedAt };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { destination: "device", savedAt };
}

export function clearWorkspace(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
