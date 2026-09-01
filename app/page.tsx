import { redirect } from "next/navigation";
import { ArcEntry } from "./arc-entry";
import { isArcAuthConfigured } from "../lib/auth-config";
import { createArcServerClient } from "../lib/supabase-server";

const BUILD_ID = "ARC-GF-0002";

export default async function HomePage() {
  let ownerId: string | null = null;
  if (isArcAuthConfigured()) {
    const supabase = await createArcServerClient();
    const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!data.user) redirect("/login");
    ownerId = data.user.id;
  }

  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "local-uncommitted";

  return <ArcEntry buildId={BUILD_ID} gitSha={gitSha} ownerId={ownerId} />;
}
