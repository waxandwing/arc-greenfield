"use client";

import { ARC_HELP_TOPICS } from "../lib/arc-help-guidance";
import styles from "./arc-help-settings.module.css";

export function ArcHelpSettings({
  helpMarksVisible,
  firstTimeHelpEnabled,
  exploredHelpIds,
  onHelpMarksChange,
  onFirstTimeHelpChange,
  onExplore,
  onResetExploration
}: {
  helpMarksVisible: boolean;
  firstTimeHelpEnabled: boolean;
  exploredHelpIds: string[];
  onHelpMarksChange: (visible: boolean) => void;
  onFirstTimeHelpChange: (enabled: boolean) => void;
  onExplore: () => void;
  onResetExploration: () => void;
}) {
  const exploredCount = ARC_HELP_TOPICS.filter((topic) => exploredHelpIds.includes(topic.id)).length;

  return (
    <section className={styles.panel} aria-label="Help and guidance">
      <header>
        <strong>Help and guidance</strong>
        <span>{exploredCount} of {ARC_HELP_TOPICS.length} planning tools explored</span>
      </header>

      <label className={styles.toggle}>
        <input type="checkbox" checked={helpMarksVisible} onChange={(event) => onHelpMarksChange(event.target.checked)} />
        <span><b>Show help marks</b><small>Keep a small ? available on supported tools.</small></span>
      </label>

      <label className={styles.toggle}>
        <input type="checkbox" checked={firstTimeHelpEnabled} onChange={(event) => onFirstTimeHelpChange(event.target.checked)} />
        <span><b>Show first-time explanations</b><small>Open a short explanation the first time you use an unfamiliar tool.</small></span>
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={onExplore}>Explore Arc</button>
        <button type="button" onClick={onResetExploration}>Review unexplored again</button>
      </div>
    </section>
  );
}
