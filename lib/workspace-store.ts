import { emptyWorkspace, type Plan, type Workspace } from "./domain";

const STORAGE_KEY = "arc.greenfield.workspace.v1";
const QUARANTINE_PREFIX = "arc.greenfield.workspace.invalid.";

export type SaveDestination = "device" | "arc-account" | "google-drive+arc";

export type SaveState = {
  destination: SaveDestination;
  savedAt: string;
  ok: boolean;
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

function quarantineInvalidWorkspace(raw: string) {
  try {
    window.localStorage.setItem(`${QUARANTINE_PREFIX}${Date.now()}`, raw);
  } catch {
    // Recovery should never make loading fail harder than the invalid payload already did.
  }
}

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return emptyWorkspace();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyWorkspace();

  try {
    const parsed = JSON.parse(raw) as Workspace | WorkspaceV1;
    if (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) {
      quarantineInvalidWorkspace(raw);
      return emptyWorkspace();
    }
    return migrateWorkspace(parsed);
  } catch {
    quarantineInvalidWorkspace(raw);
    return emptyWorkspace();
  }
}

export function saveWorkspace(workspace: Workspace): SaveState {
  const savedAt = new Date().toISOString();
  const next = { ...workspace, updatedAt: savedAt };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { destination: "device", savedAt, ok: true };
  } catch {
    return { destination: "device", savedAt, ok: false };
  }
}

export function clearWorkspace(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
