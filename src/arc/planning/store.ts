import type { ArcPlanningState } from './model';

export const ARC_PLANNING_STORAGE_KEY = 'arc-b01-planning-state-v1';

export function loadPlanningState(storage: Pick<Storage, 'getItem'> = window.localStorage): ArcPlanningState {
  const raw = storage.getItem(ARC_PLANNING_STORAGE_KEY);
  if (!raw) return { objects: [] };
  try {
    const parsed = JSON.parse(raw) as ArcPlanningState;
    return Array.isArray(parsed?.objects) ? parsed : { objects: [] };
  } catch {
    return { objects: [] };
  }
}

export function savePlanningState(
  state: ArcPlanningState,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  storage.setItem(ARC_PLANNING_STORAGE_KEY, JSON.stringify(state));
}
