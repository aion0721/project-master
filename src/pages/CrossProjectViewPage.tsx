import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import { getActivePhasesForWeek, getGlobalWeekSlots, getProjectPm } from '../utils/projectUtils'
import styles from './CrossProjectViewPage.module.css'

type ViewMode = 'all' | 'bookmarks'

function getToneClassName(phaseName: string) {
  switch (phaseName) {
    case '基礎検討':
      return styles.discovery
    case '基本設計':
      return styles.basicDesign
    case '詳細設計':
      return styles.detailDesign
    case 'テスト':
      return styles.testing
    case '移行':
      return styles.migration
    default:
      return styles.defaultTone
  }
}

export function CrossProjectViewPage() {
  const { projects, members, getProjectPhases, isLoading, error } = useProjectData()
  const { currentUser } = useUserSession()
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const filteredProjects = useMemo(() => {
    if (viewMode !== 'bookmarks' || !currentUser) {
      return projects
    }

    const bookmarkedSet = new Set(currentUser.bookmarkedProjectIds)
    return projects.filter((project) => bookmarkedSet.has(project.id))
  }, [currentUser, projects, viewMode])

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを読み込み中です</h1>
        <p className={styles.description}>バックエンドから横断データを取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを取得できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </Panel>
    )
  }

  const globalWeekSlots = getGlobalWeekSlots(filteredProjects)
  const peakBusy = Math.max(
    ...filteredProjects.flatMap((project) =>
      globalWeekSlots.map(
        (slot) => getActivePhasesForWeek(project, getProjectPhases(project.id), slot.startDate).length,
      ),
    ),
    0,
  )

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div>
          <p className={styles.eyebrow}>Cross Project Timeline</p>
          <h1 className={styles.title}>複数案件横断ビュー</h1>
          <p className={styles.description}>
            複数案件がどの週にどのフェーズへ入っているかを横断で確認できます。ログイン中はブックマーク案件だけに絞って、担当案件の山を見やすくできます。
          </p>

          <div className={styles.filterRow}>
            <div className={styles.toggleGroup}>
              <button
                className={viewMode === 'all' ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle}
                onClick={() => setViewMode('all')}
                type="button"
              >
                全案件
              </button>
              <button
                className={
                  viewMode === 'bookmarks'
                    ? `${styles.toggle} ${styles.toggleActive}`
                    : styles.toggle
                }
                disabled={!currentUser}
                onClick={() => setViewMode('bookmarks')}
                type="button"
              >
                ブックマーク
              </button>
            </div>
            <p className={styles.filterHint}>
              {currentUser
                ? `${currentUser.username} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
                : '左下でログインすると、ブックマーク案件だけを横断表示できます。'}
            </p>
          </div>
        </div>

        <div className={styles.heroStats}>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>対象案件</span>
            <strong className={styles.statValue}>{filteredProjects.length}</strong>
          </Panel>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>最大稼働週</span>
            <strong className={styles.statValue}>{peakBusy} Phase / Week</strong>
          </Panel>
        </div>
      </Panel>

      <Panel className={styles.section}>
        {viewMode === 'bookmarks' && currentUser && filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>ブックマーク案件はまだありません</h2>
            <p className={styles.emptyStateText}>
              案件一覧または案件詳細から案件をブックマークすると、ここで横断表示できます。
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.stickyColumn}>案件名</th>
                  {globalWeekSlots.map((slot) => (
                    <th key={slot.index}>
                      <span className={styles.weekLabel}>{slot.label}</span>
                      <span className={styles.weekDate}>{slot.subLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const projectPhases = getProjectPhases(project.id)
                  const pm = getProjectPm(project, members)

                  return (
                    <tr key={project.id}>
                      <td className={styles.stickyColumn}>
                        <div className={styles.projectInfo}>
                          <Link className={styles.projectLink} to={`/projects/${project.id}`}>
                            {project.name}
                          </Link>
                          <div className={styles.metaLine}>PM: {pm?.name ?? '未設定'}</div>
                          <StatusBadge status={project.status} />
                        </div>
                      </td>

                      {globalWeekSlots.map((slot) => {
                        const activePhases = getActivePhasesForWeek(project, projectPhases, slot.startDate)
                        const busy = activePhases.length > 1

                        return (
                          <td
                            key={`${project.id}-${slot.index}`}
                            className={busy ? `${styles.cell} ${styles.busy}` : styles.cell}
                          >
                            {activePhases.length > 0 ? (
                              <div className={styles.phaseChipList}>
                                {activePhases.map((phase) => (
                                  <span
                                    key={phase.id}
                                    className={`${styles.phaseChip} ${getToneClassName(phase.name)}`}
                                  >
                                    {phase.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={styles.emptyCell}>-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
