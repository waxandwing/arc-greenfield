import type { ArcPlanningState } from './model';

export type ArcHistoryEntry = {
  label: string;
  before: ArcPlanningState;
  after: ArcPlanningState;
};

export type ArcHistory = {
  past: ArcHistoryEntry[];
  future: ArcHistoryEntry[];
};

export function pushHistory(history: ArcHistory, entry: ArcHistoryEntry): ArcHistory {
  return { past: [...history.past, entry], future: [] };
}

export function undoHistory(history: ArcHistory) {
  const entry = history.past[history.past.length - 1];
  if (!entry) return { history, state: null as ArcPlanningState | null };
  return {
    state: entry.before,
    history: {
      past: history.past.slice(0, -1),
      future: [entry, ...history.future],
    },
  };
}

export function redoHistory(history: ArcHistory) {
  const [entry, ...future] = history.future;
  if (!entry) return { history, state: null as ArcPlanningState | null };
  return {
    state: entry.after,
    history: {
      past: [...history.past, entry],
      future,
    },
  };
}
