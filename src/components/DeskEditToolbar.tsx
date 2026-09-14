type Props = {
  onDone: () => void
  onReset: () => void
  resetNeedsConfirm: boolean
}

export function DeskEditToolbar({ onDone, onReset, resetNeedsConfirm }: Props) {
  return (
    <div className="desk-edit-toolbar" role="region" aria-label="Desk edit mode" data-testid="desk-edit-toolbar">
      <p className="desk-edit-toolbar-label">Desk edit mode — move objects with arrow keys; planning drag is paused.</p>
      <div className="desk-edit-toolbar-actions">
        <button type="button" className="quiet-button" onClick={onReset}>
          {resetNeedsConfirm ? 'Confirm reset desk' : 'Reset desk'}
        </button>
        <button type="button" className="b01-settings-action b01-settings-action--primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
