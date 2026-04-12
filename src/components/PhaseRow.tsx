import type { Phase, WorkStatus } from '../types/project'
import { getPhaseToneKey } from '../utils/projectPhasePresets'
import { isDateInWeekSlot, type WeekSlot } from '../utils/projectUtils'
import { StatusBadge } from './StatusBadge'
import styles from './PhaseRow.module.css'

function getStatusClassName(status: Phase['status']) {
  switch (status) {
    case '完了':
      return styles.completed
    case '進行中':
      return styles.inProgress
    case '遅延':
      return styles.delayed
    case '未着手':
    default:
      return styles.notStarted
  }
}

interface PhaseRowProps {
  phase: Phase
  weekSlots: WeekSlot[]
  editable?: boolean
  isSelected?: boolean
  isDragging?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  canRemove?: boolean
  onSelect?: (phaseId: string) => void
  onConfirm?: (phaseId: string) => void
  onCancel?: (phaseId: string) => void
  onMove?: (phaseId: string, direction: 'up' | 'down') => void
  onResizeStart?: (phaseId: string, edge: 'start' | 'end') => void
  onResizeHover?: (phaseId: string, week: number) => void
  onStatusChange?: (phaseId: string, status: WorkStatus) => void
  onRemove?: (phaseId: string) => void
  workStatusOptions?: WorkStatus[]
}

export function PhaseRow({
  phase,
  weekSlots,
  editable = false,
  isSelected = false,
  isDragging = false,
  canMoveUp = false,
  canMoveDown = false,
  canRemove = true,
  onSelect,
  onConfirm,
  onCancel,
  onMove,
  onResizeStart,
  onResizeHover,
  onStatusChange,
  onRemove,
  workStatusOptions = [],
}: PhaseRowProps) {
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`
  const rowClassName = isSelected ? `${styles.row} ${styles.selectedRow}` : styles.row
  const phaseToneKey = getPhaseToneKey(phase.name)
  const phaseToneClassName = styles[phaseToneKey]
  const metaClassName = isSelected
    ? `${styles.metaCell} ${styles.selectedMetaCell}`
    : styles.metaCell

  return (
    <div className={rowClassName} style={{ gridTemplateColumns: columns }}>
      <div
        className={`${metaClassName} ${styles.phaseToneMeta}`}
        onClick={() => onSelect?.(phase.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.(phase.id)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className={styles.metaHeader}>
          <span className={`${styles.phaseName} ${styles.phaseNameChip} ${phaseToneClassName}`}>
            {phase.name}
          </span>
          <StatusBadge status={phase.status} />
        </div>
        <div className={styles.metaList}>
          <span>
            期間: W{phase.startWeek} - W{phase.endWeek}
          </span>
        </div>
        {editable && isSelected ? (
          <div className={styles.editControls}>
            <span className={styles.editHint}>
              {isDragging
                ? 'ドラッグ中: 週セル上で期間を調整'
                : '右端をドラッグで終了週調整。必要なら左端で開始週も調整できます。'}
            </span>
            <label className={styles.statusField}>
              <span className={styles.statusLabel}>状態</span>
              <select
                className={styles.statusSelect}
                data-testid={`timeline-status-${phase.id}`}
                onChange={(event) => {
                  event.stopPropagation()
                  onStatusChange?.(phase.id, event.target.value as WorkStatus)
                }}
                onClick={(event) => {
                  event.stopPropagation()
                }}
                value={phase.status}
              >
                {workStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.reorderActions}>
              <button
                className={styles.reorderButton}
                data-testid={`timeline-move-up-${phase.id}`}
                disabled={!canMoveUp}
                onClick={(event) => {
                  event.stopPropagation()
                  onMove?.(phase.id, 'up')
                }}
                type="button"
              >
                上へ
              </button>
              <button
                className={styles.reorderButton}
                data-testid={`timeline-move-down-${phase.id}`}
                disabled={!canMoveDown}
                onClick={(event) => {
                  event.stopPropagation()
                  onMove?.(phase.id, 'down')
                }}
                type="button"
              >
                下へ
              </button>
            </div>
            <div className={styles.editActions}>
              <button
                className={styles.removeButton}
                data-testid={`timeline-remove-${phase.id}`}
                disabled={!canRemove}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove?.(phase.id)
                }}
                type="button"
              >
                削除
              </button>
              <button
                className={styles.confirmButton}
                data-testid={`timeline-confirm-${phase.id}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onConfirm?.(phase.id)
                }}
                type="button"
              >
                確定
              </button>
              <button
                className={styles.cancelButton}
                data-testid={`timeline-cancel-${phase.id}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onCancel?.(phase.id)
                }}
                type="button"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {weekSlots.map((slot) => {
        const active = slot.index >= phase.startWeek && slot.index <= phase.endWeek
        const isCurrentWeek = isDateInWeekSlot(slot.startDate)
        const cellStateClassName = active
          ? `${styles.weekCell} ${styles.active} ${getStatusClassName(phase.status)} ${isCurrentWeek ? styles.currentWeek : ''}`
          : `${styles.weekCell} ${styles.inactive} ${isCurrentWeek ? styles.currentWeek : ''}`
        const cellClassName = isSelected
          ? `${cellStateClassName} ${styles.selectedCell}`
          : cellStateClassName
        const showStartHandle = editable && isSelected && active && slot.index === phase.startWeek
        const showEndHandle = editable && isSelected && active && slot.index === phase.endWeek

        return (
          <div
            className={cellClassName}
            data-phase-tone={active ? phaseToneKey : undefined}
            data-testid={`timeline-phase-cell-${phase.id}-${slot.index}`}
            key={`${phase.id}-${slot.index}`}
            onClick={() => onSelect?.(phase.id)}
            onMouseEnter={() => onResizeHover?.(phase.id, slot.index)}
          >
            {showStartHandle ? (
              <button
                aria-label={`${phase.name} 開始週を調整`}
                className={`${styles.resizeHandle} ${styles.startHandle}`}
                data-testid={`timeline-resize-start-${phase.id}`}
                onMouseDown={() => onResizeStart?.(phase.id, 'start')}
                type="button"
              />
            ) : null}
            {showEndHandle ? (
              <button
                aria-label={`${phase.name} 終了週を調整`}
                className={`${styles.resizeHandle} ${styles.endHandle}`}
                data-testid={`timeline-resize-end-${phase.id}`}
                onMouseDown={() => onResizeStart?.(phase.id, 'end')}
                type="button"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
