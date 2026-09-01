import test from "node:test";
import assert from "node:assert/strict";
import { arcAuthConfig, isArcAuthConfigured } from "../lib/auth-config";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
});

test("Arc auth stays disabled unless both Supabase values exist", () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(isArcAuthConfigured(), false);
  assert.equal(arcAuthConfig(), null);

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  assert.equal(isArcAuthConfigured(), false);
});

test("Arc auth enables only with a complete Supabase configuration", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  assert.equal(isArcAuthConfigured(), true);
  assert.deepEqual(arcAuthConfig(), { url: "https://example.supabase.co", anonKey: "anon-key" });
});
