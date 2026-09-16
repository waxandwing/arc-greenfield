import type { DeskObjectKind, MscSizePreset, PlannerSizePreset, TraySizePreset } from '../navigation/deskLayout'

type Props = {
  selectedObject: DeskObjectKind
  sizes: { planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }
  onSizeChange: (patch: Partial<{ planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }>) => void
  onDone: () => void
  onReset: () => void
  resetNeedsConfirm: boolean
}

export function DeskEditToolbar({ selectedObject, sizes, onSizeChange, onDone, onReset, resetNeedsConfirm }: Props) {
  const sizeField =
    selectedObject === 'planner' ? (
      <label className="desk-edit-size-control">
        <span>Planner size</span>
        <select value={sizes.planner} onChange={(event) => onSizeChange({ planner: event.target.value as PlannerSizePreset })}>
          <option value="standard">Standard</option>
          <option value="large">Large</option>
        </select>
      </label>
    ) : selectedObject === 'tray' ? (
      <label className="desk-edit-size-control">
        <span>IDEAS size</span>
        <select value={sizes.tray} onChange={(event) => onSizeChange({ tray: event.target.value as TraySizePreset })}>
          <option value="standard">Standard</option>
          <option value="wide">Wide</option>
        </select>
      </label>
    ) : selectedObject === 'msc' ? (
      <label className="desk-edit-size-control">
        <span>To-dos size</span>
        <select value={sizes.msc} onChange={(event) => onSizeChange({ msc: event.target.value as MscSizePreset })}>
          <option value="compact">Compact</option>
          <option value="standard">Standard</option>
        </select>
      </label>
    ) : null

  const selectedLabel =
    selectedObject === 'planner'
      ? 'Planner'
      : selectedObject === 'tray'
        ? 'IDEAS'
        : selectedObject === 'msc'
          ? 'To-dos'
          : selectedObject === 'arctable'
            ? 'ArcTable'
            : 'Notes'

  return (
    <div className="desk-edit-toolbar" role="region" aria-label="Arrange desk" data-testid="desk-edit-toolbar">
      <div>
        <p className="desk-edit-toolbar-label">
          Arrange desk — select a piece, then move it. Planning drag is paused.
        </p>
        <p className="desk-edit-toolbar-hint" data-testid="desk-edit-move-hint">
          {selectedLabel}: drag it, or use arrow keys.
        </p>
      </div>
      <div className="desk-edit-toolbar-actions">
        {sizeField}
        <button type="button" className="quiet-button" onClick={onReset} title="Restores default positions. Your lessons and notes stay.">
          {resetNeedsConfirm ? 'Confirm reset desk layout' : 'Reset desk layout'}
        </button>
        <button type="button" className="b01-settings-action b01-settings-action--primary" onClick={onDone}>
          Done arranging
        </button>
      </div>
    </div>
  )
}
