import test from "node:test";
import assert from "node:assert/strict";
import { planInstructionalShift, planParkToFridge } from "../lib/movement-planner";
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

test("Park preview keeps a Unit tree together and does not mutate it", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const before = structuredClone(workspace);
  const planned = planParkToFridge({
    workspace,
    sourceId: "three-d-paper-structure",
    commandId: "cmd-park-1"
  });

  assert.deepEqual(workspace, before);
  assert.equal(planned.command.operation, "PARK");
  assert.equal(planned.command.scope, "unit-sequence");
  assert.deepEqual(planned.command.sourceIds, ["three-d-paper-structure", "three-d-slot-joints"]);
  assert.equal(planned.impact.errors.length, 0);
  assert.equal(planned.impact.landing.length, 2);
  assert.ok(planned.impact.warnings.some((message) => /move to the Fridge together/i.test(message)));
});

test("Park preview blocks a Unit tree that contains a fixed assessment", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const planned = planParkToFridge({
    workspace,
    sourceId: "studio-seeing-drawing",
    commandId: "cmd-park-2"
  });

  assert.equal(planned.impact.landing.length, 0);
  assert.ok(planned.impact.protected.some((item) => item.id === "studio-portfolio-check"));
  assert.ok(planned.impact.errors.some((message) => /must be unlocked/i.test(message)));
});

test("Park preview fails safely when the selected object no longer exists", () => {
  const workspace = veteranArtTeacherWeekFixture();
  const planned = planParkToFridge({
    workspace,
    sourceId: "missing-plan",
    commandId: "cmd-park-missing"
  });

  assert.equal(planned.command.sourceIds.length, 0);
  assert.equal(planned.impact.landing.length, 0);
  assert.ok(planned.impact.errors.some((message) => /no longer exists/i.test(message)));
});
