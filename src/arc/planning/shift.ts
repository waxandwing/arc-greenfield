import type { ArcPlanningObject, ArcPlanningState } from './model';

export type InstructionalCalendar = {
  isInstructionalDate(date: string): boolean;
};

export type ShiftChange = {
  id: string;
  beforeDate: string;
  afterDate: string;
};

export type ShiftPreview = {
  changes: ShiftChange[];
  skippedFixedIds: string[];
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, delta: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + delta);
  return toIsoDate(next);
}

export function nextInstructionalDate(
  date: string,
  direction: 1 | -1,
  calendar: InstructionalCalendar,
) {
  let candidate = date;
  for (let attempts = 0; attempts < 370; attempts += 1) {
    candidate = addDays(candidate, direction);
    if (calendar.isInstructionalDate(candidate)) return candidate;
  }
  throw new Error('ARC_NO_INSTRUCTIONAL_DATE');
}

export function previewShift(
  state: ArcPlanningState,
  ids: string[],
  direction: 1 | -1,
  calendar: InstructionalCalendar,
): ShiftPreview {
  const selected = new Set(ids);
  const changes: ShiftChange[] = [];
  const skippedFixedIds: string[] = [];

  for (const object of state.objects) {
    if (!selected.has(object.id) || object.placement.kind !== 'calendar') continue;
    if (object.fixed) {
      skippedFixedIds.push(object.id);
      continue;
    }
    changes.push({
      id: object.id,
      beforeDate: object.placement.date,
      afterDate: nextInstructionalDate(object.placement.date, direction, calendar),
    });
  }

  return { changes, skippedFixedIds };
}

export function applyShift(
  state: ArcPlanningState,
  preview: ShiftPreview,
): ArcPlanningState {
  const byId = new Map(preview.changes.map((change) => [change.id, change]));
  return {
    ...state,
    objects: state.objects.map((object): ArcPlanningObject => {
      const change = byId.get(object.id);
      if (!change || object.placement.kind !== 'calendar') return object;
      return {
        ...object,
        placement: { ...object.placement, date: change.afterDate },
      };
    }),
  };
}

export function undoShift(
  state: ArcPlanningState,
  preview: ShiftPreview,
): ArcPlanningState {
  const byId = new Map(preview.changes.map((change) => [change.id, change]));
  return {
    ...state,
    objects: state.objects.map((object): ArcPlanningObject => {
      const change = byId.get(object.id);
      if (!change || object.placement.kind !== 'calendar') return object;
      return {
        ...object,
        placement: { ...object.placement, date: change.beforeDate },
      };
    }),
  };
}
