import type { WorkStatus } from '../types/project'
import styles from './StatusBadge.module.css'

function getStatusClassName(status: WorkStatus) {
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

export function StatusBadge({ status }: { status: WorkStatus }) {
  return <span className={`${styles.badge} ${getStatusClassName(status)}`}>{status}</span>
}
