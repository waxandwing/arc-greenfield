"use client";

import type { Plan, Workspace } from "../lib/domain";
import {
  nestedLessonsForDate,
  ownerUnit,
  rootPlansForDate,
  shortPlanDate,
  unitChildren,
  unitSpanPosition
} from "../lib/plan-selectors";
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
};

export function MonthView({
  workspace,
  anchor,
  courseId,
  selectedPlanId,
  pasteTargetDate,
  onSelectPlan,
  onSelectDate,
  onMovePlan,
  onAddPlan
}: MonthViewProps) {
  const weeks = monthWeeks(anchor);
  const course = workspace.courses.find((item) => item.id === courseId);
  const label = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstPrimaryDay = weeks.flatMap((week) => week.days).find((day) => day.inPrimaryMonth)?.key ?? weeks[0]?.days[0]?.key ?? "";
  const defaultAddDate = pasteTargetDate ?? firstPrimaryDay;

  return (
    <section className="monthSurface" aria-label={`${label} planning view`}>
      <div className="rangeViewHeader">
        <div>
          <p className="eyebrow">Month</p>
          <h2>{label}</h2>
          <p>Move Units as sequences or pick up one Lesson without flattening the Unit.</p>
        </div>
        <div className="rangeHeaderActions">
          <span>{course?.name ?? "Choose a class"}</span>
          <RangeQuickAdd defaultDate={defaultAddDate} onAdd={onAddPlan} />
        </div>
      </div>

      <div className="monthDayLabels" aria-hidden="true">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
      </div>

      <div className="monthWeeks">
        {weeks.map((week) => (
          <div className="monthWeek" key={week.key}>
            {week.days.map((day) => {
              const plans = rootPlansForDate(workspace, courseId, day.key);
              const nestedLessons = nestedLessonsForDate(workspace, courseId, day.key);
              const target = pasteTargetDate === day.key;

              return (
                <div
                  className={`monthDay${day.inPrimaryMonth ? "" : " outsideMonth"}${target ? " pasteTarget" : ""}`}
                  key={day.key}
                  onClick={() => onSelectDate(day.key)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const planId = event.dataTransfer.getData("text/arc-plan");
                    if (planId) onMovePlan(planId, day.key, courseId);
                  }}
                >
                  <span className="monthDate">{day.date.getDate()}</span>
                  {target && <span className="pasteTargetLabel">Paste here</span>}
                  <div className="monthPlans">
                    {plans.map((plan) => {
                      const children = plan.type === "unit" ? unitChildren(workspace, plan.id) : [];
                      const childCount = children.length;
                      const isSpanStart = plan.type !== "unit" || plan.date === day.key;
                      const spanPosition = unitSpanPosition(plan, day.key);
                      return (
                        <button
                          type="button"
                          draggable
                          className={`${plan.type === "unit" ? "monthPlan unit" : "monthPlan"}${spanPosition ? ` ${spanPosition}` : ""}${selectedPlanId === plan.id ? " selected" : ""}`}
                          key={`${plan.id}-${day.key}`}
                          onDragStart={(event) => {
                            event.stopPropagation();
                            event.dataTransfer.setData("text/arc-plan", plan.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }}
                          aria-label={plan.type === "unit" ? `${plan.title}, Unit from ${plan.date} to ${plan.endDate ?? plan.date}, ${childCount} lessons` : plan.title}
                        >
                          <span>{isSpanStart ? plan.title : <span aria-hidden="true">↳</span>}</span>
                          {plan.type === "unit" && isSpanStart && <small>{childCount} lesson{childCount === 1 ? "" : "s"}</small>}
                          {plan.type === "unit" && isSpanStart && children.length > 0 && (
                            <span className="unitSequencePreview" aria-hidden="true">
                              {children.slice(0, 3).map((child) => <span key={child.id}>{shortPlanDate(child.date)} · {child.title}</span>)}
                              {children.length > 3 && <span>+{children.length - 3} more</span>}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {nestedLessons.map((lesson) => {
                      const unit = ownerUnit(workspace, lesson);
                      return (
                        <button
                          type="button"
                          draggable
                          className={`monthPlan rangeNestedLesson${selectedPlanId === lesson.id ? " selected" : ""}`}
                          key={lesson.id}
                          onDragStart={(event) => {
                            event.stopPropagation();
                            event.dataTransfer.setData("text/arc-plan", lesson.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={(event) => { event.stopPropagation(); onSelectPlan(lesson); }}
                          aria-label={`${lesson.title}${unit ? `, Lesson in ${unit.title}` : ""}`}
                        >
                          <small>{unit?.title ?? "Lesson"}</small>
                          <span>{lesson.title}</span>
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
