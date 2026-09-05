"use client";

import { useState } from "react";
import type { Course, Plan, Workspace } from "../lib/domain";
import { orderedUnitChildren } from "../lib/plan-tree";
import { CalendarObjectDetails } from "./calendar-object-details";

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
  onRenamePlan: (id: string, title: string) => void;
  onPatchPlan: (id: string, patch: Partial<Plan>) => void;
  onAddPlan: (title: string, type: "lesson" | "unit", courseId: string, date: string) => void;
  onAddChildLesson: (unit: Plan, title: string) => void;
  onToggleUnit: (unitId: string) => void;
  onDeletePlan: (id: string) => void;
  onReturnToIdeas: (id: string) => void;
};

type UnitDraft = { courseId: string; date: string; title: string };

function ownerUnit(workspace: Workspace, lesson: Plan) {
  if (!lesson.parentUnitId) return null;
  return workspace.plans.find((plan) => plan.id === lesson.parentUnitId && plan.type === "unit") ?? null;
}

function restoreCalendarObjectFocus(id: string) {
  window.requestAnimationFrame(() => document.getElementById(`calendar-object-${id}`)?.focus());
}

export function WeekPlanner({ workspace, days, weekLabel, selectedPlanId, pasteTarget, onSelectPlan, onSelectDate, onMovePlan, onRenamePlan, onPatchPlan, onAddPlan, onAddChildLesson, onToggleUnit, onDeletePlan, onReturnToIdeas }: Props) {
  const [cellDraft, setCellDraft] = useState<{ courseId: string; date: string; mode: "lesson" | "unit"; title: string } | null>(null);
  const [unitDraft, setUnitDraft] = useState<UnitDraft | null>(null);
  const [childDraft, setChildDraft] = useState<{ unitId: string; title: string } | null>(null);
  const [editDraft, setEditDraft] = useState<{ id: string; title: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  function submitCell() {
    if (!cellDraft?.title.trim()) return;
    onAddPlan(cellDraft.title.trim(), cellDraft.mode, cellDraft.courseId, cellDraft.date);
    setCellDraft(null);
  }

  function submitClassUnit(course: Course) {
    if (!unitDraft?.title.trim() || unitDraft.courseId !== course.id) return;
    onAddPlan(unitDraft.title.trim(), "unit", course.id, unitDraft.date);
    setUnitDraft(null);
  }

  function submitEdit() {
    if (!editDraft?.title.trim()) return;
    onRenamePlan(editDraft.id, editDraft.title.trim());
    setEditDraft(null);
  }

  function moveOneDay(plan: Plan, direction: -1 | 1) {
    if (!plan.date || !plan.courseId) return;
    const index = days.findIndex((day) => day.key === plan.date);
    const target = days[index + direction];
    if (!target) return;
    onMovePlan(plan.id, target.key, plan.courseId);
  }

  function closeDetails(id: string) {
    setDetailId(null);
    restoreCalendarObjectFocus(id);
  }

  function actionRow(plan: Plan) {
    const dayIndex = plan.date ? days.findIndex((day) => day.key === plan.date) : -1;
    return <div className="magnetActions" role="toolbar" aria-label={`Actions for ${plan.title}`}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setEditDraft({ id: plan.id, title: plan.title }); }}>Rename</button>
      <button type="button" aria-expanded={detailId === plan.id} onClick={(e) => { e.stopPropagation(); if (detailId === plan.id) closeDetails(plan.id); else setDetailId(plan.id); }}>More…</button>
      <button type="button" title="Move earlier" aria-label={`Move ${plan.title} earlier`} disabled={dayIndex <= 0} onClick={(e) => { e.stopPropagation(); moveOneDay(plan, -1); }}>Move ←</button>
      <button type="button" title="Move later" aria-label={`Move ${plan.title} later`} disabled={dayIndex < 0 || dayIndex >= days.length - 1} onClick={(e) => { e.stopPropagation(); moveOneDay(plan, 1); }}>Move →</button>
      <button type="button" onClick={(e) => { e.stopPropagation(); setDetailId(null); onReturnToIdeas(plan.id); }}>Put in Fridge</button>
      <button type="button" className="dangerAction" onClick={(e) => { e.stopPropagation(); setDetailId(null); onDeletePlan(plan.id); }}>Delete</button>
    </div>;
  }

  function editableTitle(plan: Plan, prefix?: React.ReactNode) {
    if (editDraft?.id === plan.id) {
      return <div className="weekInlineEdit" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={editDraft.title} onChange={(e) => setEditDraft({ id: plan.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") setEditDraft(null); }} aria-label={`Rename ${plan.title}`} />
        <button type="button" onClick={submitEdit}>Save</button>
        <button type="button" onClick={() => setEditDraft(null)}>Cancel</button>
      </div>;
    }
    return <div className="magnetTitleRow">{prefix}<strong>{plan.title}</strong></div>;
  }

  function detailPopover(plan: Plan) {
    if (detailId !== plan.id || selectedPlanId !== plan.id) return null;
    return <CalendarObjectDetails plan={plan} courses={workspace.courses} onRename={onRenamePlan} onMove={onMovePlan} onPatch={onPatchPlan} onClose={() => closeDetails(plan.id)} />;
  }

  return <>
    <div className="calendarHeader"><div><span className="viewName">{weekLabel}</span><strong>Units hold the sequence. Lessons live on the day you teach them.</strong></div></div>
    <div className="weekHeader"><span />{days.map((day) => <div key={day.key}><span>{day.label}</span><b>{day.number}</b></div>)}</div>
    <div className="classRows">{workspace.courses.map((course) => {
      const classUnitEditing = unitDraft?.courseId === course.id;
      const classUnits = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && plan.type === "unit" && plan.parentUnitId === null);
      return <div className="classRow" key={course.id}>
        <div className="classLabel">
          <i style={{ background: course.color }} /><span>{course.name}</span><small>{course.periodLabel}</small>
          {classUnitEditing ? <div className="classUnitComposer"><input autoFocus value={unitDraft.title} onChange={(e) => setUnitDraft({ ...unitDraft, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submitClassUnit(course); if (e.key === "Escape") setUnitDraft(null); }} placeholder="Unit title" /><select aria-label="Unit start day" value={unitDraft.date} onChange={(e) => setUnitDraft({ ...unitDraft, date: e.target.value })}>{days.map((day) => <option key={day.key} value={day.key}>{day.label} {day.number}</option>)}</select><button type="button" onClick={() => submitClassUnit(course)}>Add</button></div> : <button type="button" className="classUnitAdd" onClick={() => setUnitDraft({ courseId: course.id, date: days[0].key, title: "" })}>＋ Unit</button>}
        </div>
        <div className="dayCells">{days.map((day) => {
          const target = pasteTarget?.location === "calendar" && pasteTarget.courseId === course.id && pasteTarget.date === day.key;
          const roots = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && plan.parentUnitId === null && plan.date === day.key);
          const nestedLessons = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && plan.type === "lesson" && Boolean(plan.parentUnitId) && plan.date === day.key);
          const editing = cellDraft?.courseId === course.id && cellDraft.date === day.key;

          return <div className={target ? "dayCell pasteTarget" : "dayCell"} key={day.key} onClick={() => onSelectDate(course.id, day.key)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/arc-plan"); if (id) onMovePlan(id, day.key, course.id); }}>
            <div className="cellPlans">
              {roots.map((plan) => {
                const selected = selectedPlanId === plan.id;
                const collapsed = workspace.preferences.collapsedUnitIds.includes(plan.id);
                const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : [];
                const prefix = plan.type === "unit" ? <><button type="button" className="disclosureButton" aria-label={collapsed ? "Expand unit" : "Collapse unit"} aria-expanded={!collapsed} onClick={(e) => { e.stopPropagation(); onToggleUnit(plan.id); }}>{collapsed ? "▸" : "▾"}</button></> : undefined;
                return <article id={`calendar-object-${plan.id}`} key={plan.id} className={`${plan.type === "unit" ? "lessonMagnet unitMagnet" : "lessonMagnet"}${selected ? " selected" : ""}`} draggable={editDraft?.id !== plan.id && detailId !== plan.id} onDragStart={(e) => { e.dataTransfer.setData("text/arc-plan", plan.id); e.dataTransfer.effectAllowed = "move"; }} onClick={(e) => { e.stopPropagation(); onSelectPlan(plan); }} tabIndex={0} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && editDraft?.id !== plan.id && detailId !== plan.id) { e.preventDefault(); onSelectPlan(plan); } }}>
                  {editDraft?.id === plan.id ? editableTitle(plan) : <div className="magnetTitleRow">{prefix}<strong>{plan.title}</strong>{plan.type === "unit" && <span className="unitCount">{children.length} lesson{children.length === 1 ? "" : "s"}</span>}</div>}
                  {plan.type === "unit" && !collapsed && <div className="unitChildren unitChildrenSummary"><div className="unitSequenceSummary">{children.length ? children.map((child) => <span key={child.id}>{child.date ? `${child.date.slice(5)} · ` : ""}{child.title}</span>) : <span>No lessons yet</span>}</div>{childDraft?.unitId === plan.id ? <div className="childComposer"><input autoFocus value={childDraft.title} onChange={(e) => setChildDraft({ unitId: plan.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && childDraft.title.trim()) { onAddChildLesson(plan, childDraft.title.trim()); setChildDraft(null); } if (e.key === "Escape") setChildDraft(null); }} placeholder="Lesson title" /><button type="button" onClick={() => { if (!childDraft.title.trim()) return; onAddChildLesson(plan, childDraft.title.trim()); setChildDraft(null); }}>Add</button></div> : <button type="button" className="addChild" onClick={(e) => { e.stopPropagation(); setChildDraft({ unitId: plan.id, title: "" }); }}>＋ Lesson</button>}</div>}
                  {editDraft?.id !== plan.id && actionRow(plan)}
                  {detailPopover(plan)}
                </article>;
              })}

              {nestedLessons.map((lesson) => {
                const unit = ownerUnit(workspace, lesson);
                const unitCollapsed = unit ? workspace.preferences.collapsedUnitIds.includes(unit.id) : false;
                if (unitCollapsed) return null;
                return <article id={`calendar-object-${lesson.id}`} key={lesson.id} className={`lessonMagnet nestedLessonMagnet${selectedPlanId === lesson.id ? " selected" : ""}`} draggable={editDraft?.id !== lesson.id && detailId !== lesson.id} onDragStart={(e) => { e.dataTransfer.setData("text/arc-plan", lesson.id); e.dataTransfer.effectAllowed = "move"; }} onClick={(e) => { e.stopPropagation(); onSelectPlan(lesson); }} tabIndex={0} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && editDraft?.id !== lesson.id && detailId !== lesson.id) { e.preventDefault(); onSelectPlan(lesson); } }}>
                  {unit && <small className="lessonUnitLabel">{unit.title}</small>}
                  {editableTitle(lesson)}
                  {editDraft?.id !== lesson.id && actionRow(lesson)}
                  {detailPopover(lesson)}
                </article>;
              })}
            </div>

            {editing ? <div className="cellComposer"><div className="quickMode"><button type="button" className={cellDraft.mode === "lesson" ? "active" : ""} onClick={() => setCellDraft({ ...cellDraft, mode: "lesson" })}>Lesson</button><button type="button" className={cellDraft.mode === "unit" ? "active" : ""} onClick={() => setCellDraft({ ...cellDraft, mode: "unit" })}>Unit</button></div><input autoFocus value={cellDraft.title} onChange={(e) => setCellDraft({ ...cellDraft, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submitCell(); if (e.key === "Escape") setCellDraft(null); }} placeholder={cellDraft.mode === "unit" ? "Unit title" : "Lesson title"} /><button type="button" onClick={submitCell}>Add {cellDraft.mode}</button></div> : <button type="button" className="cellAdd" aria-label={`Add lesson or unit to ${course.name} on ${day.label}`} onClick={(e) => { e.stopPropagation(); setCellDraft({ courseId: course.id, date: day.key, mode: "lesson", title: "" }); }}>＋</button>}
          </div>;
        })}</div>
        {classUnits.length === 0 && <span className="srOnly">No units yet for {course.name}</span>}
      </div>;
    })}</div>
  </>;
}
