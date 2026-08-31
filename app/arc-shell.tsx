"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyWorkspace, type ArcView, type Course, type Workspace } from "../lib/domain";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";

const COLORS = ["#2f6f73", "#557b93", "#d2a64a", "#d97965", "#6f7d5b", "#8a6d82"];
const VIEWS: Array<{ id: ArcView; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "semester", label: "Semester" },
  { id: "year", label: "Year Map" }
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ArcShell({ buildId, gitSha }: { buildId: string; gitSha: string }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => emptyWorkspace());
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"setup" | "desk">("setup");
  const [draftCourse, setDraftCourse] = useState("");
  const [draftPeriod, setDraftPeriod] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [saveLabel, setSaveLabel] = useState("Not saved yet");

  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded);
    if (loaded.teacherName && loaded.courses.length > 0 && loaded.calendar.firstStudentDay) {
      setScreen("desk");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const state = saveWorkspace(workspace);
      setSaveLabel(`Saved on this device · ${new Date(state.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [workspace, ready]);

  const visibleViews = useMemo(
    () => VIEWS.filter((view) => view.id !== "day" || workspace.preferences.dayVisibleInSwitcher),
    [workspace.preferences.dayVisibleInSwitcher]
  );

  function updateWorkspace(updater: (current: Workspace) => Workspace) {
    setWorkspace((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  }

  function addCourse() {
    if (!draftCourse.trim()) return;
    const course: Course = {
      id: crypto.randomUUID(),
      name: draftCourse.trim(),
      periodLabel: draftPeriod.trim(),
      color: COLORS[workspace.courses.length % COLORS.length]
    };
    updateWorkspace((current) => ({ ...current, courses: [...current.courses, course] }));
    setDraftCourse("");
    setDraftPeriod("");
  }

  function addIdea() {
    if (!ideaTitle.trim()) return;
    updateWorkspace((current) => ({
      ...current,
      plans: [
        ...current.plans,
        {
          id: crypto.randomUUID(),
          type: "lesson",
          title: ideaTitle.trim(),
          courseId: current.courses[0]?.id ?? null,
          date: null,
          location: "ideas",
          parentUnitId: null,
          childOrder: null,
          fixedDate: false,
          continuationOfId: null,
          notes: "",
          resources: [],
          details: {}
        }
      ]
    }));
    setIdeaTitle("");
  }

  function scheduleIdea(id: string) {
    updateWorkspace((current) => ({
      ...current,
      plans: current.plans.map((plan) =>
        plan.id === id ? { ...plan, location: "calendar", date: todayKey() } : plan
      )
    }));
  }

  function chooseView(view: ArcView) {
    updateWorkspace((current) => ({
      ...current,
      preferences: { ...current.preferences, lastUsedView: view }
    }));
  }

  if (!ready) return <main className="loadingShell">Opening Arc…</main>;

  return (
    <main className="arcApp">
      <header className="arcTopbar">
        <button className="arcBrand" type="button" onClick={() => setScreen("desk")} aria-label="Arc home">
          <span className="arcBrandEyebrow">Wax &amp; Wing</span>
          <span className="arcBrandWord">Arc</span>
        </button>
        <div className="arcMeta">
          <span>{saveLabel}</span>
          <code>{buildId} · {gitSha.slice(0, 7)}</code>
        </div>
      </header>

      {screen === "setup" ? (
        <section className="setupPage">
          <div className="setupCopy">
            <p className="eyebrow">Set up your desk</p>
            <h1>Three things. Then plan.</h1>
            <p>Arc needs your name, the classes you actually teach, and the rough bounds of your school year. Nothing else is required to begin.</p>
          </div>

          <div className="setupGrid">
            <section className="setupCard">
              <span className="stepNumber">1</span>
              <h2>You</h2>
              <label>
                <span>Your name</span>
                <input value={workspace.teacherName} onChange={(e) => updateWorkspace((current) => ({ ...current, teacherName: e.target.value }))} placeholder="What should Arc call you?" />
              </label>
            </section>

            <section className="setupCard">
              <span className="stepNumber">2</span>
              <h2>Classes</h2>
              <div className="courseAdder">
                <input value={draftCourse} onChange={(e) => setDraftCourse(e.target.value)} placeholder="Course name" />
                <input value={draftPeriod} onChange={(e) => setDraftPeriod(e.target.value)} placeholder="Period / block" />
                <button type="button" onClick={addCourse}>Add class</button>
              </div>
              <div className="courseChips">
                {workspace.courses.map((course) => (
                  <span className="courseChip" key={course.id} style={{ borderColor: course.color }}>
                    <i style={{ background: course.color }} />
                    {course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}
                    <button type="button" aria-label={`Remove ${course.name}`} onClick={() => updateWorkspace((current) => ({ ...current, courses: current.courses.filter((item) => item.id !== course.id) }))}>×</button>
                  </span>
                ))}
              </div>
            </section>

            <section className="setupCard">
              <span className="stepNumber">3</span>
              <h2>School year</h2>
              <div className="datePair">
                <label><span>First student day</span><input type="date" value={workspace.calendar.firstStudentDay ?? ""} onChange={(e) => updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, firstStudentDay: e.target.value || null } }))} /></label>
                <label><span>Last student day</span><input type="date" value={workspace.calendar.lastStudentDay ?? ""} onChange={(e) => updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, lastStudentDay: e.target.value || null } }))} /></label>
              </div>
            </section>
          </div>

          <div className="setupFooter">
            <p>You can add no-school dates, quarters, and deeper planning preferences later.</p>
            <button className="primaryAction" type="button" disabled={!workspace.teacherName.trim() || workspace.courses.length === 0 || !workspace.calendar.firstStudentDay} onClick={() => setScreen("desk")}>Open my desk</button>
          </div>
        </section>
      ) : (
        <section className="deskPage">
          <div className="deskToolbar">
            <div>
              <p className="eyebrow">Planning desk</p>
              <h1>{workspace.teacherName ? `${workspace.teacherName}’s week` : "Your week"}</h1>
            </div>
            <div className="viewSwitcher" aria-label="Planning view">
              {visibleViews.map((view) => (
                <button key={view.id} type="button" className={workspace.preferences.lastUsedView === view.id ? "active" : ""} onClick={() => chooseView(view.id)}>{view.label}</button>
              ))}
            </div>
          </div>

          <div className="deskGrid">
            <section className="calendarDesk" aria-label="Calendar workspace">
              <div className="calendarHeader">
                <div>
                  <span className="viewName">{visibleViews.find((view) => view.id === workspace.preferences.lastUsedView)?.label ?? "Week"}</span>
                  <strong>Start with the shape of the week.</strong>
                </div>
                <button type="button" className="quietButton" onClick={() => setScreen("setup")}>Setup</button>
              </div>

              <div className="classRows">
                {workspace.courses.map((course) => (
                  <div className="classRow" key={course.id}>
                    <div className="classLabel"><i style={{ background: course.color }} /><span>{course.name}</span><small>{course.periodLabel}</small></div>
                    <div className="dayCells">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => <button key={day} type="button" className="dayCell"><span>{day}</span><b>＋</b></button>)}
                    </div>
                  </div>
                ))}
              </div>

              {workspace.courses.length === 0 && <div className="emptyDesk">Add a class to start planning.</div>}
            </section>

            <aside className="ideasPanel" aria-label="Ideas workbench">
              <div className="ideasHeading">
                <div><p className="eyebrow">Ideas</p><h2>Things worth keeping.</h2></div>
                <span>{workspace.plans.filter((plan) => plan.location === "ideas").length}</span>
              </div>
              <div className="ideaAdder">
                <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIdea(); }} placeholder="Catch an idea…" />
                <button type="button" onClick={addIdea}>＋</button>
              </div>
              <div className="ideaList">
                {workspace.plans.filter((plan) => plan.location === "ideas").map((plan) => (
                  <article key={plan.id} className="ideaCard">
                    <strong>{plan.title}</strong>
                    <button type="button" onClick={() => scheduleIdea(plan.id)}>Schedule today</button>
                  </article>
                ))}
                {workspace.plans.every((plan) => plan.location !== "ideas") && <p className="emptyNote">Loose thoughts can live here before they have a date.</p>}
              </div>
            </aside>
          </div>

          <section className="priorityStrip" aria-label="Must should could priorities">
            {(["must", "should", "could"] as const).map((tier) => (
              <div key={tier} className="priorityColumn">
                <div className="priorityHeading"><span>{tier}</span><button type="button" aria-label={`Add ${tier} priority`}>＋</button></div>
                <p>{tier === "must" ? "Needs to happen." : tier === "should" ? "Worth doing." : "Good if there’s room."}</p>
              </div>
            ))}
          </section>
        </section>
      )}
    </main>
  );
}
