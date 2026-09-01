"use client";

import type { Plan, Workspace } from "../lib/domain";
import { monthWeeks } from "../lib/view-ranges";

export type MonthViewProps = {
  workspace: Workspace;
  anchor: Date;
  courseId: string;
  selectedPlanId: string | null;
  pasteTargetDate: string | null;
  onSelectPlan: (plan: Plan) => void;
  onSelectDate: (date: string) => void;
  onMovePlan: (planId: string, date: string, courseId: string) => void;
};

function coversDate(plan: Plan, date: string) {
  if (plan.type !== "unit" || !plan.date) return plan.date === date;
  const end = plan.endDate ?? plan.date;
  return plan.date <= date && end >= date;
}

function spanClass(plan: Plan, date: string) {
  if (plan.type !== "unit" || !plan.date) return "";
  const end = plan.endDate ?? plan.date;
  if (plan.date === date && end === date) return " spanSingle";
  if (plan.date === date) return " spanStart";
  if (end === date) return " spanEnd";
  return " spanMiddle";
}

export function MonthView({ workspace, anchor, courseId, selectedPlanId, pasteTargetDate, onSelectPlan, onSelectDate, onMovePlan }: MonthViewProps) {
  const weeks = monthWeeks(anchor);
  const course = workspace.courses.find((item) => item.id === courseId);
  const label = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="monthSurface" aria-label={`${label} planning view`}>
      <div className="rangeViewHeader"><div><p className="eyebrow">Month</p><h2>{label}</h2><p>Units span the days they occupy. Move the whole Unit and its Lessons move with it.</p></div><span>{course?.name ?? "Choose a class"}</span></div>
      <div className="monthDayLabels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
      <div className="monthWeeks">
        {weeks.map((week) => (
          <div className="monthWeek" key={week.key}>
            {week.days.map((day) => {
              const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.parentUnitId === null && plan.courseId === courseId && coversDate(plan, day.key));
              const target = pasteTargetDate === day.key;
              return (
                <div className={`monthDay${day.inPrimaryMonth ? "" : " outsideMonth"}${target ? " pasteTarget" : ""}`} key={day.key} onClick={() => onSelectDate(day.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, courseId); }}>
                  <span className="monthDate">{day.date.getDate()}</span>
                  <div className="monthPlans">
                    {plans.map((plan) => {
                      const childCount = plan.type === "unit" ? workspace.plans.filter((child) => child.parentUnitId === plan.id).length : 0;
                      const isSpanStart = plan.type !== "unit" || plan.date === day.key;
                      return (
                        <button type="button" draggable className={`${plan.type === "unit" ? "monthPlan unit" : "monthPlan"}${spanClass(plan, day.key)}${selectedPlanId === plan.id ? " selected" : ""}`} key={`${plan.id}-${day.key}`} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }} aria-label={plan.type === "unit" ? `${plan.title}, Unit from ${plan.date} to ${plan.endDate ?? plan.date}, ${childCount} lessons` : plan.title}>
                          <span>{isSpanStart ? plan.title : <span aria-hidden="true">↳</span>}</span>{plan.type === "unit" && isSpanStart && <small>{childCount} lesson{childCount === 1 ? "" : "s"}</small>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
