import { CalendarViewPreferences } from './CalendarViewPreferences'
import { DeskSetupSettings } from './DeskSetupSettings'
import type { DeskAwareViewPreferences } from '../navigation/deskPreferences'

type Props = {
  preferences: DeskAwareViewPreferences
  hasTerms: boolean
  hasClasses: boolean
  hasUnits: boolean
  hasLessons: boolean
  onChangePreferences: (next: DeskAwareViewPreferences) => void
  onOpenCalendarSetup: () => void
  onOpenTerms: () => void
  onOpenClasses: () => void
  onOpenTeachingDay: () => void
  onOpenImport: () => void
  onOpenUnits: () => void
  onOpenLessons: () => void
  onOpenTaskBar?: () => void
  onCustomizeDesk: () => void
}

export function SettingsFurnitureContent({
  preferences,
  hasTerms,
  hasClasses,
  hasUnits,
  hasLessons,
  onChangePreferences,
  onOpenCalendarSetup,
  onOpenTerms,
  onOpenClasses,
  onOpenTeachingDay,
  onOpenImport,
  onOpenUnits,
  onOpenLessons,
  onOpenTaskBar,
  onCustomizeDesk,
}: Props) {
  return (
    <div className="b01-settings-content">
      <section className="b01-settings-group" aria-labelledby="settings-school-year">
        <h2 id="settings-school-year">My school year</h2>
        <button type="button" className="b01-settings-action" onClick={onOpenCalendarSetup}>Calendar dates</button>
        <button type="button" className="b01-settings-action" onClick={onOpenTerms}>{hasTerms ? 'Term boundaries' : 'Set term boundaries'}</button>
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-teaching-day">
        <h2 id="settings-teaching-day">My teaching day</h2>
        {hasClasses ? (
          <button type="button" className="b01-settings-action" onClick={onOpenTeachingDay}>Teaching day & planning</button>
        ) : (
          <p className="b01-settings-muted">Set courses first to shape your teaching day.</p>
        )}
        {onOpenTaskBar ? <button type="button" className="b01-settings-action" onClick={onOpenTaskBar}>Task bar</button> : null}
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-courses">
        <h2 id="settings-courses">My courses</h2>
        <button type="button" className="b01-settings-action" onClick={onOpenClasses}>{hasClasses ? 'Courses & sections' : 'Set courses & sections'}</button>
        {hasClasses && <button type="button" className="b01-settings-action" onClick={onOpenUnits}>{hasUnits ? 'Unit library' : 'Add units'}</button>}
        {hasUnits && <button type="button" className="b01-settings-action" onClick={onOpenLessons}>{hasLessons ? 'Lesson library' : 'Add lessons'}</button>}
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-planning">
        <h2 id="settings-planning">Planning</h2>
        <CalendarViewPreferences
          preferences={preferences}
          onChange={(next) => onChangePreferences({ ...next, desk: preferences.desk })}
        />
      </section>

      <DeskSetupSettings
        preferences={preferences}
        onChange={onChangePreferences}
        onCustomizeDesk={onCustomizeDesk}
      />

      <section className="b01-settings-group" aria-labelledby="settings-arctable">
        <h2 id="settings-arctable">ArcTable</h2>
        <p className="b01-settings-muted">ArcTable stays on your desk during live class. Show or hide the desk fixture under Desk setup.</p>
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-accessibility">
        <h2 id="settings-accessibility">Accessibility & display</h2>
        <p className="b01-settings-muted">Weekend visibility lives under Desk setup. Day notes follow your planner edits in Month and Day views.</p>
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-data">
        <h2 id="settings-data">Data / import / reuse</h2>
        {hasClasses ? (
          <button type="button" className="b01-settings-action" onClick={onOpenImport}>Import curriculum</button>
        ) : (
          <p className="b01-settings-muted">Import unlocks after courses are set.</p>
        )}
      </section>
    </div>
  )
}
