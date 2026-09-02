"use client";

import styles from "./arc-explore-welcome.module.css";

export function ArcExploreWelcome({ onExplore, onDismiss }: { onExplore: () => void; onDismiss: () => void }) {
  return (
    <aside className={styles.overlay} aria-label="Getting to Know Arc">
      <div className={styles.card}>
        <p className={styles.eyebrow}>Getting to Know Arc</p>
        <h2>This is your planning desk.</h2>
        <ol>
          <li>Click anything that looks useful.</li>
          <li>Arc can explain a tool the first time you use it.</li>
          <li>Help stays available whenever you want it.</li>
        </ol>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onExplore}>Explore Arc</button>
          <button type="button" className={styles.secondary} onClick={onDismiss}>Just start planning</button>
        </div>
      </div>
    </aside>
  );
}
