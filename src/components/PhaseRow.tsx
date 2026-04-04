import type { Phase } from '../types/project'
import type { WeekSlot } from '../utils/projectUtils'
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
}

export function PhaseRow({ phase, weekSlots }: PhaseRowProps) {
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`

  return (
    <div className={styles.row} style={{ gridTemplateColumns: columns }}>
      <div className={styles.metaCell}>
        <div className={styles.metaHeader}>
          <span className={styles.phaseName}>{phase.name}</span>
          <StatusBadge status={phase.status} />
        </div>
        <div className={styles.metaList}>
          <span>
            期間: W{phase.startWeek} - W{phase.endWeek}
          </span>
          <span>進捗: {phase.progress}%</span>
        </div>
      </div>

      {weekSlots.map((slot) => {
        const active = slot.index >= phase.startWeek && slot.index <= phase.endWeek
        const cellClassName = active
          ? `${styles.weekCell} ${styles.active} ${getStatusClassName(phase.status)}`
          : `${styles.weekCell} ${styles.inactive}`

        return (
          <div key={`${phase.id}-${slot.index}`} className={cellClassName}>
            {active && slot.index === phase.startWeek ? (
              <span className={styles.progressLabel}>{phase.progress}%</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
