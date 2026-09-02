"use client";

import { useEffect, useState } from "react";
import { emptyWorkspace, type Workspace } from "../lib/domain";
import { loadWorkspace, saveWorkspace, setActiveWorkspaceOwner } from "../lib/workspace-store";
import { ArcShell } from "./arc-shell";
import { ArcTutorialScreen } from "./arc-tutorial-screen";
import { ContextualHelpBoundary } from "./contextual-help-boundary";
import { OnboardingScreen } from "./onboarding-screen";
import { RecoveryShortcut } from "./recovery-shortcut";

function isReady(workspace: Workspace) {
  return Boolean(workspace.teacherName.trim() && workspace.courses.length > 0 && workspace.calendar.firstStudentDay && workspace.calendar.lastStudentDay);
}

export function ArcEntry({ buildId, gitSha, ownerId }: { buildId: string; gitSha: string; ownerId: string | null }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showExploreArc, setShowExploreArc] = useState(false);

  useEffect(() => {
    setActiveWorkspaceOwner(ownerId);
    const stored = loadWorkspace(ownerId);
    setWorkspace(stored);
    setComplete(isReady(stored));
    setLoaded(true);
  }, [ownerId]);

  function updateWorkspace(updater: (current: Workspace) => Workspace) {
    setWorkspace((current) => {
      const next = { ...updater(current), ownerId, updatedAt: new Date().toISOString() };
      saveWorkspace(next, ownerId);
      return next;
    });
  }

  function openSetup() {
    const current = loadWorkspace(ownerId);
    setWorkspace(current);
    setComplete(false);
  }

  function openExploreArc() {
    setWorkspace(loadWorkspace(ownerId));
    const openMore = document.querySelector<HTMLButtonElement>(".moreTab[aria-pressed='true']");
    openMore?.click();
    setShowExploreArc(true);
  }

  function completeOnboarding() {
    const stored = loadWorkspace(ownerId);
    setWorkspace(stored);
    if (!isReady(stored)) return;
    setComplete(true);
    setShowExploreArc(true);
  }

  if (!loaded) return <main className="loadingShell">Opening Arc...</main>;
  if (complete) {
    return (
      <>
        <ContextualHelpBoundary ownerId={ownerId}>
          <ArcShell buildId={buildId} gitSha={gitSha} onOpenSetup={openSetup} onOpenTutorial={openExploreArc} />
          <RecoveryShortcut />
        </ContextualHelpBoundary>
        {showExploreArc && <ArcTutorialScreen onComplete={() => setShowExploreArc(false)} />}
      </>
    );
  }

  return <OnboardingScreen workspace={workspace} onUpdate={updateWorkspace} onComplete={completeOnboarding} />;
}
