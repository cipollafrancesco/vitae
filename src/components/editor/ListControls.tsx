import { iconBtnCls, iconBtnDangerCls } from './fieldStyles'

interface ListControlsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  itemLabel?: string
}

export function ListControls({
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  itemLabel = 'item',
}: ListControlsProps) {
  return (
    <div className="flex gap-1 shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`Move ${itemLabel} up`}
        className={iconBtnCls}
        title="Move up"
      >
        <span aria-hidden="true">▲</span>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`Move ${itemLabel} down`}
        className={iconBtnCls}
        title="Move down"
      >
        <span aria-hidden="true">▼</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${itemLabel}`}
        className={iconBtnDangerCls}
        title="Remove"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  )
}
