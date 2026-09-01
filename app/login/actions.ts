"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createArcServerClient } from "../../lib/supabase-server";

function requestOrigin(headerStore: Awaited<ReturnType<typeof headers>>) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createArcServerClient();
  if (!supabase) redirect("/");

  const headerStore = await headers();
  const origin = requestOrigin(headerStore);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/` }
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
