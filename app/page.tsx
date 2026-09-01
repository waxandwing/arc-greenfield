import { redirect } from "next/navigation";
import { ArcShell } from "./arc-shell";
import { isArcAuthConfigured } from "../lib/auth-config";
import { createArcServerClient } from "../lib/supabase-server";

const BUILD_ID = "ARC-GF-0002";

export default async function HomePage() {
  if (isArcAuthConfigured()) {
    const supabase = await createArcServerClient();
    const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!data.user) redirect("/login");
  }

  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "local-uncommitted";

  return <ArcShell buildId={BUILD_ID} gitSha={gitSha} />;
}
