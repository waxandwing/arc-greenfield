import type { Plan } from "./domain";

/**
 * Phase 1 continuity-domain seam.
 *
 * These types sit alongside the current Plan model while the live calendar is
 * migrated vertically. They are intentionally not wired as a second source of
 * truth. Trace: A2K-DAT-001, A2K-EVT-001, A2K-GATE-001.
 */

export type OccurrenceState =
  | "UNCOMMITTED"
  | "PLANNED"
  | "PREVIEWING"
  | "PARTIAL"
  | "TAUGHT"
  | "SKIPPED"
  | "PARKED"
  | "ARCHIVED";

export type InstructionalOccurrence = {
  occurrenceId: string;
  lessonId: string;
  /** Transitional: current Arc Course is serving as the section identity. */
  sectionId: string | null;
  plannedDate: string | null;
  actualDate: string | null;
  state: OccurrenceState;
  protected: boolean;
  version: number;
  sourcePlanId: string;
};

export type MovementVerb =
  | "PARK"
  | "PLACE"
  | "NEST"
  | "STRETCH"
  | "SPLIT"
  | "SHIFT"
  | "SKIP"
  | "PIN"
  | "PULL"
  | "SWAP"
  | "RESTORE";

export type MovementScope =
  | "occurrence"
  | "section"
  | "linked-sections"
  | "unit-sequence";

export type MovementTarget =
  | { kind: "calendar"; date: string; sectionId: string | null }
  | { kind: "fridge" }
  | { kind: "unit"; unitId: string; position?: number };

export type MovementOptions = {
  respectLocks: boolean;
  includeWeekends: boolean;
  closureOverride: boolean;
  collisionStrategy: "block" | "park-displaced" | "shift-sequence";
  partialClassBehavior: "preserve" | "continue" | "park";
};

export type MovementCommand = {
  commandId: string;
  actorId: string | null;
  workspaceId: string;
  operation: MovementVerb;
  sourceIds: string[];
  target: MovementTarget;
  scope: MovementScope;
  baseVersions: Record<string, number>;
  options: MovementOptions;
  reason?: string;
};

export type ImpactItem = {
  id: string;
  fromDate: string | null;
  toDate: string | null;
  label?: string;
};

export type MovementImpactSet = {
  landing: ImpactItem[];
  shifted: ImpactItem[];
  protected: ImpactItem[];
  displaced: ImpactItem[];
  skipped: ImpactItem[];
  unchanged: ImpactItem[];
  warnings: string[];
  errors: string[];
};

export type ArcOperation = {
  operationId: string;
  command: MovementCommand;
  actorId: string | null;
  workspaceId: string;
  committedAt: string;
  impact: MovementImpactSet;
  parentOperationId: string | null;
  reversesOperationId: string | null;
};

export function emptyMovementImpactSet(): MovementImpactSet {
  return {
    landing: [],
    shifted: [],
    protected: [],
    displaced: [],
    skipped: [],
    unchanged: [],
    warnings: [],
    errors: []
  };
}

/**
 * Transitional adapter used only for migration/tests while the current Plan
 * object still combines content and schedule state. It deliberately derives a
 * stable occurrence identity from the Plan ID, never from the date, so moving a
 * Lesson does not create a new occurrence identity (A2K-DAT-002).
 */
export function legacyPlanToOccurrence(plan: Plan): InstructionalOccurrence | null {
  if (plan.type !== "lesson") return null;

  const taught = plan.details.taught === "true";
  let state: OccurrenceState;
  if (taught) state = "TAUGHT";
  else if (plan.location === "fridge" && plan.date) state = "PARKED";
  else if (!plan.date || plan.location === "fridge") state = "UNCOMMITTED";
  else state = "PLANNED";

  return {
    occurrenceId: `legacy-occurrence:${plan.id}`,
    lessonId: plan.id,
    sectionId: plan.courseId,
    plannedDate: plan.date,
    actualDate: taught ? (plan.details.taughtOn || plan.date) : null,
    state,
    protected: plan.fixedDate,
    version: 1,
    sourcePlanId: plan.id
  };
}
