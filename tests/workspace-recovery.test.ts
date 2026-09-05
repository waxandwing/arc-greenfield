import test from "node:test";
import assert from "node:assert/strict";
import { decodeWorkspace } from "../lib/workspace-store";


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

test("missing workspace is an ordinary empty start, not a recovery incident", () => {
  const result = decodeWorkspace(null);
  assert.equal(result.status, "empty");
  assert.equal(result.recoveryRaw, null);
});
