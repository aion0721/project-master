import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import { getActiveEventsForWeek, getActivePhasesForWeek, getProjectPm, isDateInWeekSlot } from '../utils/projectUtils'
import { getPhaseToneKey, useCrossProjectView } from './cross-project/useCrossProjectView'
import styles from './CrossProjectViewPage.module.css'

export function CrossProjectViewPage() {
  const { projects, members, getProjectPhases, getProjectEvents, isLoading, error } = useProjectData()
  const { currentUser } = useUserSession()
  const {
    filteredProjects,
    globalWeekSlots,
    hasNoProjectsInMode,
    hasNoSearchResults,
    isBookmarkMode,
    keyword,
    peakBusy,
    setKeyword,
    setViewMode,
    viewMode,
  } = useCrossProjectView({
    currentUser,
    getProjectEvents,
    getProjectPhases,
    projects,
  })

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを読み込み中です</h1>
        <p className={styles.description}>バックエンドから横断表示用データを取得しています。</p>
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

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div>
          <p className={styles.eyebrow}>Cross Project Timeline</p>
          <h1 className={styles.title}>複数案件横断ビュー</h1>
          <p className={styles.description}>
            複数案件がどの週にどのフェーズへ入っているかを横断で確認できます。表示モードを
            切り替えつつ、プロジェクト番号または案件名で絞り込めます。
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
                  viewMode === 'bookmarks' ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle
                }
                disabled={!currentUser}
                onClick={() => setViewMode('bookmarks')}
                type="button"
              >
                ブックマーク
              </button>
            </div>

            <label className={styles.searchField}>
              <span className={styles.searchLabel}>案件フィルター</span>
              <input
                aria-label="プロジェクト番号または案件名でフィルター"
                className={styles.searchInput}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="例: PRJ-001 / 会計"
                type="search"
                value={keyword}
              />
            </label>
          </div>

          <p className={styles.filterHint}>
            {currentUser
              ? `${currentUser.username} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
              : 'ログインすると、ブックマーク案件だけを横断表示できます。'}
          </p>
        </div>

        <div className={styles.heroStats}>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>表示案件数</span>
            <strong className={styles.statValue}>{filteredProjects.length}</strong>
          </Panel>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>最大重複数</span>
            <strong className={styles.statValue}>{peakBusy} Phase / Week</strong>
          </Panel>
        </div>
      </Panel>

      <Panel className={styles.section}>
        {isBookmarkMode && hasNoProjectsInMode ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>ブックマーク案件はまだありません</h2>
            <p className={styles.emptyStateText}>
              案件一覧または案件詳細から案件をブックマークすると、ここで横断表示できます。
            </p>
          </div>
        ) : hasNoSearchResults ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>条件に一致する案件がありません</h2>
            <p className={styles.emptyStateText}>
              プロジェクト番号または案件名の検索条件を変更してください。
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.stickyColumn}>案件名</th>
                  {globalWeekSlots.map((slot) => {
                    const isCurrentWeek = isDateInWeekSlot(slot.startDate)

                    return (
                      <th
                        key={slot.index}
                        className={isCurrentWeek ? styles.currentWeekHeader : undefined}
                        data-testid={isCurrentWeek ? `cross-project-current-week-${slot.index}` : undefined}
                      >
                        <span className={styles.weekLabel}>{slot.label}</span>
                        <span className={styles.weekDate}>{slot.subLabel}</span>
                        {isCurrentWeek ? <span className={styles.currentWeekBadge}>今週</span> : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const projectPhases = getProjectPhases(project.projectNumber)
                  const projectEvents = getProjectEvents(project.projectNumber)
                  const pm = getProjectPm(project, members)

                  return (
                    <tr key={project.projectNumber}>
                      <td className={styles.stickyColumn}>
                        <div className={styles.projectInfo}>
                          <Link className={styles.projectLink} to={`/projects/${project.projectNumber}`}>
                            {project.name}
                          </Link>
                          <div className={styles.metaLine}>{project.projectNumber}</div>
                          <div className={styles.metaLine}>PM: {pm?.name ?? '未設定'}</div>
                          <StatusBadge status={project.status} />
                        </div>
                      </td>

                      {globalWeekSlots.map((slot) => {
                        const activePhases = getActivePhasesForWeek(project, projectPhases, slot.startDate)
                        const activeEvents = getActiveEventsForWeek(projectEvents, slot.index)
                        const busy = activePhases.length + activeEvents.length > 1
                        const isCurrentWeek = isDateInWeekSlot(slot.startDate)

                        return (
                          <td
                            key={`${project.projectNumber}-${slot.index}`}
                            className={
                              busy
                                ? `${styles.cell} ${styles.busy} ${isCurrentWeek ? styles.currentWeekCell : ''}`
                                : `${styles.cell} ${isCurrentWeek ? styles.currentWeekCell : ''}`
                            }
                          >
                            {activePhases.length > 0 || activeEvents.length > 0 ? (
                              <div className={styles.phaseChipList}>
                                {activePhases.map((phase) => (
                                  <span
                                    key={phase.id}
                                    className={`${styles.phaseChip} ${styles[getPhaseToneKey(phase.name)]}`}
                                  >
                                    {phase.name}
                                  </span>
                                ))}
                                {activeEvents.map((event) => (
                                  <span
                                    key={event.id}
                                    className={`${styles.phaseChip} ${styles.eventChip}`}
                                    data-testid={`cross-project-event-${project.projectNumber}-${event.id}`}
                                  >
                                    <span className={styles.eventChipTag}>EV</span>
                                    <span className={styles.eventChipText}>{event.name}</span>
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
