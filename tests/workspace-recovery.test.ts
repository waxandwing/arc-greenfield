import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { decodeWorkspace } from "../lib/workspace-store";

function samplePlan(id: string): Plan {
  return {
    id,
    type: "lesson",
    title: "Visual analysis",
    courseId: null,
    date: null,
    endDate: null,
    location: "ideas",
    arcLocation: "fridge",
    taskContext: null,
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {}
  };
}

test("malformed workspace payload is marked recovery-needed and preserved verbatim", () => {
  const raw = "{definitely-not-json";
  const result = decodeWorkspace(raw);

  assert.equal(result.status, "recovery-needed");
  assert.equal(result.recoveryRaw, raw);
  assert.equal(result.workspace.plans.length, 0);
});

test("unknown workspace schema is marked recovery-needed instead of treated as an empty valid workspace", () => {
  const raw = JSON.stringify({ schemaVersion: 999, plans: [{ id: "important" }] });
  const result = decodeWorkspace(raw);

  assert.equal(result.status, "recovery-needed");
  assert.equal(result.recoveryRaw, raw);
});

test("parseable but structurally incomplete workspace is quarantined", () => {
  const raw = JSON.stringify({ schemaVersion: 2, id: "workspace", plans: [] });
  const result = decodeWorkspace(raw);

  assert.equal(result.status, "recovery-needed");
  assert.equal(result.recoveryRaw, raw);
});

test("duplicate Plan IDs are quarantined rather than loaded as ambiguous identity", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [samplePlan("same-id"), samplePlan("same-id")];
  const raw = JSON.stringify(workspace);
  const result = decodeWorkspace(raw);

  assert.equal(result.status, "recovery-needed");
  assert.equal(result.recoveryRaw, raw);
});

test("a valid schema-2 workspace still loads normally", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [samplePlan("unique-id")];
  const result = decodeWorkspace(JSON.stringify(workspace));

  assert.equal(result.status, "loaded");
  assert.equal(result.recoveryRaw, null);
  assert.equal(result.workspace.plans[0].id, "unique-id");
});

test("missing workspace is an ordinary empty start, not a recovery incident", () => {
  const result = decodeWorkspace(null);
  assert.equal(result.status, "empty");
  assert.equal(result.recoveryRaw, null);
});
