"use client";

import type { Plan, Workspace } from "../lib/domain";
import type { QuarterRange } from "../lib/view-ranges";

export type QuarterViewProps = {
  workspace: Workspace;
  range: QuarterRange;
  courseId: string;
  selectedPlanId: string | null;
  pasteTargetDate: string | null;
  onSelectPlan: (plan: Plan) => void;
  onSelectDate: (date: string) => void;
  onMovePlan: (planId: string, date: string, courseId: string) => void;
};

export function QuarterView({ workspace, range, courseId, selectedPlanId, pasteTargetDate, onSelectPlan, onSelectDate, onMovePlan }: QuarterViewProps) {
  const course = workspace.courses.find((item) => item.id === courseId);
  return (
    <section className="quarterSurface" aria-label={`${range.label} planning view`}>
      <div className="rangeViewHeader"><div><p className="eyebrow">Quarter</p><h2>{range.label}</h2><p>{range.start} – {range.end} · Units stay intact when moved or pasted.</p></div><span>{course?.name ?? "Choose a class"}</span></div>
      <div className="quarterWeeks">
        {range.weeks.map((week, index) => (
          <section className="quarterWeek" key={week.key}>
            <header><span>Week {index + 1}</span><small>{week.days[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></header>
            <div className="quarterDays">
              {week.days.map((day) => {
                const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.parentUnitId === null && plan.courseId === courseId && plan.date === day.key);
                return (
                  <div className={`quarterDay${pasteTargetDate === day.key ? " pasteTarget" : ""}`} key={day.key} onClick={() => onSelectDate(day.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, courseId); }}>
                    <span className="quarterDate">{day.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
                    <div className="quarterPlans">
                      {plans.map((plan) => {
                        const childCount = plan.type === "unit" ? workspace.plans.filter((child) => child.parentUnitId === plan.id).length : 0;
                        return (
                          <button type="button" draggable className={`${plan.type === "unit" ? "quarterPlan unit" : "quarterPlan"}${selectedPlanId === plan.id ? " selected" : ""}`} key={plan.id} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }}>
                            <span>{plan.title}</span>{plan.type === "unit" && <small>{childCount} lesson{childCount === 1 ? "" : "s"}</small>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
