"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan, Workspace } from "../lib/domain";
import { orderedUnitChildren } from "../lib/plan-tree";
import type { WeekDay } from "./week-planner";

type Props = {
  workspace: Workspace;
  days: WeekDay[];
  selectedPlanId: string | null;
  isPasteTarget: boolean;
  onSelectPlan: (plan: Plan) => void;
  onSelectTarget: (courseId: string | null) => void;
  onCreateIdea: (id: string, title: string, courseId: string) => void;
  onMoveToCalendar: (planId: string, date: string, courseId: string) => void;
  onDeletePlan: (planId: string) => void;
  onMoveToIdeas: (planId: string) => void;
};

export function IdeasWorkbench({
  workspace,
  days,
  selectedPlanId,
  isPasteTarget,
  onSelectPlan,
  onSelectTarget,
  onCreateIdea,
  onMoveToCalendar,
  onDeletePlan,
  onMoveToIdeas
}: Props) {
  const [draftTitle, setDraftTitle] = useState("");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    if (courseId && workspace.courses.some((course) => course.id === courseId)) return;
    setCourseId(workspace.courses[0]?.id ?? "");
  }, [courseId, workspace.courses]);

  const rootIdeas = useMemo(
    () => workspace.plans.filter((plan) => plan.location === "ideas" && plan.parentUnitId === null),
    [workspace.plans]
  );

  function submitIdea() {
    const title = draftTitle.trim();
    if (!title || !courseId) return;
    onCreateIdea(crypto.randomUUID(), title, courseId);
    setDraftTitle("");
  }

  return (
    <section
      className={isPasteTarget ? "ideasPanel pasteTarget" : "ideasPanel"}
      aria-label="Ideas"
      onClick={() => onSelectTarget(courseId || null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const planId = event.dataTransfer.getData("text/arc-plan");
        if (planId) onMoveToIdeas(planId);
      }}
    >
      <div className="ideasHeading">
        <div>
          <p className="eyebrow">Ideas</p>
          <h2>Things worth keeping.</h2>
        </div>
        <span aria-label={`${rootIdeas.length} ideas`}>{rootIdeas.length}</span>
      </div>

      <div className="ideaAdder">
        <input
          value={draftTitle}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submitIdea(); }}
          placeholder="Catch an idea…"
          aria-label="New idea"
        />
        <select
          aria-label="Class for new idea"
          value={courseId}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setCourseId(event.target.value)}
        >
          <option value="" disabled>Class</option>
          {workspace.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}
        </select>
        <button
          type="button"
          aria-label="Add idea"
          disabled={!courseId || !draftTitle.trim()}
          onClick={(event) => { event.stopPropagation(); submitIdea(); }}
        >＋</button>
      </div>

      <div className="ideaList">
        {rootIdeas.map((plan) => {
          const course = workspace.courses.find((item) => item.id === plan.courseId);
          const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : [];
          return (
            <article
              key={plan.id}
              className={`${plan.type === "unit" ? "ideaCard unitIdea" : "ideaCard"}${selectedPlanId === plan.id ? " selected" : ""}`}
              draggable
              tabIndex={0}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/arc-plan", plan.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={(event) => { event.stopPropagation(); onSelectPlan(plan); }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectPlan(plan);
                }
              }}
            >
              <div className="ideaCardHeader">
                <strong>{plan.title}</strong>
                {course && <span style={{ borderColor: course.color }}>{course.name}</span>}
              </div>
              {plan.type === "unit" && <small className="ideaUnitMeta">Unit · {children.length} lesson{children.length === 1 ? "" : "s"}</small>}
              <div className="ideaDates" aria-label={`Schedule ${plan.title}`}>
                {days.map((day) => (
                  <button
                    type="button"
                    key={day.key}
                    onClick={(event) => {
                      event.stopPropagation();
                      const targetCourseId = plan.courseId ?? workspace.courses[0]?.id;
                      if (targetCourseId) onMoveToCalendar(plan.id, day.key, targetCourseId);
                    }}
                  >{day.label}</button>
                ))}
              </div>
              <button
                type="button"
                className="ideaDelete"
                onClick={(event) => { event.stopPropagation(); onDeletePlan(plan.id); }}
              >Delete</button>
            </article>
          );
        })}
        {rootIdeas.length === 0 && <p className="emptyNote">Loose thoughts can live here before they have a date.</p>}
      </div>
    </section>
  );
}
