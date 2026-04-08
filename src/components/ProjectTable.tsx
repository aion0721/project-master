import type { Project } from '../types/project'
import { formatDate } from '../utils/projectUtils'
import { StatusBadge } from './StatusBadge'
import { Button } from './ui/Button'
import styles from './ProjectTable.module.css'

interface ProjectTableRow {
  project: Project
  currentPhaseName: string
  pmName: string
  primarySystemName?: string
}

interface ProjectTableProps {
  rows: ProjectTableRow[]
  bookmarkedProjectIds?: string[]
  onToggleBookmark?: (projectNumber: string) => void
}

export function ProjectTable({
  rows,
  bookmarkedProjectIds = [],
  onToggleBookmark,
}: ProjectTableProps) {
  const bookmarkedSet = new Set(bookmarkedProjectIds)

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
            {onToggleBookmark ? <th>ブックマーク</th> : null}
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ project, currentPhaseName, pmName, primarySystemName }) => {
            const isBookmarked = bookmarkedSet.has(project.projectNumber)

            return (
              <tr key={project.projectNumber}>
                <td>
                  <div className={styles.projectCell}>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectId}>{project.projectNumber}</span>
                    {primarySystemName ? (
                      <div className={styles.systemChipList}>
                        <span className={styles.systemChip} key={`${project.projectNumber}-${primarySystemName}`}>
                          主システム: {primarySystemName}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>{currentPhaseName}</td>
                <td>{pmName}</td>
                <td>
                  <StatusBadge status={project.status} />
                </td>
                <td>{formatDate(project.startDate)}</td>
                <td>{formatDate(project.endDate)}</td>
                {onToggleBookmark ? (
                  <td>
                    <Button
                      onClick={() => onToggleBookmark(project.projectNumber)}
                      size="small"
                      variant={isBookmarked ? 'primary' : 'secondary'}
                    >
                      {isBookmarked ? '保存済み' : '追加'}
                    </Button>
                  </td>
                ) : null}
                <td className={styles.actionCell}>
                  <Button size="small" to={`/projects/${project.projectNumber}`}>
                    詳細を見る
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
