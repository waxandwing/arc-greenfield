"use client";

import { useMemo, useState } from "react";
import type { Course, Workspace } from "../lib/domain";

const COLORS = ["#2f6f73", "#557b93", "#d2a64a", "#d97965", "#6f7d5b", "#8a6d82"];
type Step = "you" | "classes" | "calendar";

type Props = {
  workspace: Workspace;
  onUpdate: (updater: (current: Workspace) => Workspace) => void;
  onComplete: () => void;
};

export function OnboardingScreen({ workspace, onUpdate, onComplete }: Props) {
  const [step, setStep] = useState<Step>("you");
  const [draftCourse, setDraftCourse] = useState("");
  const [draftPeriod, setDraftPeriod] = useState("");
  const [previewOpen, setPreviewOpen] = useState(true);

  const ready = Boolean(workspace.teacherName.trim() && workspace.courses.length && workspace.calendar.firstStudentDay);
  const stepIndex = step === "you" ? 0 : step === "classes" ? 1 : 2;

  const previewTitle = useMemo(() => {
    if (step === "you") return workspace.teacherName.trim() ? `${workspace.teacherName.trim()}’s Arc` : "Your Arc";
    if (step === "classes") return workspace.courses.length ? `${workspace.courses.length} class${workspace.courses.length === 1 ? "" : "es"}` : "Your classes";
    return workspace.calendar.firstStudentDay ? "Your school year" : "Your calendar";
  }, [step, workspace]);

  function addCourse() {
    if (!draftCourse.trim()) return;
    const course: Course = {
      id: crypto.randomUUID(),
      name: draftCourse.trim(),
      periodLabel: draftPeriod.trim(),
      color: COLORS[workspace.courses.length % COLORS.length]
    };
    onUpdate((current) => ({ ...current, courses: [...current.courses, course] }));
    setDraftCourse("");
    setDraftPeriod("");
  }

  function updateQuarter(index: number, field: "start" | "end", value: string) {
    onUpdate((current) => {
      const boundaries = Array.from({ length: 4 }, (_, boundaryIndex) => {
        const existing = current.calendar.quarterBoundaries.find((item) => item.id === `q${boundaryIndex + 1}`);
        return existing ?? { id: `q${boundaryIndex + 1}`, label: `Quarter ${boundaryIndex + 1}`, start: "", end: "" };
      });
      boundaries[index] = { ...boundaries[index], [field]: value };
      return { ...current, calendar: { ...current.calendar, quarterBoundaries: boundaries } };
    });
  }

  return (
    <section className="arcOnboarding" aria-label="Set up Arc">
      <header className="onboardingIntro">
        <div>
          <p className="eyebrow">Set up your desk</p>
          <h1>Make Arc yours.</h1>
          <p>Start with the pieces Arc actually needs. The preview updates while you work so setup feels like building your desk, not filling out a form.</p>
        </div>
        <div className="onboardingProgress" aria-label={`Step ${stepIndex + 1} of 3`}>
          {[0, 1, 2].map((index) => <span key={index} className={index <= stepIndex ? "complete" : ""} />)}
        </div>
      </header>

      <div className={previewOpen ? "onboardingStage previewOpen" : "onboardingStage"}>
        <div className="onboardingChoices" role="tablist" aria-label="Setup sections">
          <button type="button" role="tab" aria-selected={step === "you"} className={step === "you" ? "selected" : ""} onClick={() => { setStep("you"); setPreviewOpen(true); }}>
            <span className="setupChoiceNumber">1</span><span><strong>You</strong><small>What should Arc call you?</small></span><b>{workspace.teacherName.trim() ? "Done" : "Start"}</b>
          </button>
          <button type="button" role="tab" aria-selected={step === "classes"} className={step === "classes" ? "selected" : ""} onClick={() => { setStep("classes"); setPreviewOpen(true); }}>
            <span className="setupChoiceNumber">2</span><span><strong>Classes</strong><small>Add the classes you actually teach.</small></span><b>{workspace.courses.length ? `${workspace.courses.length} added` : "Add"}</b>
          </button>
          <button type="button" role="tab" aria-selected={step === "calendar"} className={step === "calendar" ? "selected" : ""} onClick={() => { setStep("calendar"); setPreviewOpen(true); }}>
            <span className="setupChoiceNumber">3</span><span><strong>School year</strong><small>Use your real dates. Quarter dates stay optional.</small></span><b>{workspace.calendar.firstStudentDay ? "Started" : "Add"}</b>
          </button>
        </div>

        <aside className={previewOpen ? "setupPopout open" : "setupPopout"} aria-live="polite">
          <div className="setupPopoutHandle">
            <button type="button" aria-label={previewOpen ? "Collapse setup preview" : "Open setup preview"} onClick={() => setPreviewOpen((value) => !value)}>{previewOpen ? "→" : "←"}</button>
          </div>
          <div className="setupPopoutBody">
            <div className="setupPreviewHead"><div><p className="eyebrow">Live preview</p><h2>{previewTitle}</h2></div><span>Step {stepIndex + 1} / 3</span></div>

            {step === "you" && <div className="setupPreviewSection">
              <label><span>Your name</span><input autoFocus value={workspace.teacherName} onChange={(e) => onUpdate((current) => ({ ...current, teacherName: e.target.value }))} placeholder="What should Arc call you?" /></label>
              <div className="deskScenePreview"><p>Planning desk</p><strong>{workspace.teacherName.trim() ? `${workspace.teacherName.trim()}’s week` : "Your week"}</strong><span>Arc will use this name lightly — the planner stays the focus.</span></div>
            </div>}

            {step === "classes" && <div className="setupPreviewSection">
              <div className="courseSetupRow"><input autoFocus value={draftCourse} onChange={(e) => setDraftCourse(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCourse(); }} placeholder="Course name" /><input value={draftPeriod} onChange={(e) => setDraftPeriod(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCourse(); }} placeholder="Period / block" /><button type="button" onClick={addCourse}>Add class</button></div>
              <div className="classPreviewList">{workspace.courses.map((course) => <div key={course.id} className="classPreviewRow"><i style={{ background: course.color }} /><span><strong>{course.name}</strong><small>{course.periodLabel || "No period set"}</small></span><button type="button" aria-label={`Remove ${course.name}`} onClick={() => onUpdate((current) => ({ ...current, courses: current.courses.filter((item) => item.id !== course.id) }))}>×</button></div>)}</div>
              {!workspace.courses.length && <p className="setupEmptyState">Your class rows will appear here as you add them.</p>}
            </div>}

            {step === "calendar" && <div className="setupPreviewSection calendarSetupSection">
              <div className="datePair"><label><span>First student day</span><input type="date" value={workspace.calendar.firstStudentDay ?? ""} onChange={(e) => onUpdate((current) => ({ ...current, calendar: { ...current.calendar, firstStudentDay: e.target.value || null } }))} /></label><label><span>Last student day</span><input type="date" value={workspace.calendar.lastStudentDay ?? ""} onChange={(e) => onUpdate((current) => ({ ...current, calendar: { ...current.calendar, lastStudentDay: e.target.value || null } }))} /></label></div>
              <details className="quarterDetails"><summary>Quarter dates <span>optional until Quarter view</span></summary><div className="quarterMiniGrid">{Array.from({ length: 4 }, (_, index) => { const boundary = workspace.calendar.quarterBoundaries.find((item) => item.id === `q${index + 1}`); return <div key={index}><strong>Q{index + 1}</strong><input aria-label={`Quarter ${index + 1} start`} type="date" value={boundary?.start ?? ""} onChange={(e) => updateQuarter(index, "start", e.target.value)} /><input aria-label={`Quarter ${index + 1} end`} type="date" value={boundary?.end ?? ""} onChange={(e) => updateQuarter(index, "end", e.target.value)} /></div>; })}</div></details>
            </div>}

            <div className="setupPopoutFooter">
              <button type="button" className="secondarySetupAction" disabled={stepIndex === 0} onClick={() => setStep(step === "calendar" ? "classes" : "you")}>Back</button>
              {step !== "calendar" ? <button type="button" className="primarySetupAction" onClick={() => setStep(step === "you" ? "classes" : "calendar")}>Continue</button> : <button type="button" className="primarySetupAction" disabled={!ready} onClick={onComplete}>Open my desk</button>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
