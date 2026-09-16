import type { DeskMoveDirection, DeskObjectKind, MscSizePreset, PlannerSizePreset, TraySizePreset } from '../navigation/deskLayout'

type Props = {
  selectedObject: DeskObjectKind
  sizes: { planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }
  onSizeChange: (patch: Partial<{ planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }>) => void
  onMove?: (direction: DeskMoveDirection) => void
  canMove?: boolean
  onDone: () => void
  onReset: () => void
  resetNeedsConfirm: boolean
}

export function DeskEditToolbar({
  selectedObject,
  sizes,
  onSizeChange,
  onMove,
  canMove = false,
  onDone,
  onReset,
  resetNeedsConfirm,
}: Props) {
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
        ? 'Tray'
        : selectedObject === 'msc'
          ? 'Must / Should / Could'
          : selectedObject === 'arctable'
            ? 'ArcTable'
            : 'Notes'

  return (
    <div className="desk-edit-toolbar" role="region" aria-label="Desk edit mode" data-testid="desk-edit-toolbar">
      <div>
        <p className="desk-edit-toolbar-label">
          Desk edit mode — select a piece, then move it.
        </p>
        <p className="desk-edit-toolbar-hint" data-testid="desk-edit-move-hint">
          {canMove
            ? `${selectedLabel}: drag it, or use the arrows / keyboard.`
            : `${selectedLabel} stays put — pick Tray, ArcTable, Must/Should/Could, or Notes to move.`}
        </p>
      </div>
      <div className="desk-edit-toolbar-actions">
        {canMove && onMove ? (
          <div className="desk-edit-move-pad" role="group" aria-label={`Move ${selectedLabel}`} data-testid="desk-edit-move-pad">
            <button type="button" className="desk-edit-move-btn" data-dir="up" aria-label="Move up" onClick={() => onMove('up')}>↑</button>
            <button type="button" className="desk-edit-move-btn" data-dir="left" aria-label="Move left" onClick={() => onMove('left')}>←</button>
            <span className="desk-edit-move-spacer" aria-hidden="true" />
            <button type="button" className="desk-edit-move-btn" data-dir="right" aria-label="Move right" onClick={() => onMove('right')}>→</button>
            <button type="button" className="desk-edit-move-btn" data-dir="down" aria-label="Move down" onClick={() => onMove('down')}>↓</button>
          </div>
        ) : null}
        {sizeField}
        <button type="button" className="quiet-button" onClick={onReset}>
          {resetNeedsConfirm ? 'Confirm reset desk' : 'Reset desk'}
        </button>
        <button type="button" className="b01-settings-action b01-settings-action--primary" onClick={onDone}>
          Done arranging
        </button>
      </div>
    </div>
  )
}
