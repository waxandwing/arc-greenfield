import { ArcShell } from "./arc-shell";

const BUILD_ID = "ARC-GF-0002";

export default function HomePage() {
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "local-uncommitted";

  return <ArcShell buildId={BUILD_ID} gitSha={gitSha} />;
}
