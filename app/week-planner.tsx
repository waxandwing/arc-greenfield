"use client";

import { useState } from "react";
import type { Course, Plan, Workspace } from "../lib/domain";
import { orderedUnitChildren } from "../lib/plan-tree";

export type WeekDay = { label: string; key: string; number: number; month: string };

type Props = {
  workspace: Workspace;
  days: WeekDay[];
  weekLabel: string;
  selectedPlanId: string | null;
  pasteTarget: { courseId: string | null; date: string | null; location: "calendar" | "ideas" } | null;
  onSelectPlan: (plan: Plan) => void;
  onSelectDate: (courseId: string, date: string) => void;
  onMovePlan: (id: string, date: string, courseId: string) => void;
  onAddPlan: (title: string, type: "lesson" | "unit", courseId: string, date: string) => void;
  onAddChildLesson: (unit: Plan, title: string) => void;
  onToggleUnit: (unitId: string) => void;
  onDeletePlan: (id: string) => void;
  onReturnToIdeas: (id: string) => void;
};

export function WeekPlanner({ workspace, days, weekLabel, selectedPlanId, pasteTarget, onSelectPlan, onSelectDate, onMovePlan, onAddPlan, onAddChildLesson, onToggleUnit, onDeletePlan, onReturnToIdeas }: Props) {
  const [cellDraft, setCellDraft] = useState<{ courseId: string; date: string; mode: "lesson" | "unit"; title: string } | null>(null);
  const [unitDraft, setUnitDraft] = useState<{ courseId: string; title: string } | null>(null);
  const [childDraft, setChildDraft] = useState<{ unitId: string; title: string } | null>(null);

  function submitCell() {
    if (!cellDraft?.title.trim()) return;
    onAddPlan(cellDraft.title.trim(), cellDraft.mode, cellDraft.courseId, cellDraft.date);
    setCellDraft(null);
  }

  function submitClassUnit(course: Course) {
    if (!unitDraft?.title.trim() || unitDraft.courseId !== course.id) return;
    onAddPlan(unitDraft.title.trim(), "unit", course.id, days[0].key);
    setUnitDraft(null);
  }

  return <>
    <div className="calendarHeader"><div><span className="viewName">{weekLabel}</span><strong>Move the plan, not the teacher. Units carry their lessons; lessons can move on their own.</strong></div></div>
    <div className="weekHeader"><span />{days.map((day) => <div key={day.key}><span>{day.label}</span><b>{day.number}</b></div>)}</div>
    <div className="classRows">{workspace.courses.map((course) => {
      const classUnitEditing = unitDraft?.courseId === course.id;
      return <div className="classRow" key={course.id}>
        <div className="classLabel">
          <i style={{ background: course.color }} /><span>{course.name}</span><small>{course.periodLabel}</small>
          {classUnitEditing ? <div className="classUnitComposer"><input autoFocus value={unitDraft.title} onChange={(e) => setUnitDraft({ courseId: course.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submitClassUnit(course); if (e.key === "Escape") setUnitDraft(null); }} placeholder="Unit title" /><button type="button" onClick={() => submitClassUnit(course)}>Add</button></div> : <button type="button" className="classUnitAdd" onClick={() => setUnitDraft({ courseId: course.id, title: "" })}>＋ Unit</button>}
        </div>
        <div className="dayCells">{days.map((day) => {
          const target = pasteTarget?.location === "calendar" && pasteTarget.courseId === course.id && pasteTarget.date === day.key;
          const roots = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && plan.parentUnitId === null && plan.date === day.key);
          const editing = cellDraft?.courseId === course.id && cellDraft.date === day.key;
          return <div className={target ? "dayCell pasteTarget" : "dayCell"} key={day.key} onClick={() => onSelectDate(course.id, day.key)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, course.id); }}>
            <div className="cellPlans">{roots.map((plan) => {
              const selected = selectedPlanId === plan.id;
              const collapsed = workspace.preferences.collapsedUnitIds.includes(plan.id);
              const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : [];
              return <article key={plan.id} className={`${plan.type === "unit" ? "lessonMagnet unitMagnet" : "lessonMagnet"}${selected ? " selected" : ""}`} draggable onDragStart={(e) => { e.dataTransfer.setData("text/arc-plan", plan.id); e.dataTransfer.effectAllowed = "move"; }} onClick={(e) => { e.stopPropagation(); onSelectPlan(plan); }}>
                <div className="magnetTitleRow">{plan.type === "unit" && <button type="button" className="disclosureButton" aria-label={collapsed ? "Expand unit" : "Collapse unit"} aria-expanded={!collapsed} onClick={(e) => { e.stopPropagation(); onToggleUnit(plan.id); }}>{collapsed ? "▸" : "▾"}</button>}<strong>{plan.title}</strong>{plan.type === "unit" && <span className="unitCount">{children.length} lesson{children.length === 1 ? "" : "s"}</span>}</div>
                {plan.type === "unit" && !collapsed && <div className="unitChildren">{children.map((child) => <div key={child.id} role="button" tabIndex={0} draggable className={selectedPlanId === child.id ? "unitChild selected" : "unitChild"} onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/arc-plan", child.id); e.dataTransfer.effectAllowed = "move"; }} onClick={(e) => { e.stopPropagation(); onSelectPlan(child); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectPlan(child); } }}><span>{child.title}</span><small>{child.date ?? "Ideas"}</small></div>)}
                  {childDraft?.unitId === plan.id ? <div className="childComposer"><input autoFocus value={childDraft.title} onChange={(e) => setChildDraft({ unitId: plan.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && childDraft.title.trim()) { onAddChildLesson(plan, childDraft.title.trim()); setChildDraft(null); } if (e.key === "Escape") setChildDraft(null); }} placeholder="Lesson title" /><button type="button" onClick={() => { if (!childDraft.title.trim()) return; onAddChildLesson(plan, childDraft.title.trim()); setChildDraft(null); }}>Add</button></div> : <button type="button" className="addChild" onClick={(e) => { e.stopPropagation(); setChildDraft({ unitId: plan.id, title: "" }); }}>＋ Lesson</button>}
                </div>}
                <div className="magnetActions"><button type="button" onClick={(e) => { e.stopPropagation(); onReturnToIdeas(plan.id); }}>Ideas</button><button type="button" className="dangerAction" onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}>Delete</button></div>
              </article>;
            })}</div>
            {editing ? <div className="cellComposer"><div className="quickMode"><button type="button" className={cellDraft.mode === "lesson" ? "active" : ""} onClick={() => setCellDraft({ ...cellDraft, mode: "lesson" })}>Lesson</button><button type="button" className={cellDraft.mode === "unit" ? "active" : ""} onClick={() => setCellDraft({ ...cellDraft, mode: "unit" })}>Unit</button></div><input autoFocus value={cellDraft.title} onChange={(e) => setCellDraft({ ...cellDraft, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submitCell(); if (e.key === "Escape") setCellDraft(null); }} placeholder={cellDraft.mode === "unit" ? "Unit title" : "Lesson title"} /><button type="button" onClick={submitCell}>Add {cellDraft.mode}</button></div> : <button type="button" className="cellAdd" aria-label={`Add lesson or unit to ${course.name} on ${day.label}`} onClick={(e) => { e.stopPropagation(); setCellDraft({ courseId: course.id, date: day.key, mode: "lesson", title: "" }); }}>＋</button>}
          </div>;
        })}</div>
      </div>;
    })}</div>
  </>;
}
