import type { Workspace } from "./domain";
import {
  previewInstructionalShift,
  type ShiftPreflight
} from "./efficiency-operations";
import {
  type MovementCommand,
  type MovementImpactSet
} from "./continuity-domain";
import { shiftPreflightToImpactSet } from "./movement-impact-adapter";

export type PlannedShift = {
  command: MovementCommand;
  impact: MovementImpactSet;
  preflight: ShiftPreflight;
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
