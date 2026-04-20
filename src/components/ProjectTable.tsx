import { useMemo, useRef } from "react"
import type { Project } from '../types/project'
import { formatDate } from '../utils/projectUtils'
import { useVirtualWindow } from "./useVirtualWindow"
import { StatusBadge } from './StatusBadge'
import { Button } from './ui/Button'
import styles from './ProjectTable.module.css'

interface ProjectTableRow {
  project: Project
  currentPhaseName: string
  pmName: string
  departmentNames: string[]
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
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const bookmarkedSet = useMemo(() => new Set(bookmarkedProjectIds), [bookmarkedProjectIds])
  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualWindow({
    containerRef: wrapperRef,
    itemCount: rows.length,
    getItemSize: () => 124,
    overscan: 8,
  })
  const visibleRows = endIndex >= startIndex ? rows.slice(startIndex, endIndex + 1) : []
  const columnCount = onToggleBookmark ? 8 : 7

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
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
          {paddingTop > 0 ? (
            <tr className={styles.spacerRow} aria-hidden="true">
              <td colSpan={columnCount} style={{ height: `${paddingTop}px`, padding: 0 }} />
            </tr>
          ) : null}
          {visibleRows.map(({ project, currentPhaseName, pmName, primarySystemName, departmentNames }) => {
            const isBookmarked = bookmarkedSet.has(project.projectNumber)
            const projectTitle = `${project.projectNumber}: ${project.name}`
            const detailItems = [
              primarySystemName ? `システム: ${primarySystemName}` : null,
              departmentNames.length > 0 ? `部署: ${departmentNames.join(' / ')}` : null,
            ].filter(Boolean)

            return (
              <tr key={project.projectNumber}>
                <td>
                  <div className={styles.projectCell}>
                    <span className={styles.projectTitle}>{projectTitle}</span>
                    {detailItems.length > 0 ? (
                      <div className={styles.systemChipList}>
                        {detailItems.map((detailItem) => (
                          <span
                            className={`${styles.systemChip} ${styles.departmentChip}`}
                            key={`${project.projectNumber}-${detailItem}`}
                          >
                            {detailItem}
                          </span>
                        ))}
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
          {paddingBottom > 0 ? (
            <tr className={styles.spacerRow} aria-hidden="true">
              <td colSpan={columnCount} style={{ height: `${paddingBottom}px`, padding: 0 }} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
