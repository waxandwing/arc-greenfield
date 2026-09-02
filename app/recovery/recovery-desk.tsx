"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Plan, Workspace } from "../../lib/domain";
import { applyInstructionalShift, extendLesson, previewInstructionalShift, type ShiftPreflight } from "../../lib/efficiency-operations";
import { clearRecoveryCheckpoint, loadRecoveryCheckpoint, saveRecoveryCheckpoint } from "../../lib/recovery-checkpoint";
import { loadWorkspace, saveWorkspace } from "../../lib/workspace-store";
import styles from "./recovery-desk.module.css";

function localDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readableDate(value: string | null) {
  if (!value) return "No date";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function rootFor(workspace: Workspace, plan: Plan) {
  if (!plan.parentUnitId) return plan;
  return workspace.plans.find((candidate) => candidate.id === plan.parentUnitId) ?? plan;
}

export function RecoveryDesk() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [fromDate, setFromDate] = useState(localDateKey());
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<ShiftPreflight | null>(null);
  const [status, setStatus] = useState("");
  const [hasCheckpoint, setHasCheckpoint] = useState(false);

  useEffect(() => {
    const stored = loadWorkspace();
    setWorkspace(stored);
    setCourseIds(stored.courses.map((course) => course.id));
    setHasCheckpoint(Boolean(loadRecoveryCheckpoint(stored.ownerId)));
  }, []);

  const courseMap = useMemo(() => new Map(workspace?.courses.map((course) => [course.id, course]) ?? []), [workspace]);
  const planMap = useMemo(() => new Map(workspace?.plans.map((plan) => [plan.id, plan]) ?? []), [workspace]);
  const unfinished = useMemo(() => {
    if (!workspace) return [];
    return workspace.plans.filter((plan) =>
      plan.type === "lesson" &&
      plan.location === "calendar" &&
      plan.date === fromDate &&
      (plan.details.deliveryState === "partial" || plan.details.deliveryState === "missed")
    );
  }, [workspace, fromDate]);

  function toggleCourse(courseId: string) {
    setCourseIds((current) => current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]);
    setPreview(null);
    setStatus("");
  }

  function makePreview() {
    if (!workspace || courseIds.length === 0) return;
    const next = previewInstructionalShift(workspace, courseIds, fromDate, 1);
    setPreview(next);
    setStatus(next.rootIds.length === 0 ? "Nothing downstream needs to move from this date." : "");
  }

  function confirmShift() {
    if (!workspace || !preview || preview.movableRootIds.length === 0) return;
    saveRecoveryCheckpoint(workspace, `Before recovery from ${readableDate(preview.fromDate)}`);
    const next = applyInstructionalShift(workspace, preview);
    saveWorkspace(next);
    setWorkspace(next);
    setHasCheckpoint(true);
    setPreview(null);
    setStatus(`${preview.movableRootIds.length} planning ${preview.movableRootIds.length === 1 ? "thread" : "threads"} moved. Blocked plans stayed put. Nothing was deleted.`);
  }

  function carryForward(lessonId: string) {
    if (!workspace) return;
    saveRecoveryCheckpoint(workspace, `Before carrying unfinished lesson forward from ${readableDate(fromDate)}`);
    const result = extendLesson(workspace, lessonId);
    if (!result.continuationId) return;
    const next = {
      ...result.workspace,
      plans: result.workspace.plans.map((plan) => plan.id === lessonId
        ? { ...plan, details: { ...plan.details, recoveryHandled: "true" } }
        : plan)
    };
    saveWorkspace(next);
    setWorkspace(next);
    setHasCheckpoint(true);
    setStatus("Unfinished work carried to the next time this class meets. The original lesson stays in today’s record.");
  }

  function undoRecovery() {
    if (!workspace) return;
    const checkpoint = loadRecoveryCheckpoint(workspace.ownerId);
    if (!checkpoint) return;
    saveWorkspace(checkpoint.workspace);
    setWorkspace(checkpoint.workspace);
    clearRecoveryCheckpoint(workspace.ownerId);
    setHasCheckpoint(false);
    setPreview(null);
    setStatus("Recovery undone. The earlier plan is back.");
  }

  if (!workspace) return <main className={styles.loading}>Opening Recovery Desk...</main>;

  const conflictRoots = new Set(preview?.blockedRootIds ?? []);
  const movableRoots = preview?.movableRootIds.map((id) => planMap.get(id)).filter((plan): plan is Plan => Boolean(plan)) ?? [];
  const blockedRoots = preview?.blockedRootIds.map((id) => planMap.get(id)).filter((plan): plan is Plan => Boolean(plan)) ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Wax &amp; Wing / Arc</p>
          <h1>Recovery Desk</h1>
          <p className={styles.lede}>The plan changed. Arc should help you find your footing, not make you rebuild the week.</p>
        </div>
        <div className={styles.heroActions}>
          {hasCheckpoint && <button type="button" className={styles.quietButton} onClick={undoRecovery}>Undo last recovery</button>}
          <Link className={styles.quietLink} href="/">Back to calendar</Link>
        </div>
      </header>

      <section className={styles.interruptionCard} aria-labelledby="changed-day-heading">
        <div>
          <p className={styles.kicker}>Start with what changed</p>
          <h2 id="changed-day-heading">Which teaching day got interrupted?</h2>
          <p>Pick the date and the classes affected. Arc will calculate the ripple without moving anything yet.</p>
        </div>
        <label className={styles.dateField}>
          <span>Date</span>
          <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPreview(null); setStatus(""); }} />
        </label>
        <fieldset className={styles.courseChoices}>
          <legend>Classes affected</legend>
          {workspace.courses.map((course) => (
            <label key={course.id}>
              <input type="checkbox" checked={courseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} />
              <span style={{ ["--course-color" as string]: course.color }}><i aria-hidden="true" />{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</span>
            </label>
          ))}
        </fieldset>
        <button type="button" className={styles.primaryButton} disabled={courseIds.length === 0} onClick={makePreview}>Preview the ripple</button>
      </section>

      {unfinished.length > 0 && (
        <section className={styles.unfinishedCard} aria-labelledby="unfinished-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>From Day view</p>
              <h2 id="unfinished-heading">What did not finish?</h2>
            </div>
            <span>{unfinished.length} flagged</span>
          </div>
          <div className={styles.unfinishedList}>
            {unfinished.map((lesson) => {
              const handled = lesson.details.recoveryHandled === "true";
              const state = lesson.details.deliveryState === "partial" ? "Partly taught" : "Didn’t get to it";
              return (
                <article key={lesson.id}>
                  <div>
                    <strong>{lesson.title}</strong>
                    <span>{courseMap.get(lesson.courseId ?? "")?.name ?? "Class"} · {state}</span>
                  </div>
                  <button type="button" className={styles.smallButton} disabled={handled} onClick={() => carryForward(lesson.id)}>{handled ? "Carried forward" : "Carry to next class"}</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {preview && preview.rootIds.length > 0 && (
        <section className={styles.previewCard} aria-live="polite">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Impact preview</p>
              <h2>Nothing moves until you confirm.</h2>
            </div>
            <div className={styles.metrics}>
              <span>{movableRoots.length} can move</span>
              <span>{blockedRoots.length} blocked</span>
              <span>{preview.conflicts.length} {preview.conflicts.length === 1 ? "conflict" : "conflicts"}</span>
            </div>
          </div>

          <div className={styles.impactColumns}>
            <section>
              <h3>Will move one class meeting</h3>
              {movableRoots.length ? movableRoots.map((plan) => (
                <article className={styles.impactItem} key={plan.id}>
                  <strong>{plan.title}</strong>
                  <span>{courseMap.get(plan.courseId ?? "")?.name ?? "Class"}</span>
                  <small>{readableDate(plan.date)} onward</small>
                </article>
              )) : <p className={styles.empty}>No safe moves in this preview.</p>}
            </section>

            <section>
              <h3>Needs your attention</h3>
              {blockedRoots.length ? blockedRoots.map((plan) => {
                const conflicts = preview.conflicts.filter((conflict) => conflict.rootId === plan.id);
                return (
                  <article className={styles.impactItem} key={plan.id}>
                    <strong>{plan.title}</strong>
                    <span>{courseMap.get(plan.courseId ?? "")?.name ?? "Class"}</span>
                    {conflicts.map((conflict, index) => {
                      const conflicting = conflict.conflictingPlanId ? planMap.get(conflict.conflictingPlanId) : null;
                      return <small className={styles.warning} key={`${conflict.planId}-${index}`}>{conflict.kind === "fixed-date" ? "A fixed date protects this planning thread." : `Collision on ${readableDate(conflict.targetDate)}${conflicting ? ` with ${conflicting.title}` : ""}.`}</small>;
                    })}
                  </article>
                );
              }) : <p className={styles.empty}>No blocked planning threads.</p>}
            </section>
          </div>

          <footer className={styles.confirmRow}>
            <div>
              <strong>No silent loss.</strong>
              <span>Fixed dates and collisions stay visible. Arc applies only the safe part of this preview, and the whole change gets one-step undo.</span>
            </div>
            <button type="button" className={styles.primaryButton} disabled={movableRoots.length === 0} onClick={confirmShift}>Confirm safe moves</button>
          </footer>
        </section>
      )}

      {status && <p className={styles.status} role="status">{status}</p>}

      <section className={styles.rules} aria-label="Recovery rules">
        <article><strong>Actual class meetings</strong><span>Arc honors school closures, weekday patterns, and rotating schedules.</span></article>
        <article><strong>Fixed stays fixed</strong><span>Locked dates block their planning thread instead of disappearing.</span></article>
        <article><strong>Conflicts stay visible</strong><span>Arc shows the collision and leaves that thread for you to resolve.</span></article>
        <article><strong>Return is part of planning</strong><span>Partly taught lessons can continue without erasing what happened today.</span></article>
      </section>
    </main>
  );
}
