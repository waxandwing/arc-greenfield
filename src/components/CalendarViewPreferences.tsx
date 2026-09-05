import { CALENDAR_VIEWS, type CalendarView } from '../navigation/calendarViews'
import type { ViewPreferences } from '../navigation/viewPreferences'

type Props = {
  preferences: ViewPreferences
  onChange: (next: ViewPreferences) => void
}

export function CalendarViewPreferences({ preferences, onChange }: Props) {
  const fixedHome = preferences.home.mode === 'fixed' ? preferences.home.view : preferences.lastUsedView

  return (
    <details className="view-preferences">
      <summary>View options</summary>
      <div className="view-preferences-panel">
        <label>
          <span>Open Arc to</span>
          <select
            value={preferences.home.mode}
            onChange={(event) => {
              const mode = event.target.value
              onChange({
                ...preferences,
                home: mode === 'last-used' ? { mode: 'last-used' } : { mode: 'fixed', view: fixedHome },
              })
            }}
          >
            <option value="fixed">A specific view</option>
            <option value="last-used">Last used view</option>
          </select>
        </label>

        {preferences.home.mode === 'fixed' && (
          <label>
            <span>Home view</span>
            <select
              value={preferences.home.view}
              onChange={(event) => onChange({
                ...preferences,
                home: { mode: 'fixed', view: event.target.value as CalendarView },
              })}
            >
              {CALENDAR_VIEWS.map((view) => <option key={view} value={view}>{view}</option>)}
            </select>
          </label>
        )}

        <label className="view-preferences-check">
          <input
            type="checkbox"
            checked={preferences.showWeekends}
            onChange={(event) => onChange({ ...preferences, showWeekends: event.target.checked })}
          />
          <span>Show weekends in Week view</span>
        </label>
      </div>
    </details>
  )
}
