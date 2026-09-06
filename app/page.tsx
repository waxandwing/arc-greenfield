import { redirect } from "next/navigation";
import canonicalBuild from "../CANONICAL_BUILD.json";
import { isArcAuthConfigured } from "../lib/auth-config";
import { createArcServerClient } from "../lib/supabase-server";
import { ArcEntry } from "./arc-entry";

export default async function HomePage() {
  if (isArcAuthConfigured()) {
    const supabase = await createArcServerClient();
    const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!data.user) redirect("/login");
  }

  const gitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local-uncommitted";
  return <ArcEntry buildId={canonicalBuild.buildId} gitSha={gitSha} />;
}
