"use client";

import type { WorkspacePreferences } from "../lib/domain";
import { currentLandingChoices } from "../lib/navigation-preferences";

type Props = {
  open: boolean;
  weekendsVisible: boolean;
  landingView: WorkspacePreferences["landingView"];
  quarterAvailable: boolean;
  onClose: () => void;
  onToggleWeekends: () => void;
  onLandingViewChange: (view: WorkspacePreferences["landingView"]) => void;
  onOpenSetup: () => void;
};

export function SettingsDrawer({ open, weekendsVisible, landingView, quarterAvailable, onClose, onToggleWeekends, onLandingViewChange, onOpenSetup }: Props) {
  const choices = currentLandingChoices(quarterAvailable);
  const visibleLandingValue = choices.some((choice) => choice.value === landingView) ? landingView : "last-used";

  return (
    <aside className={open ? "edgeDrawer settingsDrawer open" : "edgeDrawer settingsDrawer"} aria-hidden={!open} aria-label="Settings and utilities">
      <div className="edgeDrawerHeader">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Quiet controls.</h2>
          <p>Low-frequency things live here, not in a permanent rail.</p>
        </div>
        <button type="button" className="drawerClose" onClick={onClose} aria-label="Close Settings">×</button>
      </div>

      <div className="settingsList">
        <label className="settingsRow settingsSelectRow">
          <span><strong>Arc home</strong><small>Where the Arc wordmark and a fresh session return.</small></span>
          <select value={visibleLandingValue} onChange={(event) => onLandingViewChange(event.target.value as WorkspacePreferences["landingView"])} aria-label="Arc home view">
            {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
          {visibleLandingValue !== landingView && <small className="settingsFallbackNote">Your saved {landingView} home is not available in this build. Arc will fall back safely without replacing that preference.</small>}
        </label>
        <button type="button" className="settingsRow" onClick={onToggleWeekends}>
          <span><strong>Show weekends in Week</strong><small>{weekendsVisible ? "Sunday through Saturday" : "Monday through Friday"}</small></span>
          <span className={weekendsVisible ? "settingsToggle on" : "settingsToggle"} aria-hidden="true"><i /></span>
        </button>
        <button type="button" className="settingsRow" onClick={onOpenSetup}>
          <span><strong>Setup</strong><small>School, courses, sections, calendar sources</small></span>
          <span aria-hidden="true">→</span>
        </button>
        <div className="settingsRow disabledRow" aria-disabled="true">
          <span><strong>Class rosters</strong><small>Reserved utility surface</small></span>
        </div>
        <div className="settingsRow disabledRow" aria-disabled="true">
          <span><strong>Appearance + accessibility</strong><small>Reserved utility surface</small></span>
        </div>
        <div className="settingsRow disabledRow" aria-disabled="true">
          <span><strong>Help + keyboard guide</strong><small>Reserved utility surface</small></span>
        </div>
      </div>
    </aside>
  );
}
