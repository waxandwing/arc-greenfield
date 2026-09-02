"use client";

import { useEffect, useState } from "react";
import type { Plan, Workspace } from "../lib/domain";
import { orderedUnitChildren } from "../lib/plan-tree";
import { minimumUnitEndDate, reviewUnitEndDate } from "../lib/unit-range";

export function MagnetEditor({ plan, unit, workspace, onClose, onRename, onPatch, onMoveDate, onSelectPlan, onTack, onExtend, onCopyNext, onFridge, onDelete, onAddChild, onReorderChild, onDetachChild }: {
  plan: Plan;
  unit: Plan | null;
  workspace: Workspace;
  onClose: () => void;
  onRename: (id: string, title: string) => void;
  onPatch: (id: string, patch: Partial<Plan>) => void;
  onMoveDate: (id: string, date: string, courseId: string) => void;
  onSelectPlan: (id: string) => void;
  onTack: (id: string) => void;
  onExtend: (id: string) => void;
  onCopyNext: (id: string) => void;
  onFridge: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (unit: Plan, title: string) => void;
  onReorderChild: (unitId: string, childId: string, direction: -1 | 1) => void;
  onDetachChild: (id: string) => void;
}) {
  const [resourceDraft, setResourceDraft] = useState({ label: "", url: "" });
  const [childTitle, setChildTitle] = useState("");
  const [rangeMessage, setRangeMessage] = useState("");

  useEffect(() => {
    setResourceDraft({ label: "", url: "" });
    setChildTitle("");
    setRangeMessage("");
  }, [plan.id]);

  const editorLabel = plan.type === "unit"
    ? "Unit Focus"
    : plan.type === "lesson"
      ? "Lesson details"
      : plan.type === "note"
        ? "Note details"
        : "Idea details";
  const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : [];
  const parentUnit = plan.type === "lesson" && unit?.type === "unit" ? unit : null;
  const protectedFromFridge = plan.fixedDate || children.some((child) => child.fixedDate);
  const minimumEnd = plan.type === "unit" ? minimumUnitEndDate(plan, children) : null;

  return (
    <aside className="arcMagnetEditor" aria-label={editorLabel}>
      <header><h3>{editorLabel}</h3><button type="button" onClick={onClose} aria-label={`Close ${editorLabel}`}>×</button></header>
      <div className="editorBody">
        {parentUnit && <p className="editorContext">Lesson in <button type="button" onClick={() => onSelectPlan(parentUnit.id)}>{parentUnit.title}</button></p>}
        <label>Title<input defaultValue={plan.title} key={plan.id + plan.title} onBlur={(event) => onRename(plan.id, event.target.value)} /></label>
        <label>Notes<textarea defaultValue={plan.notes} key={plan.id + plan.notes} rows={3} onBlur={(event) => onPatch(plan.id, { notes: event.target.value })} /></label>
        {plan.type !== "idea" && <label><span><input type="checkbox" checked={plan.fixedDate} onChange={(event) => onPatch(plan.id, { fixedDate: event.target.checked })} /> Fixed date</span></label>}
        {plan.courseId && <label>Move / schedule<input type="date" value={plan.date ?? ""} onChange={(event) => { if (event.target.value && plan.courseId) onMoveDate(plan.id, event.target.value, plan.courseId); }} /></label>}

        {plan.type === "unit" && plan.date && <>
          <label>Unit end<input
            type="date"
            aria-describedby={`${plan.id}-unit-range-help`}
            min={minimumEnd ?? plan.date}
            value={plan.endDate ?? plan.date}
            onChange={(event) => {
              const review = reviewUnitEndDate(plan, children, event.target.value);
              if (!review.allowed) {
                setRangeMessage(review.reason ?? "That range cannot be used.");
                return;
              }
              setRangeMessage("");
              onPatch(plan.id, { endDate: event.target.value });
            }}
          /></label>
          <p className="editorContext" id={`${plan.id}-unit-range-help`} role={rangeMessage ? "status" : undefined}>
            {rangeMessage || (minimumEnd && minimumEnd > plan.date
              ? `Scheduled Lessons keep this Unit open through ${minimumEnd}.`
              : "Adjust the Unit range without rebuilding it. Drag is optional.")}
          </p>
        </>}

        {plan.type === "lesson" && <div className="editorQuickActions">
          <button type="button" disabled={plan.fixedDate || !plan.date} onClick={() => onTack(plan.id)}>Tack →</button>
          <button type="button" disabled={!plan.date} onClick={() => onExtend(plan.id)}>Extend +1 day</button>
          <button type="button" disabled={!plan.date} onClick={() => onCopyNext(plan.id)}>Copy → next</button>
        </div>}

        <div className="editorQuickActions">
          <button type="button" disabled={protectedFromFridge} aria-describedby={protectedFromFridge ? `${plan.id}-fridge-protection` : undefined} onClick={() => onFridge(plan.id)}>Return to Fridge</button>
          <button type="button" onClick={() => onDelete(plan.id)}>Delete</button>
        </div>
        {protectedFromFridge && <p className="editorContext" id={`${plan.id}-fridge-protection`} role="status">Protected date. Unlock the fixed {plan.type === "unit" && !plan.fixedDate ? "Lesson inside this Unit" : "item"} before parking it on the Fridge.</p>}

        <div className="editorUnitList">
          <strong>Resources</strong>
          {plan.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>)}
          <div className="priorityAdd">
            <input value={resourceDraft.label} onChange={(event) => setResourceDraft({ ...resourceDraft, label: event.target.value })} placeholder="Label" />
            <input value={resourceDraft.url} onChange={(event) => setResourceDraft({ ...resourceDraft, url: event.target.value })} placeholder="https://" />
            <button type="button" onClick={() => {
              if (!resourceDraft.label.trim() || !resourceDraft.url.trim()) return;
              onPatch(plan.id, { resources: [...plan.resources, { id: crypto.randomUUID(), label: resourceDraft.label.trim(), url: resourceDraft.url.trim() }] });
              setResourceDraft({ label: "", url: "" });
            }}>＋</button>
          </div>
        </div>

        {plan.type === "unit" && <div className="editorUnitList">
          <strong>Lesson sequence</strong>
          {children.map((child, index) => <div className="editorUnitChild" key={child.id}>
            <button type="button" onClick={() => onSelectPlan(child.id)}>{index + 1}. {child.title}</button>
            <div>
              <button type="button" disabled={index === 0} onClick={() => onReorderChild(plan.id, child.id, -1)}>↑</button>
              <button type="button" disabled={index === children.length - 1} onClick={() => onReorderChild(plan.id, child.id, 1)}>↓</button>
              <button type="button" disabled={child.fixedDate} title={child.fixedDate ? "Unlock this fixed Lesson before parking it" : undefined} onClick={() => onDetachChild(child.id)}>Fridge</button>
            </div>
          </div>)}
          <div className="priorityAdd">
            <input value={childTitle} onChange={(event) => setChildTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter" && childTitle.trim()) {
                onAddChild(plan, childTitle);
                setChildTitle("");
              }
            }} placeholder="Add lesson" />
            <button type="button" onClick={() => {
              if (!childTitle.trim()) return;
              onAddChild(plan, childTitle);
              setChildTitle("");
            }}>＋</button>
          </div>
        </div>}
      </div>
    </aside>
  );
}
