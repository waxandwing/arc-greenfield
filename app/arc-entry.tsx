"use client";

import { useEffect, useState } from "react";
import { emptyWorkspace, type Workspace } from "../lib/domain";
import { loadWorkspace, saveWorkspace, setActiveWorkspaceOwner } from "../lib/workspace-store";
import { ArcShell } from "./arc-shell";
import { ArcTutorialScreen } from "./arc-tutorial-screen";
import { OnboardingScreen } from "./onboarding-screen";

function isReady(workspace: Workspace) {
  return Boolean(workspace.teacherName.trim() && workspace.courses.length > 0 && workspace.calendar.firstStudentDay && workspace.calendar.lastStudentDay);
}

export function ArcEntry({ buildId, gitSha, ownerId }: { buildId: string; gitSha: string; ownerId: string | null }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);

  useEffect(() => {
    setActiveWorkspaceOwner(ownerId);
    const stored = loadWorkspace(ownerId);
    setWorkspace(stored);
    setComplete(isReady(stored));
    setTutorialComplete(stored.preferences.tutorialCompleted === true);
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

  function openTutorial() {
    setWorkspace(loadWorkspace(ownerId));
    setTutorialComplete(false);
  }

  function finishTutorial() {
    setWorkspace((current) => {
      const next = {
        ...current,
        ownerId,
        preferences: { ...current.preferences, tutorialCompleted: true },
        updatedAt: new Date().toISOString()
      };
      saveWorkspace(next, ownerId);
      return next;
    });
    setTutorialComplete(true);
  }

  if (!loaded) return <main className="loadingShell">Opening Arc…</main>;
  if (complete && !tutorialComplete) return <ArcTutorialScreen workspace={workspace} onComplete={finishTutorial} />;
  if (complete) return <ArcShell buildId={buildId} gitSha={gitSha} onOpenSetup={openSetup} onOpenTutorial={openTutorial} />;

  return <OnboardingScreen workspace={workspace} onUpdate={updateWorkspace} onComplete={() => {
    saveWorkspace({ ...workspace, ownerId }, ownerId);
    setComplete(true);
  }} />;
}
