"use client";

import { useState } from "react";

export type RangeQuickAddProps = {
  defaultDate: string;
  onAdd: (title: string, type: "lesson" | "unit", date: string) => void;
};

export function RangeQuickAdd({ defaultDate, onAdd }: RangeQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"lesson" | "unit">("unit");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);

  function openComposer() {
    setDate(defaultDate);
    setOpen(true);
  }

  function closeComposer() {
    setOpen(false);
    setTitle("");
  }

  function submit() {
    if (!title.trim() || !date) return;
    onAdd(title.trim(), type, date);
    setTitle("");
    setOpen(false);
  }

  if (!open) return <button type="button" className="rangeQuickAddButton" onClick={openComposer}>＋ Plan</button>;

  return (
    <div className="rangeQuickAdd" aria-label="Add to this planning range">
      <div className="rangeQuickModes" aria-label="Plan type">
        <button type="button" className={type === "unit" ? "active" : ""} onClick={() => setType("unit")}>Unit</button>
        <button type="button" className={type === "lesson" ? "active" : ""} onClick={() => setType("lesson")}>Lesson</button>
      </div>
      <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); if (event.key === "Escape") closeComposer(); }} placeholder={type === "unit" ? "Unit title" : "Lesson title"} />
      <input type="date" aria-label="Plan date" value={date} onChange={(event) => setDate(event.target.value)} />
      <button type="button" className="rangeQuickAddSubmit" disabled={!title.trim() || !date} onClick={submit}>Add</button>
      <button type="button" className="rangeQuickAddCancel" onClick={closeComposer}>Cancel</button>
    </div>
  );
}
