"use client";

import { arcHelpTopic, type ArcHelpTopicId } from "../lib/arc-help-guidance";
import styles from "./arc-context-help-card.module.css";

export function ArcContextHelpCard({
  topicId,
  onClose,
  onTry
}: {
  topicId: ArcHelpTopicId;
  onClose: () => void;
  onTry?: () => void;
}) {
  const topic = arcHelpTopic(topicId);

  return (
    <aside className={styles.card} aria-label={`${topic.label} help`} role="dialog" aria-modal="false">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{topic.label}</span>
          <h3>{topic.title}</h3>
        </div>
        <button type="button" className={styles.close} aria-label={`Close ${topic.label} help`} onClick={onClose}>×</button>
      </header>
      <p className={styles.body}>{topic.body}</p>
      <ul className={styles.list}>{topic.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
      <footer className={styles.footer}>
        {onTry && <button type="button" className={styles.primary} onClick={onTry}>Try it now</button>}
        <button type="button" className={styles.secondary} onClick={onClose}>Back to planning</button>
      </footer>
    </aside>
  );
}
