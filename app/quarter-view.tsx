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

function unitChildren(workspace: Workspace, unitId: string) {
  return workspace.plans
    .filter((plan) => plan.parentUnitId === unitId)
    .sort((a, b) => (a.childOrder ?? 0) - (b.childOrder ?? 0));
}

function shortDate(value: string | null) {
  if (!value) return "unscheduled";
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function QuarterView({ workspace, range, courseId, selectedPlanId, pasteTargetDate, onSelectPlan, onSelectDate, onMovePlan }: QuarterViewProps) {
  const course = workspace.courses.find((item) => item.id === courseId);
  return (
    <section className="quarterSurface" aria-label={`${range.label} planning view`}>
      <div className="rangeViewHeader"><div><p className="eyebrow">Quarter</p><h2>{range.label}</h2><p>{range.start} – {range.end} · Units span their instructional run instead of collapsing into one-day cards.</p></div><span>{course?.name ?? "Choose a class"}</span></div>
      <div className="quarterWeeks">
        {range.weeks.map((week, index) => (
          <section className="quarterWeek" key={week.key}>
            <header><span>Week {index + 1}</span><small>{week.days[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></header>
            <div className="quarterDays">
              {week.days.map((day) => {
                const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.parentUnitId === null && plan.courseId === courseId && coversDate(plan, day.key));
                const target = pasteTargetDate === day.key;
                return (
                  <div className={`quarterDay${target ? " pasteTarget" : ""}`} key={day.key} onClick={() => onSelectDate(day.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, courseId); }}>
                    <span className="quarterDate">{day.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
                    {target && <span className="pasteTargetLabel">Paste here</span>}
                    <div className="quarterPlans">
                      {plans.map((plan) => {
                        const children = plan.type === "unit" ? unitChildren(workspace, plan.id) : [];
                        const childCount = children.length;
                        const isSpanStart = plan.type !== "unit" || plan.date === day.key;
                        return (
                          <button type="button" draggable className={`${plan.type === "unit" ? "quarterPlan unit" : "quarterPlan"}${spanClass(plan, day.key)}${selectedPlanId === plan.id ? " selected" : ""}`} key={`${plan.id}-${day.key}`} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }} aria-label={plan.type === "unit" ? `${plan.title}, Unit from ${plan.date} to ${plan.endDate ?? plan.date}, ${childCount} lessons` : plan.title}>
                            <span>{isSpanStart ? plan.title : <span aria-hidden="true">↳</span>}</span>{plan.type === "unit" && isSpanStart && <small>{childCount} lesson{childCount === 1 ? "" : "s"}</small>}
                            {plan.type === "unit" && isSpanStart && children.length > 0 && <span className="unitSequencePreview" aria-hidden="true">{children.slice(0, 3).map((child) => <span key={child.id}>{shortDate(child.date)} · {child.title}</span>)}{children.length > 3 && <span>+{children.length - 3} more</span>}</span>}
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
