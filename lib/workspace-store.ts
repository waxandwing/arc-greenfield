import { emptyWorkspace, type Plan, type Workspace } from "./domain";

const LEGACY_STORAGE_KEY = "arc.greenfield.workspace.v1";
const ACTIVE_OWNER_KEY = "arc.workspace.active-owner.v1";
const OWNER_STORAGE_PREFIX = "arc.workspace.owner.v1";

export type SaveDestination = "device" | "arc-account" | "google-drive+arc";

export type SaveState = {
  destination: SaveDestination;
  savedAt: string;
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

export function workspaceStorageKey(ownerId: string | null): string {
  return ownerId ? `${OWNER_STORAGE_PREFIX}:${ownerId}` : LEGACY_STORAGE_KEY;
}

function activeOwnerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_OWNER_KEY);
}

export function setActiveWorkspaceOwner(ownerId: string | null): void {
  if (typeof window === "undefined") return;
  if (ownerId) window.localStorage.setItem(ACTIVE_OWNER_KEY, ownerId);
  else window.localStorage.removeItem(ACTIVE_OWNER_KEY);
}

export function loadWorkspace(ownerId?: string | null): Workspace {
  const resolvedOwnerId = ownerId === undefined ? activeOwnerId() : ownerId;
  if (typeof window === "undefined") {
    const workspace = emptyWorkspace();
    workspace.ownerId = resolvedOwnerId ?? null;
    return workspace;
  }

  const raw = window.localStorage.getItem(workspaceStorageKey(resolvedOwnerId ?? null));
  if (!raw) {
    const workspace = emptyWorkspace();
    workspace.ownerId = resolvedOwnerId ?? null;
    return workspace;
  }

  try {
    const parsed = JSON.parse(raw) as Workspace | WorkspaceV1;
    if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) {
      const workspace = emptyWorkspace();
      workspace.ownerId = resolvedOwnerId ?? null;
      return workspace;
    }
    const migrated = migrateWorkspace(parsed);
    return resolvedOwnerId ? { ...migrated, ownerId: resolvedOwnerId } : migrated;
  } catch {
    const workspace = emptyWorkspace();
    workspace.ownerId = resolvedOwnerId ?? null;
    return workspace;
  }
}

export function saveWorkspace(workspace: Workspace, ownerId?: string | null): SaveState {
  const savedAt = new Date().toISOString();
  const resolvedOwnerId = ownerId === undefined ? activeOwnerId() ?? workspace.ownerId : ownerId;
  const next = { ...workspace, ownerId: resolvedOwnerId ?? null, updatedAt: savedAt };
  window.localStorage.setItem(workspaceStorageKey(resolvedOwnerId ?? null), JSON.stringify(next));
  return { destination: "device", savedAt };
}

export function clearWorkspace(ownerId?: string | null): void {
  const resolvedOwnerId = ownerId === undefined ? activeOwnerId() : ownerId;
  window.localStorage.removeItem(workspaceStorageKey(resolvedOwnerId ?? null));
}
