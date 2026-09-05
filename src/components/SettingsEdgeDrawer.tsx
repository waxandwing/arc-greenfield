import { CalendarViewPreferences } from './CalendarViewPreferences'
import type { ViewPreferences } from '../navigation/viewPreferences'

type Props = {
  open: boolean
  preferences: ViewPreferences
  hasTerms: boolean
  hasClasses: boolean
  hasUnits: boolean
  hasLessons: boolean
  recoveryCount: number
  undoAvailable: boolean
  onChangePreferences: (next: ViewPreferences) => void
  onClose: () => void
  onOpenCalendarSetup: () => void
  onOpenTerms: () => void
  onOpenCoursesSections: () => void
  onOpenUnits: () => void
  onOpenLessons: () => void
  onOpenRecovery: () => void
  onUndoShift: () => void
}

export function SettingsEdgeDrawer(props: Props) {
  const {
    open,
    preferences,
    hasTerms,
    hasClasses,
    hasUnits,
    hasLessons,
    recoveryCount,
    undoAvailable,
    onChangePreferences,
    onClose,
    onOpenCalendarSetup,
    onOpenTerms,
    onOpenCoursesSections,
    onOpenUnits,
    onOpenLessons,
    onOpenRecovery,
    onUndoShift,
  } = props

  return (
    <aside
      className={`settings-edge-drawer${open ? ' settings-edge-drawer--open' : ''}`}
      hidden={!open}
      aria-label="Settings and setup"
    >
      <header className="settings-edge-drawer__header">
        <div>
          <p className="section-label">Settings</p>
          <h2>Quiet controls.</h2>
          <p>Setup, preferences, and low-frequency utilities live here — not in a permanent rail.</p>
        </div>
        <button type="button" className="quiet-button" onClick={onClose} aria-label="Close Settings">×</button>
      </header>

      <section className="settings-edge-drawer__section" aria-label="Calendar preferences">
        <CalendarViewPreferences preferences={preferences} onChange={onChangePreferences} />
      </section>

      <section className="settings-edge-drawer__section" aria-label="Setup">
        <p className="settings-edge-drawer__kicker">Setup</p>
        <button type="button" onClick={onOpenCalendarSetup}>School calendar</button>
        <button type="button" onClick={onOpenTerms}>{hasTerms ? 'Edit terms' : 'Set terms'}</button>
        <button type="button" onClick={onOpenCoursesSections}>{hasClasses ? 'Edit courses & sections' : 'Set courses & sections'}</button>
        {hasClasses && <button type="button" onClick={onOpenUnits}>{hasUnits ? 'Edit Units' : 'Add Units'}</button>}
        {hasUnits && <button type="button" onClick={onOpenLessons}>{hasLessons ? 'Edit Lessons' : 'Add Lessons'}</button>}
      </section>

      {(recoveryCount > 0 || undoAvailable) && (
        <section className="settings-edge-drawer__section" aria-label="Recovery">
          <p className="settings-edge-drawer__kicker">Recovery</p>
          {recoveryCount > 0 && <button type="button" onClick={onOpenRecovery}>Review recovery ({recoveryCount})</button>}
          {undoAvailable && <button type="button" onClick={onUndoShift}>Undo last Shift</button>}
        </section>
      )}

      <section className="settings-edge-drawer__section settings-edge-drawer__section--reserved" aria-label="Reserved utilities">
        <span>Class rosters</span>
        <span>Appearance + accessibility</span>
        <span>Help + keyboard guide</span>
      </section>
    </aside>
  )
}
