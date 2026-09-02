"use client";

import { useState } from "react";
import type { Workspace } from "../lib/domain";
import { ARC_HELP_TOPICS } from "../lib/arc-help-guidance";

export function ArcTutorialScreen({ workspace, onComplete }: { workspace: Workspace; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const topic = ARC_HELP_TOPICS[index];
  const last = index === ARC_HELP_TOPICS.length - 1;

  return (
    <section className="arcOnboarding" aria-label="Getting to know Arc">
      <header className="onboardingIntro">
        <div>
          <p className="eyebrow">Explore Arc</p>
          <h1>Getting to Know Arc</h1>
          <p>This is a reference, not a required course. Open any topic you want, then go straight back to the calendar.</p>
        </div>
        <div className="onboardingProgress" aria-label={`Explore Arc topic ${index + 1} of ${ARC_HELP_TOPICS.length}`}>
          {ARC_HELP_TOPICS.map((item, topicIndex) => <span key={item.id} className={topicIndex <= index ? "complete" : ""} />)}
        </div>
      </header>

      <div className="onboardingStage previewOpen">
        <div className="onboardingChoices" role="tablist" aria-label="Explore Arc topics">
          {ARC_HELP_TOPICS.map((item, topicIndex) => (
            <button key={item.id} type="button" role="tab" aria-selected={index === topicIndex} className={index === topicIndex ? "selected" : ""} onClick={() => setIndex(topicIndex)}>
              <span className="setupChoiceNumber">{topicIndex + 1}</span>
              <span><strong>{item.label}</strong><small>{topicIndex < index ? "Explored" : topicIndex === index ? "Open" : "Take a look"}</small></span>
              <b>{topicIndex < index ? "Seen" : ""}</b>
            </button>
          ))}
        </div>

        <aside className="setupPopout open" aria-live="polite">
          <div className="setupPopoutBody">
            <div className="setupPreviewHead">
              <div><p className="eyebrow">{workspace.teacherName ? `${workspace.teacherName}'s Arc` : "Your Arc"}</p><h2>{topic.title}</h2></div>
              <span>{index + 1} / {ARC_HELP_TOPICS.length}</span>
            </div>

            <div className="setupPreviewSection">
              <div className="deskScenePreview">
                <p>{topic.label}</p>
                <strong>{topic.body}</strong>
                <ul>{topic.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              </div>
            </div>

            <div className="setupPopoutFooter">
              <button type="button" className="secondarySetupAction" onClick={onComplete}>Back to Arc</button>
              <button type="button" className="secondarySetupAction" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>Back</button>
              {!last
                ? <button type="button" className="primarySetupAction" onClick={() => setIndex((current) => Math.min(ARC_HELP_TOPICS.length - 1, current + 1))}>Next</button>
                : <button type="button" className="primarySetupAction" onClick={onComplete}>Done exploring</button>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
