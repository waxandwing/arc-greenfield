import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan, type Section } from "../lib/domain";
import { carryoverPlans, effectiveSections, sectionPlans } from "../lib/day-context";
import { applyLiveOutcome, canWriteLiveOutcome, liveEligibility } from "../lib/live-classroom";

function lesson(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "lesson-1",
    type: "lesson",
    title: "Visual evidence",
    courseId: "course-a",
    sectionId: "section-a",
    date: "2026-09-08",
    endDate: null,
    location: "calendar",
    arcLocation: "calendar",
    taskContext: null,
    sectionDelivery: {},
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "Notice first.",
    resources: [],
    details: {},
    ...overrides
  };
}

function workspace() {
  const next = emptyWorkspace();
  next.courses = [{ id: "course-a", name: "AP Art History", periodLabel: "2", color: "#7C9CAD" }];
  next.sections = [{ id: "section-a", courseId: "course-a", name: "AP Art History", periodLabel: "2", color: "#7C9CAD" }];
  next.calendar.firstStudentDay = "2026-08-10";
  next.calendar.lastStudentDay = "2027-05-26";
  next.plans = [lesson()];
  return next;
}

const section: Section = { id: "section-a", courseId: "course-a", name: "AP Art History", periodLabel: "2" };

test("Day projects exact Section plans without inventing a Classes destination", () => {
  const source = workspace();
  assert.equal(sectionPlans(source, section, "2026-09-08").length, 1);
  assert.equal(sectionPlans(source, { ...section, id: "section-b" }, "2026-09-08").length, 0);
});

test("legacy workspaces derive a temporary Section per Course without mutating Course truth", () => {
  const source = workspace();
  source.sections = undefined;
  const derived = effectiveSections(source);
  assert.equal(derived.length, 1);
  assert.equal(derived[0].id, "derived:course-a");
  assert.equal(source.sections, undefined);
});

test("unfinished earlier lesson appears as carryover and completed lesson does not", () => {
  const source = workspace();
  assert.equal(carryoverPlans(source, section, "2026-09-09").length, 1);
  source.plans[0] = applyLiveOutcome(source.plans[0], section.id, "2026-09-08", { type: "complete" });
  assert.equal(carryoverPlans(source, section, "2026-09-09").length, 0);
});

test("Live launches only exact eligible Section + Lesson on instructional date", () => {
  const source = workspace();
  assert.deepEqual(liveEligibility(source, source.plans[0], section, "2026-09-08"), { ok: true });
  assert.equal(liveEligibility(source, source.plans[0], section, "2026-09-09").ok, false);
  source.calendar.noSchoolDates = [{ id: "x", date: "2026-09-08", label: "No school" }];
  assert.deepEqual(liveEligibility(source, source.plans[0], section, "2026-09-08"), { ok: false, reason: "not-instructional-day" });
});

test("completed and skipped teaching states cannot relaunch", () => {
  const complete = workspace();
  complete.plans[0] = applyLiveOutcome(complete.plans[0], section.id, "2026-09-08", { type: "complete" });
  assert.deepEqual(liveEligibility(complete, complete.plans[0], section, "2026-09-08"), { ok: false, reason: "already-finished" });

  const skipped = workspace();
  skipped.plans[0] = applyLiveOutcome(skipped.plans[0], section.id, "2026-09-08", { type: "skip" });
  assert.deepEqual(liveEligibility(skipped, skipped.plans[0], section, "2026-09-08"), { ok: false, reason: "already-finished" });
});

test("Stop here requires a resume note and preserves exact Section state", () => {
  const source = lesson();
  const rejected = applyLiveOutcome(source, section.id, "2026-09-08", { type: "stop", resumeNote: "   " });
  assert.equal(rejected, source);
  const stopped = applyLiveOutcome(source, section.id, "2026-09-08", { type: "stop", resumeNote: "Start with slide 6" }, "2026-09-08T15:00:00.000Z");
  assert.equal(stopped.sectionDelivery?.[section.id].state, "in-progress");
  assert.equal(stopped.sectionDelivery?.[section.id].resumeNote, "Start with slide 6");
  assert.equal(stopped.sectionDelivery?.[section.id].actualTaughtDate, "2026-09-08");
});

test("stale Live writeback fails closed when canonical context changes", () => {
  const source = workspace();
  assert.equal(canWriteLiveOutcome(source, "lesson-1", "section-a", "2026-09-08"), true);
  source.plans[0] = { ...source.plans[0], date: "2026-09-09" };
  assert.equal(canWriteLiveOutcome(source, "lesson-1", "section-a", "2026-09-08"), false);
});
