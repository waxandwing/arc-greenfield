"use client";

import { useEffect, useState } from "react";
import { emptyWorkspace, type Workspace } from "../lib/domain";
import { onboardingReady } from "../lib/onboarding-state";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";
import { ArcShell } from "./arc-shell";
import { OnboardingScreen } from "./onboarding-screen";

export function ArcEntry({ buildId, gitSha }: { buildId: string; gitSha: string }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const stored = loadWorkspace();
    setWorkspace(stored);
    setComplete(onboardingReady(stored));
    setLoaded(true);
  }, []);

  function updateWorkspace(updater: (current: Workspace) => Workspace) {
    setWorkspace((current) => {
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      saveWorkspace(next);
      return next;
    });
  }

  function openSetup() {
    setWorkspace(loadWorkspace());
    setComplete(false);
  }

  if (!loaded) return <main className="loadingShell">Opening Arc…</main>;
  if (complete) return <ArcShell buildId={buildId} gitSha={gitSha} onOpenSetup={openSetup} />;

  return (
    <OnboardingScreen
      workspace={workspace}
      onUpdate={updateWorkspace}
      onComplete={() => setComplete(true)}
    />
  );
}
