import { useMemo, useState } from 'react'
import { ProjectTable } from '../components/ProjectTable'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import { getProjectCurrentPhase, getProjectPm } from '../utils/projectUtils'
import styles from './ProjectListPage.module.css'

type ViewMode = 'all' | 'bookmarks'

export function ProjectListPage() {
  const { projects, members, getProjectPhases, isLoading, error } = useProjectData()
  const { currentUser, toggleBookmark } = useUserSession()
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
        <h1 className={styles.sectionTitle}>案件一覧を読み込み中です</h1>
        <p className={styles.sectionDescription}>バックエンドから案件データを取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.sectionTitle}>案件一覧を取得できませんでした</h1>
        <p className={styles.sectionDescription}>{error}</p>
      </Panel>
    )
  }

  const rows = filteredProjects.map((project) => {
    const projectPhases = getProjectPhases(project.id)
    const currentPhase = getProjectCurrentPhase(projectPhases)
    const pm = getProjectPm(project, members)

    return {
      project,
      currentPhaseName: currentPhase?.name ?? '未設定',
      pmName: pm?.name ?? '未設定',
    }
  })

  const summary = {
    total: filteredProjects.length,
    inProgress: filteredProjects.filter((project) => project.status === '進行中').length,
    delayed: filteredProjects.filter((project) => project.status === '遅延').length,
    completed: filteredProjects.filter((project) => project.status === '完了').length,
  }

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div className={styles.heroHeader}>
          <div>
            <p className={styles.eyebrow}>Project Portfolio</p>
            <h1 className={styles.title}>案件一覧</h1>
            <p className={styles.description}>
              進捗と責任体制を一覧で確認できます。ログイン中は、自分でブックマークした案件だけに絞り込めます。
            </p>
          </div>

          <Button to="/projects/new">案件を追加</Button>
        </div>

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
              : '左下でユーザー名を入力すると、ブックマーク案件を使えます。'}
          </p>
        </div>
      </Panel>

      <section className={styles.summaryGrid}>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>対象案件数</span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>進行中</span>
          <strong className={styles.summaryValue}>{summary.inProgress}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>遅延</span>
          <strong className={styles.summaryValue}>{summary.delayed}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>完了</span>
          <strong className={styles.summaryValue}>{summary.completed}</strong>
        </Panel>
      </section>

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {viewMode === 'bookmarks' && currentUser ? 'ブックマーク案件一覧' : '案件ステータス一覧'}
            </h2>
            <p className={styles.sectionDescription}>
              案件ごとの PM、現在フェーズ、状態、開始日、終了予定日を確認できます。
            </p>
          </div>
        </div>

        {viewMode === 'bookmarks' && currentUser && rows.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyStateTitle}>ブックマーク案件はまだありません</h3>
            <p className={styles.emptyStateText}>
              一覧の「追加」または案件詳細のボタンから案件をブックマークできます。
            </p>
          </div>
        ) : (
          <ProjectTable
            bookmarkedProjectIds={currentUser?.bookmarkedProjectIds ?? []}
            onToggleBookmark={
              currentUser
                ? (projectId) => {
                    void toggleBookmark(projectId).catch(() => undefined)
                  }
                : undefined
            }
            rows={rows}
          />
        )}
      </Panel>
    </div>
  )
}
