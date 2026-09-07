export type ArcObjectKind = 'unit' | 'lesson' | 'note';

export type ArcPlacement =
  | { kind: 'fridge'; x?: number; y?: number }
  | { kind: 'calendar'; date: string; courseId: string };

export type ArcPlanningObject = {
  id: string;
  kind: ArcObjectKind;
  title: string;
  courseId?: string;
  unitId?: string;
  fixed?: boolean;
  spanDays?: number;
  placement: ArcPlacement;
};

export type ArcPlanningState = {
  objects: ArcPlanningObject[];
};

export type ArcMove = {
  id: string;
  before: ArcPlacement;
  after: ArcPlacement;
};

export function findObject(state: ArcPlanningState, id: string) {
  return state.objects.find((object) => object.id === id);
}

export function hasCalendarCollision(
  state: ArcPlanningState,
  id: string,
  date: string,
  courseId: string,
) {
  return state.objects.some((object) =>
    object.id !== id &&
    object.kind !== 'note' &&
    object.placement.kind === 'calendar' &&
    object.placement.date === date &&
    object.placement.courseId === courseId,
  );
}

export function moveObject(
  state: ArcPlanningState,
  id: string,
  after: ArcPlacement,
): { state: ArcPlanningState; move: ArcMove } {
  const current = findObject(state, id);
  if (!current) throw new Error(`Unknown Arc object: ${id}`);

  if (
    after.kind === 'calendar' &&
    hasCalendarCollision(state, id, after.date, after.courseId)
  ) {
    throw new Error('ARC_CALENDAR_COLLISION');
  }

  const before = current.placement;
  return {
    state: {
      ...state,
      objects: state.objects.map((object) =>
        object.id === id ? { ...object, courseId: after.kind === 'calendar' ? after.courseId : object.courseId, placement: after } : object,
      ),
    },
    move: { id, before, after },
  };
}

export function undoMove(state: ArcPlanningState, move: ArcMove): ArcPlanningState {
  return {
    ...state,
    objects: state.objects.map((object) =>
      object.id === move.id ? { ...object, placement: move.before } : object,
    ),
  };
}
