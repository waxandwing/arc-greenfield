"use client";

import type { Plan, Workspace } from "../lib/domain";
import { monthWeeks } from "../lib/view-ranges";
import { RangeQuickAdd } from "./range-quick-add";

export type MonthViewProps = {
  workspace: Workspace;
  anchor: Date;
  courseId: string;
  selectedPlanId: string | null;
  pasteTargetDate: string | null;
  onSelectPlan: (plan: Plan) => void;
  onSelectDate: (date: string) => void;
  onMovePlan: (planId: string, date: string, courseId: string) => void;
  onAddPlan: (title: string, type: "lesson" | "unit", date: string) => void;
  onNestLesson: (unitId: string, lessonId: string) => void;
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
  return workspace.plans.filter((plan) => plan.parentUnitId === unitId).sort((a, b) => (a.childOrder ?? 0) - (b.childOrder ?? 0));
}

function ownerUnit(workspace: Workspace, lesson: Plan) {
  if (!lesson.parentUnitId) return null;
  return workspace.plans.find((plan) => plan.id === lesson.parentUnitId && plan.type === "unit") ?? null;
}

function shortDate(value: string | null) {
  if (!value) return "unscheduled";
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function MonthView({ workspace, anchor, courseId, selectedPlanId, pasteTargetDate, onSelectPlan, onSelectDate, onMovePlan, onAddPlan, onNestLesson }: MonthViewProps) {
  const weeks = monthWeeks(anchor);
  const course = workspace.courses.find((item) => item.id === courseId);
  const label = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstPrimaryDay = weeks.flatMap((week) => week.days).find((day) => day.inPrimaryMonth)?.key ?? weeks[0]?.days[0]?.key ?? "";
  const defaultAddDate = pasteTargetDate ?? firstPrimaryDay;

  return (
    <section className="monthSurface" aria-label={`${label} planning view`}>
      <div className="rangeViewHeader"><div><p className="eyebrow">Month</p><h2>{label}</h2><p>Move Units as sequences. Drop a Lesson on a Unit to nest it.</p></div><div className="rangeHeaderActions"><span>{course?.name ?? "Choose a class"}</span><RangeQuickAdd defaultDate={defaultAddDate} onAdd={onAddPlan} /></div></div>
      <div className="monthDayLabels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
      <div className="monthWeeks">
        {weeks.map((week) => <div className="monthWeek" key={week.key}>{week.days.map((day) => {
          const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.parentUnitId === null && plan.courseId === courseId && coversDate(plan, day.key));
          const nestedLessons = workspace.plans.filter((plan) => { if (plan.location !== "calendar" || plan.courseId !== courseId || plan.type !== "lesson" || !plan.parentUnitId || plan.date !== day.key) return false; const unit = ownerUnit(workspace, plan); return Boolean(unit && !workspace.preferences.collapsedUnitIds.includes(unit.id)); });
          const target = pasteTargetDate === day.key;
          return <div className={`monthDay${day.inPrimaryMonth ? "" : " outsideMonth"}${target ? " pasteTarget" : ""}`} key={day.key} onClick={() => onSelectDate(day.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, courseId); }}>
            <button type="button" className="monthDate" aria-label={`Select ${day.key} as paste target`} onClick={(event) => { event.stopPropagation(); onSelectDate(day.key); }}>{day.date.getDate()}</button>{target && <span className="pasteTargetLabel">Paste here</span>}
            <div className="monthPlans">{plans.map((plan) => { const children = plan.type === "unit" ? unitChildren(workspace, plan.id) : []; const childCount = children.length; const isSpanStart = plan.type !== "unit" || plan.date === day.key; return <button type="button" draggable className={`${plan.type === "unit" ? "monthPlan unit" : "monthPlan"}${spanClass(plan, day.key)}${selectedPlanId === plan.id ? " selected" : ""}`} key={`${plan.id}-${day.key}`} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onDragOver={plan.type === "unit" ? (event) => { event.preventDefault(); event.stopPropagation(); } : undefined} onDrop={plan.type === "unit" ? (event) => { event.preventDefault(); event.stopPropagation(); const lessonId = event.dataTransfer.getData("text/arc-plan"); if (lessonId && lessonId !== plan.id) onNestLesson(plan.id, lessonId); } : undefined} onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }} aria-label={plan.type === "unit" ? `${plan.title}, Unit from ${plan.date} to ${plan.endDate ?? plan.date}, ${childCount} lessons` : plan.title}><span>{isSpanStart ? plan.title : <span aria-hidden="true">↳</span>}</span>{plan.type === "unit" && isSpanStart && <small>{childCount} lesson{childCount === 1 ? "" : "s"}</small>}{plan.type === "unit" && isSpanStart && children.length > 0 && <span className="unitSequencePreview" aria-hidden="true">{children.slice(0, 3).map((child) => <span key={child.id}>{shortDate(child.date)} · {child.title}</span>)}{children.length > 3 && <span>+{children.length - 3} more</span>}</span>}</button>; })}
            {nestedLessons.map((lesson) => { const unit = ownerUnit(workspace, lesson); return <button type="button" draggable className={`monthPlan rangeNestedLesson${selectedPlanId === lesson.id ? " selected" : ""}`} key={lesson.id} onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/arc-plan", lesson.id); event.dataTransfer.effectAllowed = "move"; }} onClick={(event) => { event.stopPropagation(); onSelectPlan(lesson); }} aria-label={`${lesson.title}${unit ? `, Lesson in ${unit.title}` : ""}`}><small>{unit?.title ?? "Lesson"}</small><span>{lesson.title}</span></button>; })}</div>
          </div>;
        })}</div>)}
      </div>
    </section>
  );
}
