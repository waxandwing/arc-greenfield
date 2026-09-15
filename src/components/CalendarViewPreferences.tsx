import { VISIBLE_CALENDAR_VIEWS, calendarViewLabel, type CalendarView } from '../navigation/calendarViews'
import type { ViewPreferences } from '../navigation/viewPreferences'

type Props = {
  preferences: ViewPreferences
  onChange: (next: ViewPreferences) => void
}

export function CalendarViewPreferences({ preferences, onChange }: Props) {
  const fallbackHome: CalendarView = VISIBLE_CALENDAR_VIEWS.includes(preferences.lastUsedView as (typeof VISIBLE_CALENDAR_VIEWS)[number])
    ? preferences.lastUsedView
    : 'Month'
  const fixedHome = preferences.home.mode === 'fixed' && VISIBLE_CALENDAR_VIEWS.includes(preferences.home.view as (typeof VISIBLE_CALENDAR_VIEWS)[number])
    ? preferences.home.view
    : fallbackHome

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
              value={fixedHome}
              onChange={(event) => onChange({
                ...preferences,
                home: { mode: 'fixed', view: event.target.value as CalendarView },
              })}
            >
              {VISIBLE_CALENDAR_VIEWS.map((view) => <option key={view} value={view}>{calendarViewLabel(view)}</option>)}
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
