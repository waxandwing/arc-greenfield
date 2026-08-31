import { emptyWorkspace, type Workspace } from "./domain";

const STORAGE_KEY = "arc.greenfield.workspace.v1";

export type SaveDestination = "device" | "arc-account" | "google-drive+arc";

export type SaveState = {
  destination: SaveDestination;
  savedAt: string;
};

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return emptyWorkspace();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyWorkspace();

  try {
    const parsed = JSON.parse(raw) as Workspace;
    if (parsed.schemaVersion !== 1) return emptyWorkspace();
    return parsed;
  } catch {
    return emptyWorkspace();
  }
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
