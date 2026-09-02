"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Workspace } from "../lib/domain";
import { ARC_HELP_TOPICS } from "../lib/arc-help-guidance";
import styles from "./arc-tutorial-screen.module.css";

function focusableElements(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

export function ArcTutorialScreen({ workspace, onComplete }: { workspace: Workspace; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLElement | null>(null);
  const topic = ARC_HELP_TOPICS[index];
  const last = index === ARC_HELP_TOPICS.length - 1;

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    const first = focusableElements(root)[0];
    first?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onComplete();
      return;
    }
    if (event.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const focusable = focusableElements(root);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.scrim} role="presentation">
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arc-explore-title"
        aria-describedby="arc-explore-intro"
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Explore Arc</p>
            <h1 id="arc-explore-title">Getting to Know Arc</h1>
            <p id="arc-explore-intro">This is a reference, not a required course. Look around, open what is useful, then go straight back to the calendar.</p>
          </div>
          <button type="button" className={styles.close} onClick={onComplete} aria-label="Close Explore Arc">×</button>
        </header>

        <div className={styles.body}>
          <nav className={styles.topics} role="tablist" aria-label="Explore Arc topics">
            {ARC_HELP_TOPICS.map((item, topicIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === topicIndex}
                className={index === topicIndex ? styles.selected : undefined}
                onClick={() => setIndex(topicIndex)}
              >
                <span>{topicIndex + 1}</span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </nav>

          <article className={styles.topicPanel} aria-live="polite">
            <div className={styles.topicHead}>
              <div>
                <p className={styles.eyebrow}>{workspace.teacherName ? `${workspace.teacherName}'s Arc` : "Your Arc"}</p>
                <h2>{topic.title}</h2>
              </div>
              <span>{index + 1} / {ARC_HELP_TOPICS.length}</span>
            </div>
            <p className={styles.topicBody}>{topic.body}</p>
            <ul>{topic.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </article>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onComplete}>Back to Arc</button>
          <div>
            <button type="button" className={styles.secondary} disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>Back</button>
            {!last
              ? <button type="button" className={styles.primary} onClick={() => setIndex((current) => Math.min(ARC_HELP_TOPICS.length - 1, current + 1))}>Next</button>
              : <button type="button" className={styles.primary} onClick={onComplete}>Done exploring</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}
