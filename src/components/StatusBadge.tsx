import type { ProjectStatus } from '../types/project'
import styles from './StatusBadge.module.css'

function getStatusClassName(status: ProjectStatus) {
  switch (status) {
    case '完了':
      return styles.completed
    case '進行中':
      return styles.inProgress
    case '遅延':
      return styles.delayed
    case '中止':
      return styles.cancelled
    case '未着手':
    default:
      return styles.notStarted
  }
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`${styles.badge} ${getStatusClassName(status)}`}>{status}</span>
}
