import type { Workspace } from "./domain";
import {
  previewInstructionalShift,
  type ShiftPreflight
} from "./efficiency-operations";
import {
  emptyMovementImpactSet,
  type MovementCommand,
  type MovementImpactSet
} from "./continuity-domain";
import { shiftPreflightToImpactSet } from "./movement-impact-adapter";
import { collectPlanTree } from "./plan-tree";

export type PlannedShift = {
  command: MovementCommand;
  impact: MovementImpactSet;
  preflight: ShiftPreflight;
};

export type PlannedPark = {
  command: MovementCommand;
  impact: MovementImpactSet;
};

/**
 * Creates a deterministic, non-mutating Shift plan from the current workspace.
 *
 * The current production data model does not yet have per-object optimistic
 * versions, so `baseVersions` remains empty during this migration seam. The
 * command/impact shape is the contract future pointer/keyboard/menu inputs share.
 * Trace: A2K-EVT-001, A2K-MOV-002, A2K-A11Y-001.
 */
export function planInstructionalShift({
  workspace,
  courseIds,
  fromDate,
  direction = 1,
  actorId = null,
  commandId
}: {
  workspace: Workspace;
  courseIds: string[];
  fromDate: string;
  direction?: 1 | -1;
  actorId?: string | null;
  commandId: string;
}): PlannedShift {
  const preflight = previewInstructionalShift(workspace, courseIds, fromDate, direction);
  const impact = shiftPreflightToImpactSet(workspace, preflight);

  const command: MovementCommand = {
    commandId,
    actorId,
    workspaceId: workspace.id,
    operation: "SHIFT",
    sourceIds: preflight.rootIds,
    target: {
      kind: "calendar",
      date: fromDate,
      sectionId: courseIds.length === 1 ? courseIds[0] : null
    },
    scope: courseIds.length > 1 ? "linked-sections" : "section",
    baseVersions: {},
    options: {
      respectLocks: true,
      includeWeekends: workspace.calendar.weekendsVisible,
      closureOverride: false,
      collisionStrategy: "block",
      partialClassBehavior: "preserve"
    }
  };

  return { command, impact, preflight };
}

/**
 * Plans Park → Fridge without mutating the workspace.
 *
 * Fixed items are protected at the planner boundary. A Unit is treated as a
 * unit-sequence command and its full tree is named in the landing impact so no
 * child can disappear silently.
 * Trace: A2K-MOV-006, A2K-DAT-004/005, A2K-A11Y-001.
 */
export function planParkToFridge({
  workspace,
  sourceId,
  actorId = null,
  commandId
}: {
  workspace: Workspace;
  sourceId: string;
  actorId?: string | null;
  commandId: string;
}): PlannedPark {
  const impact = emptyMovementImpactSet();
  const source = workspace.plans.find((plan) => plan.id === sourceId);
  const tree = source ? collectPlanTree(workspace.plans, sourceId) : [];

  const command: MovementCommand = {
    commandId,
    actorId,
    workspaceId: workspace.id,
    operation: "PARK",
    sourceIds: tree.map((plan) => plan.id),
    target: { kind: "fridge" },
    scope: source?.type === "unit" ? "unit-sequence" : "occurrence",
    baseVersions: {},
    options: {
      respectLocks: true,
      includeWeekends: workspace.calendar.weekendsVisible,
      closureOverride: false,
      collisionStrategy: "block",
      partialClassBehavior: "preserve"
    }
  };

  if (!source) {
    impact.errors.push("The selected plan no longer exists. Nothing was changed.");
    return { command, impact };
  }

  const protectedPlans = tree.filter((plan) => plan.fixedDate);
  if (protectedPlans.length > 0) {
    impact.protected.push(...protectedPlans.map((plan) => ({
      id: plan.id,
      fromDate: plan.date,
      toDate: plan.date,
      label: plan.title
    })));
    impact.errors.push(
      `${protectedPlans.length === 1 ? protectedPlans[0].title : `${protectedPlans.length} fixed items`} must be unlocked before this ${source.type === "unit" ? "Unit" : "plan"} can be parked.`
    );
    return { command, impact };
  }

  impact.landing.push(...tree.map((plan) => ({
    id: plan.id,
    fromDate: plan.date,
    toDate: null,
    label: `${plan.title} → Fridge`
  })));

  if (source.type === "unit" && tree.length > 1) {
    impact.warnings.push(`The Unit and ${tree.length - 1} nested Lesson${tree.length - 1 === 1 ? "" : "s"} will move to the Fridge together.`);
  }

  return { command, impact };
}
