import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import { formatDate } from '../utils/projectUtils'
import { StatusBadge } from './StatusBadge'
import styles from './ProjectTable.module.css'

interface ProjectTableRow {
  project: Project
  currentPhaseName: string
  pmName: string
}

export function ProjectTable({ rows }: { rows: ProjectTableRow[] }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>案件名</th>
            <th>現在フェーズ</th>
            <th>PM</th>
            <th>状態</th>
            <th>開始日</th>
            <th>終了予定日</th>
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ project, currentPhaseName, pmName }) => (
            <tr key={project.id}>
              <td>
                <div className={styles.projectCell}>
                  <span className={styles.projectName}>{project.name}</span>
                  <span className={styles.projectId}>{project.id.toUpperCase()}</span>
                </div>
              </td>
              <td>{currentPhaseName}</td>
              <td>{pmName}</td>
              <td>
                <StatusBadge status={project.status} />
              </td>
              <td>{formatDate(project.startDate)}</td>
              <td>{formatDate(project.endDate)}</td>
              <td>
                <Link className={styles.linkButton} to={`/projects/${project.id}`}>
                  詳細を見る
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
