"use client";

import type { Plan, Workspace } from "../lib/domain";
import styles from "./day-recovery.module.css";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function activeOnDate(plan: Plan, date: string) {
  if (plan.location !== "calendar" || !plan.date) return false;
  if (plan.type === "unit") return plan.date <= date && (plan.endDate ?? plan.date) >= date;
  return plan.date === date;
}

function nextLesson(workspace: Workspace, courseId: string, date: string) {
  return workspace.plans
    .filter((plan) => plan.type === "lesson" && plan.location === "calendar" && plan.courseId === courseId && Boolean(plan.date && plan.date > date))
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.childOrder ?? 0) - (b.childOrder ?? 0))[0] ?? null;
}

type DeliveryState = "taught" | "partial" | "missed";

const DELIVERY_OPTIONS: Array<{ value: DeliveryState; label: string }> = [
  { value: "taught", label: "Taught" },
  { value: "partial", label: "Partly taught" },
  { value: "missed", label: "Didn’t get to it" }
];

function deliveryState(lesson: Plan): DeliveryState | null {
  const stored = lesson.details.deliveryState;
  if (stored === "taught" || stored === "partial" || stored === "missed") return stored;
  if (lesson.details.taught === "true") return "taught";
  return null;
}

export function DayPlanningView({ workspace, date, onSelectPlan, onPatchPlan }: {
  workspace: Workspace;
  date: string;
  onSelectPlan: (plan: Plan) => void;
  onPatchPlan: (id: string, patch: Partial<Plan>) => void;
}) {
  const noSchool = workspace.calendar.noSchoolDates.find((item) => item.date === date);
  const scheduledLessonCount = workspace.plans.filter((plan) => plan.type === "lesson" && activeOnDate(plan, date)).length;

  return (
    <section className="arcDayView dayTeachingDesk" aria-label={`Day plan for ${date}`}>
      <header className="dayTeachingHeader">
        <div>
          <p className="eyebrow">Teach from today</p>
          <h2>{parseDate(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
          <p className="dayTeachingSummary">{scheduledLessonCount ? `${scheduledLessonCount} lesson${scheduledLessonCount === 1 ? "" : "s"} on deck.` : "A clear day. Add only what you need."}</p>
        </div>
        {noSchool && <span className="dayNoSchool">{noSchool.label || "No school"} · planning stays available</span>}
      </header>

      <div className="dayCourseStack">
        {workspace.courses.map((course) => {
          const activeUnits = workspace.plans.filter((plan) => plan.type === "unit" && plan.courseId === course.id && activeOnDate(plan, date));
          const lessons = workspace.plans.filter((plan) => plan.type === "lesson" && plan.courseId === course.id && activeOnDate(plan, date)).sort((a, b) => (a.childOrder ?? 999) - (b.childOrder ?? 999));
          const notes = workspace.plans.filter((plan) => plan.type === "note" && plan.courseId === course.id && activeOnDate(plan, date));
          const next = nextLesson(workspace, course.id, date);

          return (
            <article className="dayCourse teachingCard" style={{ ["--course-color" as string]: course.color }} key={course.id}>
              <header className="dayCourseHeader"><i aria-hidden="true" /><div><h3>{course.name}</h3><span>{course.periodLabel || "Period not set"}</span></div></header>

              {activeUnits.length > 0 && <div className="dayUnitContext"><span>Active Unit</span>{activeUnits.map((unit) => <button type="button" key={unit.id} onClick={() => onSelectPlan(unit)}>{unit.title}</button>)}</div>}

              <div className="dayLessonList">
                {lessons.map((lesson) => {
                  const state = deliveryState(lesson);
                  const recoveryNeeded = state === "partial" || state === "missed";
                  return <section className={`dayLessonCard${state === "taught" ? " taught" : ""}${recoveryNeeded ? ` ${styles.recoveryNeeded}` : ""}`} key={lesson.id}>
                    <div className="dayLessonTop"><button type="button" className="dayLessonTitle" onClick={() => onSelectPlan(lesson)}>{lesson.title}</button></div>
                    {lesson.notes && <p className="dayLessonNotes">{lesson.notes}</p>}
                    {lesson.resources.length > 0 && <div className="dayResources" aria-label={`${lesson.title} resources`}>{lesson.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>)}</div>}

                    <fieldset className={styles.deliveryState}>
                      <legend>What actually happened?</legend>
                      <div className={styles.deliveryOptions}>
                        {DELIVERY_OPTIONS.map((option) => <button
                          type="button"
                          key={option.value}
                          aria-pressed={state === option.value}
                          onClick={() => onPatchPlan(lesson.id, {
                            details: {
                              ...lesson.details,
                              deliveryState: option.value,
                              taught: option.value === "taught" ? "true" : "false",
                              taughtOn: option.value === "taught" ? date : "",
                              recoveryHandled: option.value === "taught" ? "" : lesson.details.recoveryHandled ?? ""
                            }
                          })}
                        >{option.label}</button>)}
                      </div>
                    </fieldset>

                    {recoveryNeeded && <p className={styles.recoveryCue}>Keep the record here. Recovery can carry the unfinished work forward without pretending today went differently.</p>}
                    <label className="dayReflection"><span>What changed?</span><textarea rows={2} value={lesson.details.dayReflection ?? ""} onChange={(event) => onPatchPlan(lesson.id, { details: { ...lesson.details, dayReflection: event.target.value } })} placeholder="A sentence is enough." /></label>
                  </section>;
                })}
                {!lessons.length && <p className="emptyNote">No Lesson scheduled for this class today.</p>}
              </div>

              {notes.length > 0 && <div className="dayNotes"><span>Notes</span>{notes.map((note) => <button type="button" key={note.id} onClick={() => onSelectPlan(note)}>{note.title}</button>)}</div>}
              {next && <div className="dayNext"><span>Next</span><button type="button" onClick={() => onSelectPlan(next)}>{next.date?.slice(5)} · {next.title}</button></div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
