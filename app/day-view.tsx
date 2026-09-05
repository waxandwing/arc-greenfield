"use client";

import { useMemo, useState } from "react";
import type { Plan, Section, Workspace } from "../lib/domain";
import { afterSchoolPlans, carryoverPlans, effectiveSections, sectionPlans } from "../lib/day-context";
import { liveEligibility } from "../lib/live-classroom";

type Props = {
  workspace: Workspace;
  date: string;
  selectedPlanId: string | null;
  onSelectPlan: (plan: Plan) => void;
  onAddPlan: (title: string, type: "lesson" | "note", courseId: string | null, date: string, sectionId?: string | null, details?: Record<string, string>) => void;
  onLaunchLive: (plan: Plan, section: Section) => void;
};

export function DayView({ workspace, date, selectedPlanId, onSelectPlan, onAddPlan, onLaunchLive }: Props) {
  const sections = useMemo(() => effectiveSections(workspace), [workspace]);
  const [isolatedSectionId, setIsolatedSectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ sectionId: string; title: string } | null>(null);
  const [afterSchoolDraft, setAfterSchoolDraft] = useState("");
  const visibleSections = isolatedSectionId ? sections.filter((section) => section.id === isolatedSectionId) : sections;
  const afterSchool = afterSchoolPlans(workspace, date);

  return (
    <div className="dayView">
      <header className="dayViewHeader">
        <div>
          <span className="eyebrow">Day</span>
          <h2>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
        </div>
        <label className="dayIsolation">
          <span>Class focus</span>
          <select value={isolatedSectionId ?? "all"} onChange={(event) => setIsolatedSectionId(event.target.value === "all" ? null : event.target.value)}>
            <option value="all">All classes</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.periodLabel} · {section.name}</option>)}
          </select>
        </label>
      </header>

      <div className="daySections">
        {visibleSections.map((section) => {
          const plans = sectionPlans(workspace, section, date);
          const carryover = carryoverPlans(workspace, section, date);
          return (
            <section className="daySection" key={section.id}>
              <header>
                <i style={{ background: section.color ?? workspace.courses.find((course) => course.id === section.courseId)?.color }} />
                <div><strong>{section.name}</strong><span>{section.periodLabel}</span></div>
                <button type="button" onClick={() => setIsolatedSectionId(isolatedSectionId === section.id ? null : section.id)}>{isolatedSectionId === section.id ? "Show all" : "Focus"}</button>
              </header>

              {carryover.length > 0 && (
                <div className="carryoverBlock">
                  <span>Carryover</span>
                  {carryover.map((plan) => <button key={plan.id} type="button" onClick={() => onSelectPlan(plan)}>{plan.title}<small>{plan.date}</small></button>)}
                </div>
              )}

              <div className="todayPlanBlock">
                <span>Today’s plan</span>
                {plans.length === 0 && <p>Nothing placed yet.</p>}
                {plans.map((plan) => {
                  const eligibility = liveEligibility(workspace, plan, section, date);
                  const delivery = plan.sectionDelivery?.[section.id];
                  return (
                    <article key={plan.id} className={selectedPlanId === plan.id ? "dayPlan selected" : "dayPlan"}>
                      <button className="dayPlanMain" type="button" onClick={() => onSelectPlan(plan)}>
                        <strong>{plan.title}</strong>
                        <small>{plan.type}{delivery ? ` · ${delivery.state}` : ""}</small>
                      </button>
                      {eligibility.ok && <button type="button" className="liveLaunch" onClick={() => onLaunchLive(plan, section)}>Teach</button>}
                    </article>
                  );
                })}
              </div>

              {draft?.sectionId === section.id ? (
                <div className="dayComposer">
                  <input autoFocus value={draft.title} onChange={(event) => setDraft({ sectionId: section.id, title: event.target.value })} onKeyDown={(event) => {
                    if (event.key === "Enter" && draft.title.trim()) {
                      onAddPlan(draft.title.trim(), "lesson", section.courseId, date, section.id);
                      setDraft(null);
                    }
                    if (event.key === "Escape") setDraft(null);
                  }} placeholder="Lesson title" />
                  <button type="button" onClick={() => { if (draft.title.trim()) { onAddPlan(draft.title.trim(), "lesson", section.courseId, date, section.id); setDraft(null); } }}>Add</button>
                </div>
              ) : <button type="button" className="dayAdd" onClick={() => setDraft({ sectionId: section.id, title: "" })}>＋ Lesson</button>}
            </section>
          );
        })}
      </div>

      <section className="afterSchoolLane">
        <header><div><span className="eyebrow">Optional</span><strong>After School / Notes</strong></div></header>
        <div className="afterSchoolItems">
          {afterSchool.map((plan) => <button key={plan.id} type="button" onClick={() => onSelectPlan(plan)}>{plan.title}</button>)}
        </div>
        <div className="afterSchoolComposer">
          <input value={afterSchoolDraft} onChange={(event) => setAfterSchoolDraft(event.target.value)} placeholder="Meeting, reminder, note…" onKeyDown={(event) => {
            if (event.key === "Enter" && afterSchoolDraft.trim()) {
              onAddPlan(afterSchoolDraft.trim(), "note", null, date, null, { surface: "after-school" });
              setAfterSchoolDraft("");
            }
          }} />
          <button type="button" onClick={() => { if (afterSchoolDraft.trim()) { onAddPlan(afterSchoolDraft.trim(), "note", null, date, null, { surface: "after-school" }); setAfterSchoolDraft(""); } }}>Add</button>
        </div>
      </section>
    </div>
  );
}
