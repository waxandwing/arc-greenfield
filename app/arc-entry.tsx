"use client";

import { useEffect, useState } from "react";
import { emptyWorkspace, type Workspace } from "../lib/domain";
import { loadWorkspaceResult, saveWorkspace } from "../lib/workspace-store";
import { ArcShellCanonical } from "./arc-shell-canonical";
import { OnboardingScreen } from "./onboarding-screen";
import { WorkspaceRecoveryScreen } from "./workspace-recovery-screen";

function isReady(workspace: Workspace) {
  return Boolean(workspace.teacherName.trim() && workspace.courses.length > 0 && workspace.calendar.firstStudentDay);
}

export function ArcEntry({ buildId, gitSha }: { buildId: string; gitSha: string }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(null);

  useEffect(() => {
    const result = loadWorkspaceResult();
    setWorkspace(result.workspace);
    if (result.status === "recovery-needed") {
      setRecoveryRaw(result.recoveryRaw);
      setComplete(false);
    } else {
      setComplete(isReady(result.workspace));
    }
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
    const result = loadWorkspaceResult();
    if (result.status === "recovery-needed") {
      setRecoveryRaw(result.recoveryRaw);
      setComplete(false);
      return;
    }
    setWorkspace(result.workspace);
    setComplete(false);
  }

  function restoreWorkspace(restored: Workspace) {
    saveWorkspace(restored);
    setWorkspace(restored);
    setRecoveryRaw(null);
    setComplete(isReady(restored));
  }

  function startFresh() {
    const fresh = emptyWorkspace();
    saveWorkspace(fresh);
    setWorkspace(fresh);
    setRecoveryRaw(null);
    setComplete(false);
  }

  if (!loaded) return <main className="loadingShell">Opening Arc…</main>;
  if (recoveryRaw) {
    return <WorkspaceRecoveryScreen recoveryRaw={recoveryRaw} onRestore={restoreWorkspace} onStartFresh={startFresh} />;
  }
  if (complete) return <ArcShellCanonical buildId={buildId} gitSha={gitSha} onOpenSetup={openSetup} />;

  return <OnboardingScreen workspace={workspace} onUpdate={updateWorkspace} onComplete={() => { saveWorkspace(workspace); setComplete(true); }} />;
}
