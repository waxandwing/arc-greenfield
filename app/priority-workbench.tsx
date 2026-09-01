"use client";

import { useState } from "react";
import type { Priority, PriorityTier } from "../lib/domain";

const TIERS: PriorityTier[] = ["must", "should", "could"];

export type PriorityWorkbenchProps = {
  priorities: Priority[];
  onAdd: (tier: PriorityTier, title: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, tier: PriorityTier) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
};

export function PriorityWorkbench({ priorities, onAdd, onToggle, onRename, onDelete, onMove, onReorder }: PriorityWorkbenchProps) {
  const [draft, setDraft] = useState<{ tier: PriorityTier; title: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  function saveDraft() {
    if (!draft?.title.trim()) return;
    onAdd(draft.tier, draft.title.trim());
    setDraft(null);
  }

  function saveEdit() {
    if (!editing?.title.trim()) return;
    onRename(editing.id, editing.title.trim());
    setEditing(null);
  }

  return (
    <section className="priorityPanel" aria-label="Must should could priorities">
      <div className="priorityPanelHeading">
        <div>
          <p className="eyebrow">Must · Should · Could</p>
          <p className="priorityPanelNote">Keep today movable, not precious.</p>
        </div>
      </div>

      {TIERS.map((tier) => {
        const tierItems = priorities.filter((priority) => priority.tier === tier);
        return (
          <div key={tier} className={`priorityTier priorityTier-${tier}`}>
            <div className="priorityHeading">
              <span>{tier}</span>
              <small>{tierItems.length}</small>
              <button type="button" aria-label={`Add ${tier} priority`} onClick={() => setDraft({ tier, title: "" })}>＋</button>
            </div>

            <div className="priorityList">
              {tierItems.map((priority, index) => (
                <article className={priority.completed ? "priorityItem done" : "priorityItem"} key={priority.id}>
                  <input type="checkbox" aria-label={`Mark ${priority.title} complete`} checked={priority.completed} onChange={() => onToggle(priority.id)} />
                  {editing?.id === priority.id ? (
                    <div className="priorityEditRow">
                      <input autoFocus value={editing.title} onChange={(event) => setEditing({ id: priority.id, title: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") saveEdit(); if (event.key === "Escape") setEditing(null); }} />
                      <button type="button" onClick={saveEdit}>Save</button>
                    </div>
                  ) : (
                    <span className="priorityTitle">{priority.title}</span>
                  )}

                  <div className="priorityActions" aria-label={`Actions for ${priority.title}`}>
                    <button type="button" title="Move up" aria-label={`Move ${priority.title} up`} disabled={index === 0} onClick={() => onReorder(priority.id, -1)}>↑</button>
                    <button type="button" title="Move down" aria-label={`Move ${priority.title} down`} disabled={index === tierItems.length - 1} onClick={() => onReorder(priority.id, 1)}>↓</button>
                    <select aria-label={`Priority tier for ${priority.title}`} value={priority.tier} onChange={(event) => onMove(priority.id, event.target.value as PriorityTier)}>
                      {TIERS.map((targetTier) => <option key={targetTier} value={targetTier}>{targetTier}</option>)}
                    </select>
                    <button type="button" onClick={() => setEditing({ id: priority.id, title: priority.title })}>Edit</button>
                    <button type="button" className="dangerAction" onClick={() => onDelete(priority.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {tierItems.length === 0 && <p className="priorityEmpty">Nothing here yet.</p>}
            </div>

            {draft?.tier === tier && (
              <div className="priorityComposer">
                <input autoFocus value={draft.title} onChange={(event) => setDraft({ tier, title: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") saveDraft(); if (event.key === "Escape") setDraft(null); }} placeholder={`Add a ${tier}`} />
                <button type="button" onClick={saveDraft}>Add</button>
                <button type="button" className="quietButton" onClick={() => setDraft(null)}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
