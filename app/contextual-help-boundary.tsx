"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { arcHelpTopic, type ArcHelpTopicId } from "../lib/arc-help-guidance";
import { markHelpExplored, setFirstTimeHelpEnabled, setHelpMarksVisible, shouldShowFirstTimeHelp } from "../lib/help-guidance-state";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";
import styles from "./contextual-help-boundary.module.css";

function topicForTarget(target: HTMLElement): ArcHelpTopicId | null {
  if (target.closest(".fridgeTab")) return "fridge";
  if (target.closest(".shiftTab")) return "shift";
  if (target.closest(".classUnitAdd, .unitMagnet")) return "unit";
  if (target.closest(".lessonMagnet:not(.unitMagnet), .nestedLessonMagnet")) return "lesson";
  if (target.closest(".arcPriority")) return "priority";
  if (target.closest(".arcLogoHome")) return "calendar";
  const button = target.closest("button");
  if (button?.textContent?.trim() === "Day") return "day";
  return null;
}

export function ContextualHelpBoundary({ ownerId, children }: { ownerId: string | null; children: ReactNode }) {
  const [topicId, setTopicId] = useState<ArcHelpTopicId | null>(null);
  const [marksVisible, setMarksVisibleState] = useState(true);
  const [tipsEnabled, setTipsEnabledState] = useState(true);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const workspace = loadWorkspace(ownerId);
    setMarksVisibleState(workspace.preferences.helpMarksVisible !== false);
    setTipsEnabledState(workspace.preferences.firstTimeHelpEnabled !== false);
  }, [ownerId]);

  useEffect(() => {
    if (!topicId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeTopic();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [topicId]);

  function closeTopic() {
    setTopicId(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function updateMarksVisible(visible: boolean) {
    const workspace = loadWorkspace(ownerId);
    saveWorkspace(setHelpMarksVisible(workspace, visible), ownerId);
    setMarksVisibleState(visible);
  }

  function updateTipsEnabled(enabled: boolean) {
    const workspace = loadWorkspace(ownerId);
    saveWorkspace(setFirstTimeHelpEnabled(workspace, enabled), ownerId);
    setTipsEnabledState(enabled);
  }

  function openTopic(nextTopicId: ArcHelpTopicId, trigger?: HTMLElement | null) {
    const workspace = loadWorkspace(ownerId);
    if (!shouldShowFirstTimeHelp(workspace, nextTopicId)) return false;
    triggerRef.current = trigger ?? null;
    saveWorkspace(markHelpExplored(workspace, nextTopicId), ownerId);
    setTopicId(nextTopicId);
    return true;
  }

  function captureClick(event: MouseEvent<HTMLDivElement>) {
    if (topicId) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const nextTopicId = topicForTarget(target);
    if (!nextTopicId) return;
    const trigger = target.closest<HTMLElement>("button, [tabindex], a") ?? target;
    if (!openTopic(nextTopicId, trigger)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  const topic = topicId ? arcHelpTopic(topicId) : null;

  return (
    <div className={styles.boundary} onClickCapture={captureClick}>
      {children}
      {marksVisible && <button type="button" className={styles.helpButton} aria-label="Open Arc help" onClick={(event) => { event.stopPropagation(); triggerRef.current = event.currentTarget; setTopicId("calendar"); }}>?</button>}
      {topic && <div className={styles.scrim} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeTopic(); }}>
        <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="arc-context-help-title" aria-describedby="arc-context-help-body">
          <p className={styles.eyebrow}>{topic.label}</p>
          <h2 id="arc-context-help-title">{topic.title}</h2>
          <p id="arc-context-help-body">{topic.body}</p>
          <ul>{topic.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          <details className={styles.preferences}>
            <summary>Help preferences</summary>
            <label><input type="checkbox" checked={tipsEnabled} onChange={(event) => updateTipsEnabled(event.target.checked)} /> Show first-time tips</label>
            <label><input type="checkbox" checked={marksVisible} onChange={(event) => updateMarksVisible(event.target.checked)} /> Show the ? help button</label>
          </details>
          <button type="button" className={styles.doneButton} autoFocus onClick={closeTopic}>Got it</button>
        </section>
      </div>}
    </div>
  );
}
