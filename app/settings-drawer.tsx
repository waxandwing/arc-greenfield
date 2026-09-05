"use client";

type Props = {
  open: boolean;
  weekendsVisible: boolean;
  onClose: () => void;
  onToggleWeekends: () => void;
  onOpenSetup: () => void;
};

export function SettingsDrawer({ open, weekendsVisible, onClose, onToggleWeekends, onOpenSetup }: Props) {
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
