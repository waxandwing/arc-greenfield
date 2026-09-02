"use client";

import { useState } from "react";
import type { Workspace } from "../lib/domain";

type ExploreStep = {
  id: string;
  title: string;
  short: string;
  body: string;
  bullets: string[];
};

const STEPS: ExploreStep[] = [
  {
    id: "calendar",
    title: "The calendar is home.",
    short: "Calendar",
    body: "Arc is built around the calendar, not a dashboard. Week is for precise movement. Month and Quarter are for rearranging larger chunks without flattening your Unit structure.",
    bullets: ["Click a plan to edit it without leaving the current calendar view.", "Use Day when you are teaching from the plan, not when you are arranging the plan.", "Your school dates and class meeting days control where planning tools are allowed to move work."]
  },
  {
    id: "fridge",
    title: "The Fridge holds things before they have a date.",
    short: "Fridge",
    body: "Ideas, Notes, Lessons, and Units can live on the Fridge until you know where they belong. It is a holding place, not a second planner.",
    bullets: ["Drag a Fridge magnet onto the calendar when it is ready.", "Return a plan to the Fridge without deleting it.", "A Unit moved to the Fridge keeps its nested Lessons with it."]
  },
  {
    id: "units",
    title: "Units own Lessons.",
    short: "Units + Lessons",
    body: "A Unit is a container with an ordered Lesson sequence. That hierarchy is the backbone of Arc. Moving, copying, cutting, or deleting a Unit acts on the whole tree.",
    bullets: ["Drag a Lesson onto a Unit to nest it.", "Reorder Lessons inside Unit Focus.", "Copying a Unit makes new IDs; cutting it keeps the original IDs."]
  },
  {
    id: "movement",
    title: "Move plans instead of rebuilding them.",
    short: "Move plans",
    body: "Drag when it is faster. Use the date field, Cut/Copy/Paste, Tack, or Extend when precision matters. Arc should never require you to retype a plan just because the week changed.",
    bullets: ["Tack sends a Lesson to its class's next real meeting.", "Extend creates a continuation on the next real meeting.", "Month and Quarter keep clipboard operations available across views."]
  },
  {
    id: "priority",
    title: "Must / Should / Could is a working strip, not another task app.",
    short: "Must / Should / Could",
    body: "Use the three lanes for the things that compete for your attention while you plan. Calendar and Fridge objects can be linked into the strip instead of copied into a second system.",
    bullets: ["Red-circle means important; it does not mean complete.", "Cross out first, then delete if you are done with it.", "Collapse the strip when you need the calendar space back."]
  },
  {
    id: "shift",
    title: "Shift is for the day that went sideways.",
    short: "Shift",
    body: "Shift previews what can move before it changes anything. Fixed dates stay put. Conflicts are reported instead of silently stacking plans.",
    bullets: ["No-school days are skipped.", "Each class follows its configured meeting days.", "A/B and rotating schedules require an explicit anchor before Arc will use them."]
  },
  {
    id: "day",
    title: "Day is the teach-from-it view.",
    short: "Day",
    body: "Day is where the planning turns into teaching. It keeps the active Unit, today's Lesson, resources, notes, what changed, and what comes next in one place.",
    bullets: ["Mark what was actually taught.", "Leave a short adjustment note while it is fresh.", "Open the Lesson for detail without losing the Day context."]
  },
  {
    id: "save",
    title: "Undo freely. Save deliberately.",
    short: "Undo + Save",
    body: "Arc keeps movement reversible. Treat Undo as part of planning, not an emergency button. Save is visible because teachers need to know where their work stands.",
    bullets: ["Cmd/Ctrl-Z reverses the last workspace action.", "Cmd/Ctrl-S saves now.", "The current beta saves locally on this device; cloud sync is not being implied until it exists."]
  }
];

export function ArcTutorialScreen({ workspace, onComplete }: { workspace: Workspace; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <section className="arcOnboarding" aria-label="Getting to know Arc">
      <header className="onboardingIntro">
        <div>
          <p className="eyebrow">Explore Arc</p>
          <h1>Getting to Know Arc</h1>
          <p>Use this whenever you want a quick look at how the main planning tools fit together. You never have to finish it to use Arc.</p>
        </div>
        <div className="onboardingProgress" aria-label={`Explore Arc section ${index + 1} of ${STEPS.length}`}>
          {STEPS.map((item, stepIndex) => <span key={item.id} className={stepIndex <= index ? "complete" : ""} />)}
        </div>
      </header>

      <div className="onboardingStage previewOpen">
        <div className="onboardingChoices" role="tablist" aria-label="Explore Arc topics">
          {STEPS.map((item, stepIndex) => (
            <button key={item.id} type="button" role="tab" aria-selected={index === stepIndex} className={index === stepIndex ? "selected" : ""} onClick={() => setIndex(stepIndex)}>
              <span className="setupChoiceNumber">{stepIndex + 1}</span>
              <span><strong>{item.short}</strong><small>{stepIndex < index ? "Explored" : stepIndex === index ? "Open" : "Take a look"}</small></span>
              <b>{stepIndex < index ? "Seen" : ""}</b>
            </button>
          ))}
        </div>

        <aside className="setupPopout open" aria-live="polite">
          <div className="setupPopoutBody">
            <div className="setupPreviewHead">
              <div><p className="eyebrow">{workspace.teacherName ? `${workspace.teacherName}'s Arc` : "Your Arc"}</p><h2>{step.title}</h2></div>
              <span>{index + 1} / {STEPS.length}</span>
            </div>

            <div className="setupPreviewSection">
              <div className="deskScenePreview">
                <p>{step.short}</p>
                <strong>{step.body}</strong>
                <ul>{step.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              </div>
            </div>

            <div className="setupPopoutFooter">
              <button type="button" className="secondarySetupAction" onClick={onComplete}>Back to Arc</button>
              <button type="button" className="secondarySetupAction" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>Back</button>
              {!last
                ? <button type="button" className="primarySetupAction" onClick={() => setIndex((current) => Math.min(STEPS.length - 1, current + 1))}>Next</button>
                : <button type="button" className="primarySetupAction" onClick={onComplete}>Done exploring</button>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
