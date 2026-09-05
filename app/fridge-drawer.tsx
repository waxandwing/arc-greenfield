"use client";

import { useState } from "react";
import type { Plan, PriorityTier } from "../lib/domain";
import { objectLocation } from "../lib/object-lifecycle";
import { ScheduleObjectPopover } from "./schedule-object-popover";

type Props = {
  open: boolean;
  plans: Plan[];
  courses: Array<{ id: string; name: string; color: string; periodLabel?: string }>;
  selectedPlanId: string | null;
  onClose: () => void;
  onCreate: (title: string, type: "note" | "lesson" | "unit") => void;
  onSelect: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onMoveToTaskBar: (id: string, tier: PriorityTier) => void;
  onDropObject: (id: string) => void;
  onSchedule: (id: string, date: string, courseId: string) => void;
};

export function FridgeDrawer({ open, plans, courses, selectedPlanId, onClose, onCreate, onSelect, onDelete, onMoveToTaskBar, onDropObject, onSchedule }: Props) {
  const [draft, setDraft] = useState("");
  const [type, setType] = useState<"note" | "lesson" | "unit">("note");
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const fridgePlans = plans.filter((plan) => objectLocation(plan) === "fridge" && !plan.parentUnitId);

  function add() {
    if (!draft.trim()) return;
    onCreate(draft.trim(), type);
    setDraft("");
  }

  return (
    <aside
      className={open ? "edgeDrawer fridgeDrawer open" : "edgeDrawer fridgeDrawer"}
      aria-hidden={!open}
      aria-label="Fridge"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/arc-plan");
        if (id) onDropObject(id);
      }}
    >
      <div className="edgeDrawerHeader">
        <div>
          <p className="eyebrow">Fridge</p>
          <h2>Worth keeping.</h2>
          <p>Save it, reuse it, or decide where it belongs later.</p>
        </div>
        <button type="button" className="drawerClose" onClick={onClose} aria-label="Close Fridge">×</button>
      </div>

      <div className="fridgeComposer">
        <div className="fridgeComposerType" aria-label="New Fridge item type">
          <button type="button" className={type === "note" ? "active" : ""} onClick={() => setType("note")}>Idea / Note</button>
          <button type="button" className={type === "lesson" ? "active" : ""} onClick={() => setType("lesson")}>Lesson</button>
          <button type="button" className={type === "unit" ? "active" : ""} onClick={() => setType("unit")}>Unit</button>
        </div>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") add(); }} placeholder="Put something on the Fridge…" />
        <button type="button" onClick={add}>Add</button>
      </div>

      <div className="fridgeObjectList">
        {fridgePlans.map((plan) => {
          const course = courses.find((item) => item.id === plan.courseId);
          const selected = selectedPlanId === plan.id;
          const scheduling = schedulingId === plan.id;
          return (
            <article
              key={plan.id}
              draggable={!scheduling}
              className={`fridgeObject fridgeObject-${plan.type}${selected ? " selected" : ""}`}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/arc-plan", plan.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onSelect(plan)}
              tabIndex={0}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(plan); } }}
            >
              <div className="fridgeObjectType">{plan.type === "note" ? "Idea / Note" : plan.type === "lesson" ? "Lesson" : "Unit"}</div>
              <strong>{plan.title}</strong>
              {course && <small><span style={{ background: course.color }} />{course.name}</small>}
              {(plan.notes || plan.resources.length > 0 || Object.keys(plan.details).length > 0 || plan.taskContext) && <span className="retainedDataFlag">More info retained</span>}

              {selected && !scheduling && (
                <div className="fridgeObjectActions" role="toolbar" aria-label={`Move ${plan.title}`}>
                  <button type="button" onClick={(event) => { event.stopPropagation(); setSchedulingId(plan.id); }}>Schedule…</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onMoveToTaskBar(plan.id, "must"); }}>Must</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onMoveToTaskBar(plan.id, "should"); }}>Should</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onMoveToTaskBar(plan.id, "could"); }}>Could</button>
                  <button type="button" className="dangerAction" onClick={(event) => { event.stopPropagation(); onDelete(plan.id); }}>Delete</button>
                </div>
              )}

              {scheduling && (
                <div onClick={(event) => event.stopPropagation()}>
                  <ScheduleObjectPopover
                    title={plan.title}
                    courses={courses}
                    initialCourseId={plan.courseId}
                    initialDate={plan.date}
                    onCancel={() => setSchedulingId(null)}
                    onSchedule={(date, courseId) => {
                      onSchedule(plan.id, date, courseId);
                      setSchedulingId(null);
                    }}
                  />
                </div>
              )}
            </article>
          );
        })}
        {fridgePlans.length === 0 && <p className="fridgeEmpty">Nothing here yet. That is allowed.</p>}
      </div>
    </aside>
  );
}
