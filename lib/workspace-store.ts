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

const HELP_PREFERENCE_KEYS = [
  "helpMarksVisible",
  "firstTimeHelpEnabled",
  "exploredHelpIds",
  "exploreWelcomeDismissed"
] as const;

function migrateWorkspace(parsed: Workspace | WorkspaceV1): Workspace {
  const defaults = emptyWorkspace();
  const migratedPlans = parsed.schemaVersion === 1
    ? parsed.plans.map((plan) => ({ ...plan, endDate: null }))
    : parsed.plans;
  const existingPreferences = parsed.preferences ?? defaults.preferences;
  const collapsedUnitIds = parsed.schemaVersion === 1
    ? []
    : parsed.preferences.collapsedUnitIds ?? [];

  return {
    ...defaults,
    ...parsed,
    schemaVersion: 2,
    calendar: { ...defaults.calendar, ...parsed.calendar },
    plans: migratedPlans,
    preferences: {
      ...defaults.preferences,
      ...existingPreferences,
      collapsedUnitIds,
      exploredHelpIds: existingPreferences.exploredHelpIds ?? [],
      // Existing stored workspaces should not suddenly receive a first-visit welcome
      // after this feature ships. New workspaces explicitly store `false` from
      // emptyWorkspace(), so only migrated/older workspaces default to dismissed.
      exploreWelcomeDismissed: existingPreferences.exploreWelcomeDismissed ?? true
    },
    checkpoints: parsed.checkpoints ?? []
  };
}

export function workspaceStorageKey(ownerId: string | null): string {
  return ownerId ? `${OWNER_STORAGE_PREFIX}:${ownerId}` : LEGACY_STORAGE_KEY;
}

function activeOwnerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_OWNER_KEY);
}

function storedHelpState(ownerId: string | null): { updatedAt: string | null; preferences: Partial<Workspace["preferences"]> } {
  if (typeof window === "undefined") return { updatedAt: null, preferences: {} };
  const raw = window.localStorage.getItem(workspaceStorageKey(ownerId));
  if (!raw) return { updatedAt: null, preferences: {} };
  try {
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    const preferences = (parsed.preferences ?? {}) as Partial<Workspace["preferences"]>;
    return {
      updatedAt: parsed.updatedAt ?? null,
      preferences: HELP_PREFERENCE_KEYS.reduce((result, key) => {
        const value = preferences[key];
        if (value !== undefined) (result as Record<string, unknown>)[key] = value;
        return result;
      }, {} as Partial<Workspace["preferences"]>)
    };
  } catch {
    return { updatedAt: null, preferences: {} };
  }
}

function isNewer(storedAt: string | null, incomingAt: string | null | undefined): boolean {
  if (!storedAt) return false;
  const storedTime = Date.parse(storedAt);
  const incomingTime = incomingAt ? Date.parse(incomingAt) : Number.NaN;
  if (Number.isNaN(storedTime)) return false;
  if (Number.isNaN(incomingTime)) return true;
  return storedTime > incomingTime;
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
  const stored = storedHelpState(resolvedOwnerId ?? null);
  const preserveNewerStoredHelp = isNewer(stored.updatedAt, workspace.updatedAt);
  const next = {
    ...workspace,
    ownerId: resolvedOwnerId ?? null,
    preferences: preserveNewerStoredHelp
      ? { ...workspace.preferences, ...stored.preferences }
      : workspace.preferences,
    updatedAt: savedAt
  };
  window.localStorage.setItem(workspaceStorageKey(resolvedOwnerId ?? null), JSON.stringify(next));
  return { destination: "device", savedAt };
}

export function clearWorkspace(ownerId?: string | null): void {
  const resolvedOwnerId = ownerId === undefined ? activeOwnerId() : ownerId;
  window.localStorage.removeItem(workspaceStorageKey(resolvedOwnerId ?? null));
}
