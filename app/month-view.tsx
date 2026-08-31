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

export function MonthView({ workspace, anchor, courseId, selectedPlanId, pasteTargetDate, onSelectPlan, onSelectDate, onMovePlan }: MonthViewProps) {
  const weeks = monthWeeks(anchor);
  const course = workspace.courses.find((item) => item.id === courseId);
  const label = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="monthSurface" aria-label={`${label} planning view`}>
      <div className="rangeViewHeader"><div><p className="eyebrow">Month</p><h2>{label}</h2></div><span>{course?.name ?? "Choose a class"}</span></div>
      <div className="monthDayLabels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
      <div className="monthWeeks">
        {weeks.map((week) => (
          <div className="monthWeek" key={week.key}>
            {week.days.map((day) => {
              const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.parentUnitId === null && plan.courseId === courseId && plan.date === day.key);
              const target = pasteTargetDate === day.key;
              return (
                <div className={`monthDay${day.inPrimaryMonth ? "" : " outsideMonth"}${target ? " pasteTarget" : ""}`} key={day.key} onClick={() => onSelectDate(day.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, courseId); }}>
                  <span className="monthDate">{day.date.getDate()}</span>
                  <div className="monthPlans">
                    {plans.map((plan) => (
                      <button type="button" draggable className={`${plan.type === "unit" ? "monthPlan unit" : "monthPlan"}${selectedPlanId === plan.id ? " selected" : ""}`} key={plan.id} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }}>
                        <span>{plan.title}</span>{plan.type === "unit" && <small>Unit</small>}
                      </button>
                    ))}
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
