import assert from "node:assert/strict";
import test from "node:test";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { moveObjectToTaskBar, objectLocation, updateTaskContext } from "../lib/object-lifecycle";
import { movePlanToCalendarDate } from "../lib/plan-operations";
import { movePlanTreeToIdeas } from "../lib/plan-tree";
import { commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace } from "../lib/workspace-history";
import { decodeWorkspace } from "../lib/workspace-store";

function stablePlan(): Plan {
  return {
    id: "trust-object",
    type: "lesson",
    title: "Print critique prompts",
    courseId: "apah",
    date: "2026-09-09",
    endDate: null,
    location: "calendar",
    arcLocation: "calendar",
    taskContext: null,
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "Full calendar note must survive simplification.",
    resources: [{ id: "resource-1", label: "Prompt sheet", url: "https://example.com/prompt" }],
    details: { standards: "VA.912.C.1.4", advancedField: "keep-me" }
  };
}

test("current workspace JSON round-trip retains progressive-depth object state", () => {
  const workspace = emptyWorkspace();
  const plan = updateTaskContext(moveObjectToTaskBar(movePlanTreeToIdeas([stablePlan()], "trust-object")[0], "must"), {
    notes: "Ten minutes after school",
    startTime: "15:20",
    durationMinutes: 10,
    targetDate: "2026-09-10"
  });
  workspace.plans = [plan];

  const decoded = decodeWorkspace(JSON.stringify(workspace));
  const restored = decoded.workspace.plans[0];

  assert.equal(decoded.status, "loaded");
  assert.equal(restored.id, "trust-object");
  assert.equal(objectLocation(restored), "taskbar");
  assert.equal(restored.notes, "Full calendar note must survive simplification.");
  assert.equal(restored.details.advancedField, "keep-me");
  assert.deepEqual(restored.resources, plan.resources);
  assert.equal(restored.taskContext?.tier, "must");
  assert.equal(restored.taskContext?.startTime, "15:20");
  assert.equal(restored.taskContext?.durationMinutes, 10);
});

test("unreadable workspace data fails closed into recovery-needed instead of becoming active state", () => {
  const decoded = decodeWorkspace('{"schemaVersion":2,"plans":"corrupt"}');

  assert.equal(decoded.status, "recovery-needed");
  assert.ok(decoded.recoveryRaw);
  assert.equal(decoded.workspace.plans.length, 0);
});

test("Fridge → Task Bar → Calendar remains one stable object through Undo and Redo", () => {
  const workspace = emptyWorkspace();
  workspace.courses = [{ id: "apah", name: "AP Art History", periodLabel: "1", color: "#C96845" }];
  workspace.plans = [movePlanTreeToIdeas([stablePlan()], "trust-object")[0]];

  let history = createWorkspaceHistory(workspace);

  const taskPlan = updateTaskContext(moveObjectToTaskBar(history.present.plans[0], "should"), {
    notes: "Prep before dismissal",
    durationMinutes: 15
  });
  history = commitWorkspace(history, { ...history.present, plans: [taskPlan] });

  const scheduledPlans = movePlanToCalendarDate(history.present.plans, "trust-object", "2026-09-11", "apah");
  history = commitWorkspace(history, { ...history.present, plans: scheduledPlans });

  let current = history.present.plans[0];
  assert.equal(current.id, "trust-object");
  assert.equal(objectLocation(current), "calendar");
  assert.equal(current.date, "2026-09-11");
  assert.equal(current.taskContext?.notes, "Prep before dismissal");
  assert.equal(current.details.advancedField, "keep-me");

  history = undoWorkspace(history);
  current = history.present.plans[0];
  assert.equal(current.id, "trust-object");
  assert.equal(objectLocation(current), "taskbar");
  assert.equal(current.taskContext?.durationMinutes, 15);
  assert.equal(current.notes, "Full calendar note must survive simplification.");

  history = undoWorkspace(history);
  current = history.present.plans[0];
  assert.equal(current.id, "trust-object");
  assert.equal(objectLocation(current), "fridge");
  assert.equal(current.details.standards, "VA.912.C.1.4");

  history = redoWorkspace(history);
  history = redoWorkspace(history);
  current = history.present.plans[0];
  assert.equal(current.id, "trust-object");
  assert.equal(objectLocation(current), "calendar");
  assert.equal(current.date, "2026-09-11");
  assert.equal(current.taskContext?.notes, "Prep before dismissal");
  assert.equal(current.resources[0]?.label, "Prompt sheet");
});
