import { CalendarViewPreferences } from './CalendarViewPreferences'
import type { ViewPreferences } from '../navigation/viewPreferences'

type Props = {
  preferences: ViewPreferences
  hasTerms: boolean
  hasClasses: boolean
  hasUnits: boolean
  hasLessons: boolean
  onChangePreferences: (next: ViewPreferences) => void
  onOpenCalendarSetup: () => void
  onOpenTerms: () => void
  onOpenClasses: () => void
  onOpenTeachingDay: () => void
  onOpenImport: () => void
  onOpenUnits: () => void
  onOpenLessons: () => void
  onOpenTaskBar?: () => void
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
}: Props) {
  return (
    <div className="b01-settings-content">
      <section className="b01-settings-group" aria-labelledby="settings-school-year">
        <h2 id="settings-school-year">School year</h2>
        <button type="button" className="b01-settings-action" onClick={onOpenCalendarSetup}>Calendar dates</button>
        <button type="button" className="b01-settings-action" onClick={onOpenTerms}>{hasTerms ? 'Term boundaries' : 'Set term boundaries'}</button>
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-teaching-structure">
        <h2 id="settings-teaching-structure">Teaching structure</h2>
        <button type="button" className="b01-settings-action" onClick={onOpenClasses}>{hasClasses ? 'Courses & sections' : 'Set courses & sections'}</button>
        {hasClasses && <button type="button" className="b01-settings-action" onClick={onOpenTeachingDay}>Teaching day & planning</button>}
        {hasClasses && <button type="button" className="b01-settings-action" onClick={onOpenImport}>Import curriculum</button>}
        {hasClasses && <button type="button" className="b01-settings-action" onClick={onOpenUnits}>{hasUnits ? 'Unit library' : 'Add Units'}</button>}
        {hasUnits && <button type="button" className="b01-settings-action" onClick={onOpenLessons}>{hasLessons ? 'Lesson library' : 'Add Lessons'}</button>}
      </section>

      <section className="b01-settings-group" aria-labelledby="settings-view-options">
        <h2 id="settings-view-options">Planner</h2>
        <CalendarViewPreferences preferences={preferences} onChange={onChangePreferences} />
        {onOpenTaskBar ? <button type="button" className="b01-settings-action" onClick={onOpenTaskBar}>Task bar</button> : null}
      </section>
    </div>
  )
}
