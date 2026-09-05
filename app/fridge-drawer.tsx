"use client";

import { useState } from "react";
import type { Plan } from "../lib/domain";
import { objectLocation } from "../lib/object-lifecycle";

type Props = {
  open: boolean;
  plans: Plan[];
  courses: Array<{ id: string; name: string; color: string }>;
  selectedPlanId: string | null;
  onClose: () => void;
  onCreate: (title: string, type: "note" | "lesson" | "unit") => void;
  onSelect: (plan: Plan) => void;
  onDelete: (id: string) => void;
};

export function FridgeDrawer({ open, plans, courses, selectedPlanId, onClose, onCreate, onSelect, onDelete }: Props) {
  const [draft, setDraft] = useState("");
  const [type, setType] = useState<"note" | "lesson" | "unit">("note");
  const fridgePlans = plans.filter((plan) => objectLocation(plan) === "fridge" && !plan.parentUnitId);

  function add() {
    if (!draft.trim()) return;
    onCreate(draft.trim(), type);
    setDraft("");
  }

  return (
    <aside className={open ? "edgeDrawer fridgeDrawer open" : "edgeDrawer fridgeDrawer"} aria-hidden={!open} aria-label="Fridge">
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
          return (
            <article
              key={plan.id}
              draggable
              className={`fridgeObject fridgeObject-${plan.type}${selectedPlanId === plan.id ? " selected" : ""}`}
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
              <button type="button" className="fridgeDelete" onClick={(event) => { event.stopPropagation(); onDelete(plan.id); }}>Delete</button>
            </article>
          );
        })}
        {fridgePlans.length === 0 && <p className="fridgeEmpty">Nothing here yet. That is allowed.</p>}
      </div>
    </aside>
  );
}
