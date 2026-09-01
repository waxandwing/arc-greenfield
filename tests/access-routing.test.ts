import test from "node:test";
import assert from "node:assert/strict";
import { isAuthPublicPath, isBetaPublicPath, safeInternalNext } from "../lib/access-routing";

test("beta routes remain reachable before Google login", () => {
  assert.equal(isBetaPublicPath("/beta"), true);
  assert.equal(isBetaPublicPath("/api/beta-access"), true);
  assert.equal(isBetaPublicPath("/login"), false);
});

test("Google auth routes are public only inside the authenticated gate", () => {
  assert.equal(isAuthPublicPath("/login"), true);
  assert.equal(isAuthPublicPath("/auth/callback"), true);
  assert.equal(isAuthPublicPath("/api/auth/signout"), true);
  assert.equal(isAuthPublicPath("/"), false);
});

test("OAuth next paths cannot escape the Arc origin", () => {
  assert.equal(safeInternalNext("/quarter?course=art"), "/quarter?course=art");
  assert.equal(safeInternalNext("https://evil.example"), "/");
  assert.equal(safeInternalNext("//evil.example"), "/");
  assert.equal(safeInternalNext(null), "/");
});
