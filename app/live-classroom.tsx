"use client";

import { useState } from "react";
import type { Plan, Section } from "../lib/domain";
import type { LiveOutcome } from "../lib/live-classroom";

type Props = {
  plan: Plan;
  section: Section;
  date: string;
  onOutcome: (outcome: LiveOutcome) => void;
  onLeave: () => void;
};

export function LiveClassroom({ plan, section, date, onOutcome, onLeave }: Props) {
  const [resumeNote, setResumeNote] = useState("");
  const [showStop, setShowStop] = useState(false);

  return (
    <section className="liveClassroom" aria-label={`Live Classroom for ${section.name} ${plan.title}`}>
      <header className="liveClassroomHeader">
        <div>
          <span className="eyebrow">Live Classroom</span>
          <h1>{plan.title}</h1>
          <p>{section.periodLabel} · {section.name} · {new Date(`${date}T12:00:00`).toLocaleDateString()}</p>
        </div>
        <button type="button" onClick={onLeave}>Back to Day</button>
      </header>

      <div className="liveLessonBody">
        {plan.notes ? <div className="liveNotes"><span>Notes</span><p>{plan.notes}</p></div> : <div className="liveNotes empty"><span>Notes</span><p>No notes attached.</p></div>}
        {plan.resources.length > 0 && <div className="liveResources"><span>Resources</span>{plan.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>)}</div>}
      </div>

      <footer className="liveOutcomes">
        <button type="button" className="completeOutcome" onClick={() => onOutcome({ type: "complete" })}>Complete</button>
        <button type="button" onClick={() => setShowStop(true)}>Stop here</button>
        <button type="button" onClick={() => onOutcome({ type: "skip" })}>Skip</button>
        <button type="button" className="quietOutcome" onClick={onLeave}>Leave without outcome</button>
      </footer>

      {showStop && (
        <div className="resumeNotePanel" role="dialog" aria-label="Resume note">
          <strong>Where should Arc hold your place?</strong>
          <textarea autoFocus value={resumeNote} onChange={(event) => setResumeNote(event.target.value)} placeholder="Stopped after… Next time, start with…" />
          <div>
            <button type="button" onClick={() => setShowStop(false)}>Cancel</button>
            <button type="button" disabled={!resumeNote.trim()} onClick={() => onOutcome({ type: "stop", resumeNote })}>Save stop point</button>
          </div>
        </div>
      )}
    </section>
  );
}
