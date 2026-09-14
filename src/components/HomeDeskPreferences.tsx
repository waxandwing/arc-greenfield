import type { DeskAwareViewPreferences, DeskSurfacePreferences, HomeDeskPlannerView } from '../navigation/deskPreferences'

type Props = {
  preferences: DeskAwareViewPreferences
  onChange: (next: DeskAwareViewPreferences) => void
}

const DESK_VIEWS: HomeDeskPlannerView[] = ['Day', 'Week', 'Month']

export function HomeDeskPreferences({ preferences, onChange }: Props) {
  function patchDesk(patch: Partial<DeskSurfacePreferences>) {
    onChange({ ...preferences, desk: { ...preferences.desk, ...patch } })
  }

  return (
    <section className="home-desk-preferences" aria-labelledby="settings-home-desk">
      <h2 id="settings-home-desk">Home desk</h2>
      <p className="home-desk-intro">Choose what stays on your Arc desk and which planner view opens first.</p>
      <label>
        <span>Preferred desk planner view</span>
        <select
          value={preferences.desk.homeDeskPlannerView}
          onChange={(event) => patchDesk({ homeDeskPlannerView: event.target.value as HomeDeskPlannerView })}
        >
          {DESK_VIEWS.map((view) => <option key={view} value={view}>{view}</option>)}
        </select>
      </label>
      <label className="view-preferences-check">
        <input type="checkbox" checked={preferences.desk.showTray} onChange={(event) => patchDesk({ showTray: event.target.checked })} />
        <span>Show tray on desk</span>
      </label>
      <label className="view-preferences-check">
        <input type="checkbox" checked={preferences.desk.showPriorityPad} onChange={(event) => patchDesk({ showPriorityPad: event.target.checked })} />
        <span>Show Must / Should / Could pad</span>
      </label>
      <label className="view-preferences-check">
        <input type="checkbox" checked={preferences.desk.showDeskNotes} onChange={(event) => patchDesk({ showDeskNotes: event.target.checked })} />
        <span>Show desk notes strip (optional)</span>
      </label>
    </section>
  )
}
