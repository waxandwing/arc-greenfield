import type { DeskObjectKind, MscSizePreset, PlannerSizePreset, TraySizePreset } from '../navigation/deskLayout'

type Props = {
  selectedObject: DeskObjectKind
  sizes: { planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }
  onSizeChange: (patch: Partial<{ planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }>) => void
  onPinDown: () => void
  onReset: () => void
  resetNeedsConfirm: boolean
}

export function DeskEditToolbar({ selectedObject, sizes, onSizeChange, onPinDown, onReset, resetNeedsConfirm }: Props) {
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
        <span>Tray size</span>
        <select value={sizes.tray} onChange={(event) => onSizeChange({ tray: event.target.value as TraySizePreset })}>
          <option value="standard">Standard</option>
          <option value="wide">Wide</option>
        </select>
      </label>
    ) : selectedObject === 'msc' ? (
      <label className="desk-edit-size-control">
        <span>MSC size</span>
        <select value={sizes.msc} onChange={(event) => onSizeChange({ msc: event.target.value as MscSizePreset })}>
          <option value="compact">Compact</option>
          <option value="standard">Standard</option>
        </select>
      </label>
    ) : null

  return (
    <div className="desk-edit-toolbar" role="region" aria-label="Edit Workspace" data-testid="desk-edit-toolbar">
      <p className="desk-edit-toolbar-label">
        Edit Workspace — select furniture, use arrow keys to move; planning drag is paused.
      </p>
      <div className="desk-edit-toolbar-actions">
        {sizeField}
        <button type="button" className="quiet-button" onClick={onReset}>
          {resetNeedsConfirm ? 'Confirm reset layout' : 'Reset layout'}
        </button>
        <button type="button" className="b01-settings-action b01-settings-action--primary" onClick={onPinDown}>
          Pin it down
        </button>
      </div>
    </div>
  )
}
