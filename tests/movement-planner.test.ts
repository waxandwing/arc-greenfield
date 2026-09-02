import test from "node:test";
import assert from "node:assert/strict";
import { planInstructionalShift } from "../lib/movement-planner";
import { veteranArtTeacherWeekFixture } from "./fixtures/veteran-art-teacher-week";

test("planning a Shift returns command plus impact without mutating the workspace", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const before = structuredClone(workspace);

  const planned = planInstructionalShift({
    workspace,
    courseIds: ["three-d-art-p6"],
    fromDate: "2026-09-14",
    commandId: "cmd-shift-1"
  });

  assert.deepEqual(workspace, before);
  assert.equal(planned.command.commandId, "cmd-shift-1");
  assert.equal(planned.command.operation, "SHIFT");
  assert.equal(planned.command.workspaceId, workspace.id);
  assert.equal(planned.command.scope, "section");
  assert.equal(planned.command.options.respectLocks, true);
  assert.ok(planned.impact.shifted.some((item) => item.id === "three-d-slot-joints"));
});

test("planning a blocked Shift returns explanatory impact rather than partial mutation", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const planned = planInstructionalShift({
    workspace,
    courseIds: ["studio-art-p2"],
    fromDate: "2026-09-14",
    commandId: "cmd-shift-2"
  });

  assert.ok(planned.preflight.blockedRootIds.includes("studio-seeing-drawing"));
  assert.ok(planned.impact.protected.some((item) => item.id === "studio-portfolio-check"));
  assert.equal(planned.impact.shifted.some((item) => item.id === "studio-contour"), false);
});

test("multi-section planning declares linked-section scope instead of inferring it silently", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const planned = planInstructionalShift({
    workspace,
    courseIds: ["studio-art-p2", "ap-art-history-p4"],
    fromDate: "2026-09-14",
    commandId: "cmd-shift-3"
  });

  assert.equal(planned.command.scope, "linked-sections");
  assert.equal(planned.command.target.kind, "calendar");
  if (planned.command.target.kind === "calendar") assert.equal(planned.command.target.sectionId, null);
});
