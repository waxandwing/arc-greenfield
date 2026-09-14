import type { DeskAwareViewPreferences, DeskSurfacePreferences, HomeDeskPlannerView } from '../navigation/deskPreferences'
import { HOME_DESK_PLANNER_VIEW_LABELS } from '../navigation/deskPreferences'
import { loadWorkspaceLayout, workspaceLayoutUsesDefault } from '../navigation/workspaceLayout'

type Props = {
  preferences: DeskAwareViewPreferences
  onChange: (next: DeskAwareViewPreferences) => void
  onEditWorkspace: () => void
}

const DESK_VIEWS: HomeDeskPlannerView[] = ['Day', 'Week', 'Month']

export function DeskSetupSettings({ preferences, onChange, onEditWorkspace }: Props) {
  const layoutCustomized = !workspaceLayoutUsesDefault(loadWorkspaceLayout())

  function patchDesk(patch: Partial<DeskSurfacePreferences>) {
    onChange({ ...preferences, desk: { ...preferences.desk, ...patch } })
  }

  function patchView(patch: Partial<DeskAwareViewPreferences>) {
    onChange({ ...preferences, ...patch })
  }

  return (
    <section className="b01-settings-group desk-setup-settings" aria-labelledby="settings-desk-setup">
      <h2 id="settings-desk-setup">Desk setup</h2>
      <p className="desk-setup-overview">
        Edit Workspace arranges planner, tray, Must/Should/Could, and ArcTable on your real desk — not a miniature preview.
      </p>
      <button type="button" className="b01-settings-action b01-settings-action--primary" onClick={onEditWorkspace}>
        Edit Workspace
      </button>
      {layoutCustomized ? <p className="desk-setup-hint" role="status">Your desk layout is customized.</p> : null}

      <label>
        <span>Preferred default planner view</span>
        <select
          value={preferences.desk.homeDeskPlannerView}
          onChange={(event) => patchDesk({ homeDeskPlannerView: event.target.value as HomeDeskPlannerView })}
        >
          {DESK_VIEWS.map((view) => <option key={view} value={view}>{HOME_DESK_PLANNER_VIEW_LABELS[view]}</option>)}
        </select>
      </label>

      <label className="view-preferences-check">
        <input
          type="checkbox"
          checked={preferences.showWeekends}
          onChange={(event) => patchView({ showWeekends: event.target.checked })}
        />
        <span>Show weekends in Week view</span>
      </label>

      <fieldset className="desk-setup-presets">
        <legend>Object sizes</legend>
        <label>
          <span>Planner</span>
          <select value={preferences.desk.plannerSize} onChange={(event) => patchDesk({ plannerSize: event.target.value as DeskSurfacePreferences['plannerSize'] })}>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
        </label>
        <label>
          <span>Tray</span>
          <select value={preferences.desk.traySize} onChange={(event) => patchDesk({ traySize: event.target.value as DeskSurfacePreferences['traySize'] })}>
            <option value="standard">Standard</option>
            <option value="wide">Wide</option>
          </select>
        </label>
        <label>
          <span>Must / Should / Could</span>
          <select value={preferences.desk.mscSize} onChange={(event) => patchDesk({ mscSize: event.target.value as DeskSurfacePreferences['mscSize'] })}>
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="desk-setup-visibility">
        <legend>Show on desk</legend>
        <label className="view-preferences-check">
          <input type="checkbox" checked disabled aria-readonly />
          <span>Planner (required)</span>
        </label>
        <label className="view-preferences-check">
          <input type="checkbox" checked={preferences.desk.showTray} onChange={(event) => patchDesk({ showTray: event.target.checked })} />
          <span>Tray</span>
        </label>
        <label className="view-preferences-check">
          <input type="checkbox" checked={preferences.desk.showPriorityPad} onChange={(event) => patchDesk({ showPriorityPad: event.target.checked })} />
          <span>Must / Should / Could pad</span>
        </label>
        <label className="view-preferences-check">
          <input type="checkbox" checked={preferences.desk.showArcTable} onChange={(event) => patchDesk({ showArcTable: event.target.checked })} />
          <span>ArcTable</span>
        </label>
        <label className="view-preferences-check">
          <input type="checkbox" checked={preferences.desk.showDeskNotes} onChange={(event) => patchDesk({ showDeskNotes: event.target.checked })} />
          <span>Desk notes strip (optional)</span>
        </label>
      </fieldset>
    </section>
  )
}
