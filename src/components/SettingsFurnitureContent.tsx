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
  onEditWorkspace: () => void
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
  onEditWorkspace,
}: Props) {
  return (
    <div className="b01-settings-content">
      <section className="b01-settings-group" aria-labelledby="settings-school-classes">
        <h2 id="settings-school-classes">School & classes</h2>
        <button type="button" className="b01-settings-action" onClick={onOpenCalendarSetup}>Calendar dates</button>
        <button type="button" className="b01-settings-action" onClick={onOpenTerms}>{hasTerms ? 'Term boundaries' : 'Set term boundaries'}</button>
        <button type="button" className="b01-settings-action" onClick={onOpenClasses}>{hasClasses ? 'Courses & sections' : 'Set courses & sections'}</button>
        {hasClasses ? (
          <button type="button" className="b01-settings-action" onClick={onOpenTeachingDay}>Teaching day & planning</button>
        ) : (
          <p className="b01-settings-muted">Set courses first to shape your teaching day.</p>
        )}
        {onOpenTaskBar ? <button type="button" className="b01-settings-action" onClick={onOpenTaskBar}>Task bar</button> : null}
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-planning">
        <h2 id="settings-planning">Planning</h2>
        <CalendarViewPreferences
          preferences={preferences}
          onChange={(next) => onChangePreferences({ ...next, desk: preferences.desk })}
        />
        {hasClasses ? <button type="button" className="b01-settings-action" onClick={onOpenUnits}>{hasUnits ? 'Unit library' : 'Add units'}</button> : null}
        {hasUnits ? <button type="button" className="b01-settings-action" onClick={onOpenLessons}>{hasLessons ? 'Lesson library' : 'Add lessons'}</button> : null}
      </section>

      <DeskSetupSettings
        preferences={preferences}
        onChange={onChangePreferences}
        onEditWorkspace={onEditWorkspace}
      />

      <section className="b01-settings-group" aria-labelledby="settings-data">
        <h2 id="settings-data">Data & reuse</h2>
        {hasClasses ? (
          <button type="button" className="b01-settings-action" onClick={onOpenImport}>Import curriculum</button>
        ) : (
          <p className="b01-settings-muted">Import unlocks after courses are set.</p>
        )}
      </section>
    </div>
  )
}
