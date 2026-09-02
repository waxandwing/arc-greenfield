"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyRecoveryPreview, previewDisruption, type RecoveryPreview } from "../../lib/recovery";
import { clearRecoveryCheckpoint, loadRecoveryCheckpoint, saveRecoveryCheckpoint } from "../../lib/recovery-store";
import { emptyWorkspace, type Workspace } from "../../lib/domain";
import { loadWorkspace, saveWorkspace } from "../../lib/workspace-store";
import styles from "./recovery-desk.module.css";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readableDate(value: string | null) {
  if (!value) return "No destination";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function RecoveryDesk() {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [disruptionDate, setDisruptionDate] = useState(todayKey());
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [message, setMessage] = useState("");
  const [canUndoRecovery, setCanUndoRecovery] = useState(false);

  useEffect(() => {
    const stored = loadWorkspace();
    setWorkspace(stored);
    setCanUndoRecovery(Boolean(loadRecoveryCheckpoint()));
    setLoaded(true);
  }, []);

  const courseNames = useMemo(() => new Map(workspace.courses.map((course) => [course.id, course.name])), [workspace.courses]);
  const plansForDate = useMemo(
    () => workspace.plans.filter((plan) => plan.location === "calendar" && plan.date === disruptionDate),
    [workspace.plans, disruptionDate]
  );

  function buildPreview() {
    const next = previewDisruption(workspace, disruptionDate);
    setPreview(next);
    if (next.impacts.length === 0) setMessage("Nothing is scheduled on that date. Arc will not invent a problem to solve.");
    else setMessage("");
  }

  function confirmRecovery() {
    if (!preview || preview.movableCount === 0) return;
    saveRecoveryCheckpoint(workspace, `Before recovery from ${preview.disruptionDate}`);
    const next = applyRecoveryPreview(workspace, preview);
    saveWorkspace(next);
    setWorkspace(next);
    setPreview(null);
    setCanUndoRecovery(true);
    setMessage(`${preview.movableCount} ${preview.movableCount === 1 ? "plan moved" : "plans moved"}. Fixed dates stayed put. Nothing was deleted.`);
  }

  function undoRecovery() {
    const checkpoint = loadRecoveryCheckpoint();
    if (!checkpoint) return;
    saveWorkspace(checkpoint.workspace);
    setWorkspace(checkpoint.workspace);
    clearRecoveryCheckpoint();
    setCanUndoRecovery(false);
    setPreview(null);
    setMessage("Recovery undone. Your earlier plan is back.");
  }

  if (!loaded) return <main className={styles.loading}>Opening your teaching day...</main>;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Wax &amp; Wing / Arc</p>
          <h1>Recovery Desk</h1>
          <p className={styles.lede}>Plans get interrupted. The useful part is knowing what happens next.</p>
        </div>
        <div className={styles.headerActions}>
          {canUndoRecovery && <button type="button" className={styles.secondaryButton} onClick={undoRecovery}>Undo last recovery</button>}
          <Link className={styles.backLink} href="/">Back to calendar</Link>
        </div>
      </header>

      <section className={styles.controlCard} aria-labelledby="recovery-question">
        <div>
          <p className={styles.kicker}>Start with the interruption</p>
          <h2 id="recovery-question">Which teaching day changed?</h2>
          <p>Arc will preview the ripple before it moves a single lesson.</p>
        </div>
        <div className={styles.dateControls}>
          <label>
            <span>Date</span>
            <input type="date" value={disruptionDate} onChange={(event) => { setDisruptionDate(event.target.value); setPreview(null); setMessage(""); }} />
          </label>
          <button type="button" className={styles.primaryButton} onClick={buildPreview}>Preview the ripple</button>
        </div>
      </section>

      <section className={styles.snapshot} aria-label="Plans on selected date">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>What Arc sees</p>
            <h2>{readableDate(disruptionDate)}</h2>
          </div>
          <span className={styles.count}>{plansForDate.length} scheduled</span>
        </div>
        {plansForDate.length === 0 ? (
          <p className={styles.empty}>No lessons, units, or notes are scheduled here.</p>
        ) : (
          <ul className={styles.planList}>
            {plansForDate.map((plan) => (
              <li key={plan.id}>
                <span className={styles.planType}>{plan.type}</span>
                <strong>{plan.title}</strong>
                <span>{plan.courseId ? courseNames.get(plan.courseId) ?? "Class" : "All classes"}</span>
                <span className={plan.fixedDate ? styles.fixedBadge : styles.movableBadge}>{plan.fixedDate ? "Fixed date" : "Can move"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview && preview.impacts.length > 0 && (
        <section className={styles.previewCard} aria-live="polite">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Impact preview</p>
              <h2>Nothing moves until you say so.</h2>
            </div>
            <div className={styles.metrics}>
              <span>{preview.movableCount} moving</span>
              <span>{preview.fixedCount} fixed</span>
              <span>{preview.collisionCount} collision {preview.collisionCount === 1 ? "warning" : "warnings"}</span>
            </div>
          </div>

          <div className={styles.impactList}>
            {preview.impacts.map((impact) => (
              <article key={impact.planId} className={styles.impactRow}>
                <div>
                  <strong>{impact.title}</strong>
                  <span>{impact.courseId ? courseNames.get(impact.courseId) ?? "Class" : "All classes"}</span>
                </div>
                {impact.fixed ? (
                  <p><b>Stays on {readableDate(impact.fromDate)}</b><br />This plan is locked to its date.</p>
                ) : (
                  <p><b>{readableDate(impact.fromDate)} to {readableDate(impact.toDate)}</b>{impact.collisionTitles.length > 0 && <><br /><span className={styles.warning}>Already there: {impact.collisionTitles.join(", ")}</span></>}</p>
                )}
              </article>
            ))}
          </div>

          <div className={styles.confirmRow}>
            <p>Arc keeps a one-step recovery checkpoint so this shift can be undone after confirmation.</p>
            <button type="button" className={styles.primaryButton} disabled={preview.movableCount === 0} onClick={confirmRecovery}>Confirm recovery</button>
          </div>
        </section>
      )}

      {message && <p className={styles.message} role="status">{message}</p>}

      <section className={styles.rules} aria-label="Recovery rules">
        <p className={styles.kicker}>Built into the move</p>
        <div className={styles.ruleGrid}>
          <article><strong>No silent loss</strong><span>Nothing is deleted because a day changed.</span></article>
          <article><strong>Fixed means fixed</strong><span>Tests, performances, and other locked dates stay put.</span></article>
          <article><strong>School days count</strong><span>Weekends and no-school dates are skipped automatically.</span></article>
          <article><strong>Collision before consequence</strong><span>Existing plans on the destination day are shown before confirmation.</span></article>
        </div>
      </section>
    </main>
  );
}
