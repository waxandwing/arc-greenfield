import test from "node:test";
import assert from "node:assert/strict";
import { ARC_BETA_COOKIE, betaAccessToken } from "../lib/beta-access";

test("Arc beta access token is deterministic without exposing the password", async () => {
  const password = "teacher-beta-password";
  const first = await betaAccessToken(password);
  const second = await betaAccessToken(password);
  const other = await betaAccessToken("different-password");

  assert.equal(first, second);
  assert.notEqual(first, password);
  assert.notEqual(first, other);
  assert.equal(first.length, 64);
  assert.equal(ARC_BETA_COOKIE, "arc_beta_access");
});
