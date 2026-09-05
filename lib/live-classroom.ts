import type { Plan, Section, SectionDeliveryState, Workspace } from "./domain";
import { effectiveSections } from "./day-context";
import { isInstructionalDay } from "./school-calendar";

export type LiveEligibility =
  | { ok: true }
  | { ok: false; reason: "not-lesson" | "wrong-date" | "not-instructional-day" | "wrong-section" | "already-finished" };

export function liveEligibility(workspace: Workspace, plan: Plan, section: Section, date: string): LiveEligibility {
  if (plan.type !== "lesson") return { ok: false, reason: "not-lesson" };
  if (plan.date !== date) return { ok: false, reason: "wrong-date" };
  if (!isInstructionalDay(workspace.calendar, date)) return { ok: false, reason: "not-instructional-day" };
  if (plan.courseId !== section.courseId || (plan.sectionId && plan.sectionId !== section.id)) return { ok: false, reason: "wrong-section" };
  const state = plan.sectionDelivery?.[section.id]?.state ?? "not-started";
  if (state === "completed" || state === "skipped") return { ok: false, reason: "already-finished" };
  return { ok: true };
}

export type LiveOutcome =
  | { type: "complete" }
  | { type: "stop"; resumeNote: string }
  | { type: "skip" };

export function applyLiveOutcome(plan: Plan, sectionId: string, date: string, outcome: LiveOutcome, now = new Date().toISOString()): Plan {
  const previous = plan.sectionDelivery?.[sectionId];
  let next: SectionDeliveryState;

  if (outcome.type === "complete") {
    next = { state: "completed", actualTaughtDate: date, updatedAt: now };
  } else if (outcome.type === "skip") {
    next = { state: "skipped", updatedAt: now };
  } else {
    const resumeNote = outcome.resumeNote.trim();
    if (!resumeNote) return plan;
    next = { state: "in-progress", actualTaughtDate: date, resumeNote, updatedAt: now };
  }

  return {
    ...plan,
    sectionDelivery: {
      ...plan.sectionDelivery,
      [sectionId]: { ...previous, ...next }
    }
  };
}

/** Revalidate exact canonical context immediately before writeback. */
export function canWriteLiveOutcome(workspace: Workspace, planId: string, sectionId: string, date: string): boolean {
  const plan = workspace.plans.find((item) => item.id === planId);
  const section = effectiveSections(workspace).find((item) => item.id === sectionId);
  if (!plan || !section) return false;
  return liveEligibility(workspace, plan, section, date).ok;
}
