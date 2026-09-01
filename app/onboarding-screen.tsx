"use client";

import { useMemo, useState } from "react";
import type { Course, Workspace } from "../lib/domain";
import { onboardingCompletedCount, onboardingReady, onboardingStepComplete, schoolYearRangeValid, type OnboardingStep } from "../lib/onboarding-state";

const COLORS = ["#2f6f73", "#557b93", "#d2a64a", "#d97965", "#6f7d5b", "#8a6d82"];
const MEETING_DAYS = [
  { day: 1, label: "M", name: "Monday" },
  { day: 2, label: "T", name: "Tuesday" },
  { day: 3, label: "W", name: "Wednesday" },
  { day: 4, label: "Th", name: "Thursday" },
  { day: 5, label: "F", name: "Friday" }
] as const;

type Props = {
  workspace: Workspace;
  onUpdate: (updater: (current: Workspace) => Workspace) => void;
  onComplete: () => void;
};

export function OnboardingScreen({ workspace, onUpdate, onComplete }: Props) {
  const [step, setStep] = useState<OnboardingStep>("you");
  const [draftCourse, setDraftCourse] = useState("");
  const [draftPeriod, setDraftPeriod] = useState("");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [noSchoolDate, setNoSchoolDate] = useState("");
  const [noSchoolLabel, setNoSchoolLabel] = useState("");

  const ready = onboardingReady(workspace);
  const stepComplete = onboardingStepComplete(workspace, step);
  const completedCount = onboardingCompletedCount(workspace);
  const canOpenClasses = onboardingStepComplete(workspace, "you");
  const canOpenCalendar = canOpenClasses && onboardingStepComplete(workspace, "classes");
  const stepIndex = step === "you" ? 0 : step === "classes" ? 1 : 2;
  const schoolYearValid = schoolYearRangeValid(workspace);

  const previewTitle = useMemo(() => {
    if (step === "you") return workspace.teacherName.trim() ? `${workspace.teacherName.trim()}’s Arc` : "Your Arc";
    if (step === "classes") return workspace.courses.length ? `${workspace.courses.length} class${workspace.courses.length === 1 ? "" : "es"}` : "Your classes";
    return schoolYearValid ? "Your school year" : "Your calendar";
  }, [step, workspace, schoolYearValid]);

  function addCourse() {
    if (!draftCourse.trim()) return;
    const course: Course = {
      id: crypto.randomUUID(),
      name: draftCourse.trim(),
      periodLabel: draftPeriod.trim(),
      color: COLORS[workspace.courses.length % COLORS.length],
      meetingPattern: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] }
    };
    onUpdate((current) => ({ ...current, courses: [...current.courses, course] }));
    setDraftCourse("");
    setDraftPeriod("");
  }

  function toggleCourseMeetingDay(courseId: string, weekday: number) {
    onUpdate((current) => ({
      ...current,
      courses: current.courses.map((course) => {
        if (course.id !== courseId) return course;
        const currentDays = course.meetingPattern?.kind === "weekdays" && course.meetingPattern.weekdays.length
          ? course.meetingPattern.weekdays
          : [1, 2, 3, 4, 5];
        const next = currentDays.includes(weekday)
          ? currentDays.filter((day) => day !== weekday)
          : [...currentDays, weekday].sort((a, b) => a - b);
        return { ...course, meetingPattern: { kind: "weekdays", weekdays: next } };
      })
    }));
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

  function addNoSchoolDate() {
    if (!noSchoolDate) return;
    onUpdate((current) => {
      if (current.calendar.noSchoolDates.some((item) => item.date === noSchoolDate)) return current;
      return {
        ...current,
        calendar: {
          ...current.calendar,
          noSchoolDates: [...current.calendar.noSchoolDates, {
            id: crypto.randomUUID(),
            date: noSchoolDate,
            label: noSchoolLabel.trim() || "No school"
          }].sort((a, b) => a.date.localeCompare(b.date))
        }
      };
    });
    setNoSchoolDate("");
    setNoSchoolLabel("");
  }

  function removeNoSchoolDate(id: string) {
    onUpdate((current) => ({
      ...current,
      calendar: {
        ...current.calendar,
        noSchoolDates: current.calendar.noSchoolDates.filter((item) => item.id !== id)
      }
    }));
  }

  function openStep(next: OnboardingStep) {
    if (next === "classes" && !canOpenClasses) return;
    if (next === "calendar" && !canOpenCalendar) return;
    setStep(next);
    setPreviewOpen(true);
  }

  return (
    <section className="arcOnboarding" aria-label="Set up Arc">
      <header className="onboardingIntro">
        <div>
          <p className="eyebrow">Set up your desk</p>
          <h1>Make Arc yours.</h1>
          <p>Start with the pieces Arc actually needs. The preview updates while you work so setup feels like building your desk, not filling out a form.</p>
        </div>
        <div className="onboardingProgress" aria-label={`${completedCount} of 3 setup sections complete`}>
          {(["you", "classes", "calendar"] as const).map((item) => <span key={item} className={onboardingStepComplete(workspace, item) ? "complete" : ""} />)}
        </div>
      </header>

      <div className={previewOpen ? "onboardingStage previewOpen" : "onboardingStage"}>
        <div className="onboardingChoices" role="tablist" aria-label="Setup sections">
          <button type="button" role="tab" aria-selected={step === "you"} className={step === "you" ? "selected" : ""} onClick={() => openStep("you")}>
            <span className="setupChoiceNumber">1</span><span><strong>You</strong><small>What should Arc call you?</small></span><b>{onboardingStepComplete(workspace, "you") ? "Done" : "Start"}</b>
          </button>
          <button type="button" role="tab" aria-selected={step === "classes"} aria-disabled={!canOpenClasses} disabled={!canOpenClasses} className={step === "classes" ? "selected" : ""} onClick={() => openStep("classes")}>
            <span className="setupChoiceNumber">2</span><span><strong>Classes</strong><small>Add the classes you actually teach.</small></span><b>{workspace.courses.length ? `${workspace.courses.length} added` : "Next"}</b>
          </button>
          <button type="button" role="tab" aria-selected={step === "calendar"} aria-disabled={!canOpenCalendar} disabled={!canOpenCalendar} className={step === "calendar" ? "selected" : ""} onClick={() => openStep("calendar")}>
            <span className="setupChoiceNumber">3</span><span><strong>School year</strong><small>Use your real dates. Quarter dates stay optional.</small></span><b>{onboardingStepComplete(workspace, "calendar") ? "Done" : "Next"}</b>
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
              <div className="classPreviewList">{workspace.courses.map((course) => {
                const meetingDays = course.meetingPattern?.kind === "weekdays" && course.meetingPattern.weekdays.length ? course.meetingPattern.weekdays : [1, 2, 3, 4, 5];
                return <div key={course.id} className="classPreviewRow"><i style={{ background: course.color }} /><span className="classPreviewMain"><strong>{course.name}</strong><small>{course.periodLabel || "No period set"}</small><span className="meetingDayPicker" role="group" aria-label={`${course.name} meeting days`}>{MEETING_DAYS.map(({ day, label, name }) => <button type="button" key={day} className={meetingDays.includes(day) ? "active" : ""} aria-pressed={meetingDays.includes(day)} aria-label={`${course.name} meets ${name}`} onClick={() => toggleCourseMeetingDay(course.id, day)}>{label}</button>)}</span></span><button type="button" className="removeClassButton" aria-label={`Remove ${course.name}`} onClick={() => onUpdate((current) => ({ ...current, courses: current.courses.filter((item) => item.id !== course.id) }))}>×</button></div>;
              })}</div>
              {!workspace.courses.length && <p className="setupEmptyState">Your class rows will appear here as you add them.</p>}
              {workspace.courses.length > 0 && <p className="meetingPatternNote">Meeting days drive Tack, Extend, Copy next, and Shift. Leave all five selected for a daily class.</p>}
            </div>}

            {step === "calendar" && <div className="setupPreviewSection calendarSetupSection">
              <div className="calendarSourceTruth" role="note">
                <strong>Manual calendar setup</strong>
                <span>District lookup and calendar-file extraction stay hidden until they can return real source-backed dates. For now, Arc uses exactly what you enter here.</span>
              </div>
              <div className="datePair"><label><span>First student day</span><input type="date" value={workspace.calendar.firstStudentDay ?? ""} onChange={(e) => onUpdate((current) => ({ ...current, calendar: { ...current.calendar, firstStudentDay: e.target.value || null } }))} /></label><label><span>Last student day</span><input type="date" value={workspace.calendar.lastStudentDay ?? ""} onChange={(e) => onUpdate((current) => ({ ...current, calendar: { ...current.calendar, lastStudentDay: e.target.value || null } }))} /></label></div>
              {workspace.calendar.firstStudentDay && workspace.calendar.lastStudentDay && !schoolYearValid && <p className="calendarValidationError" role="alert">The last student day needs to be on or after the first student day.</p>}
              <div className="noSchoolSetup">
                <div className="noSchoolHeading"><strong>No-school dates</strong><span>Shift, Tack, Extend, and long-range views will skip these instructional days.</span></div>
                <div className="noSchoolComposer"><input aria-label="No-school date" type="date" value={noSchoolDate} onChange={(e) => setNoSchoolDate(e.target.value)} /><input aria-label="No-school date label" value={noSchoolLabel} onChange={(e) => setNoSchoolLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNoSchoolDate(); }} placeholder="Holiday, workday, break…" /><button type="button" disabled={!noSchoolDate} onClick={addNoSchoolDate}>Add</button></div>
                <div className="noSchoolList">{workspace.calendar.noSchoolDates.map((item) => <div key={item.id}><span><strong>{item.date}</strong><small>{item.label}</small></span><button type="button" aria-label={`Remove ${item.label} on ${item.date}`} onClick={() => removeNoSchoolDate(item.id)}>×</button></div>)}{workspace.calendar.noSchoolDates.length === 0 && <p>No dates added yet.</p>}</div>
              </div>
              <label className="weekendToggle"><span><input type="checkbox" checked={workspace.calendar.weekendsVisible} onChange={(e) => onUpdate((current) => ({ ...current, calendar: { ...current.calendar, weekendsVisible: e.target.checked } }))} /> Show weekends in calendar views</span></label>
              <details className="quarterDetails"><summary>Quarter dates <span>optional until Quarter view</span></summary><div className="quarterMiniGrid">{Array.from({ length: 4 }, (_, index) => { const boundary = workspace.calendar.quarterBoundaries.find((item) => item.id === `q${index + 1}`); return <div key={index}><strong>Q{index + 1}</strong><input aria-label={`Quarter ${index + 1} start`} type="date" value={boundary?.start ?? ""} onChange={(e) => updateQuarter(index, "start", e.target.value)} /><input aria-label={`Quarter ${index + 1} end`} type="date" value={boundary?.end ?? ""} onChange={(e) => updateQuarter(index, "end", e.target.value)} /></div>; })}</div></details>
            </div>}

            <div className="setupPopoutFooter">
              <button type="button" className="secondarySetupAction" disabled={stepIndex === 0} onClick={() => setStep(step === "calendar" ? "classes" : "you")}>Back</button>
              {step !== "calendar" ? <button type="button" className="primarySetupAction" disabled={!stepComplete} onClick={() => setStep(step === "you" ? "classes" : "calendar")}>Continue</button> : <button type="button" className="primarySetupAction" disabled={!ready} onClick={onComplete}>Open my desk</button>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
