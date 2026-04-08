import { useEffect, useMemo, useRef, useState } from 'react'
import { EntityIcon } from '../../components/EntityIcon'
import { ProjectTable } from '../../components/ProjectTable'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import { useUserSession } from '../../store/useUserSession'
import pageStyles from '../../styles/page.module.css'
import type { Project } from '../../types/project'
import { allWorkStatuses, getMemberDefaultProjectStatusFilters } from '../../utils/userPreferences'
import { getProjectCurrentPhase, getProjectPm } from '../../utils/projectUtils'
import styles from './ProjectListPage.module.css'

type ViewMode = 'all' | 'bookmarks'

export function ProjectListPage() {
  const { projects, members, systems, getProjectPhases, isLoading, error } = useProjectData()
  const { currentUser, saveDefaultProjectStatusFilters, toggleBookmark } = useUserSession()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const currentUserId = currentUser?.id ?? null
  const currentUserRef = useRef(currentUser)
  currentUserRef.current = currentUser
  const [selectedStatuses, setSelectedStatuses] = useState<Project['status'][]>(() =>
    getMemberDefaultProjectStatusFilters(currentUser),
  )
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  useEffect(() => {
    setSelectedStatuses(getMemberDefaultProjectStatusFilters(currentUserRef.current))
    setSaveFeedback(null)
  }, [currentUserId])

  const systemNameById = useMemo(
    () => new Map(systems.map((system) => [system.id, system.name])),
    [systems],
  )

  const bookmarkFilteredProjects = useMemo(() => {
    if (viewMode !== 'bookmarks' || !currentUser) {
      return projects
    }

    const bookmarkedSet = new Set(currentUser.bookmarkedProjectIds)
    return projects.filter((project) => bookmarkedSet.has(project.projectNumber))
  }, [currentUser, projects, viewMode])

  const filteredProjects = useMemo(
    () => bookmarkFilteredProjects.filter((project) => selectedStatuses.includes(project.status)),
    [bookmarkFilteredProjects, selectedStatuses],
  )

  const rows = useMemo(
    () =>
      filteredProjects.map((project) => {
        const projectPhases = getProjectPhases(project.projectNumber)
        const currentPhase = getProjectCurrentPhase(projectPhases)
        const pm = getProjectPm(project, members)

        return {
          project,
          currentPhaseName: currentPhase?.name ?? '未設定',
          pmName: pm?.name ?? '未設定',
          primarySystemName: systemNameById.get(project.relatedSystemIds?.[0] ?? ''),
        }
      }),
    [filteredProjects, getProjectPhases, members, systemNameById],
  )

  const summary = {
    total: filteredProjects.length,
    inProgress: filteredProjects.filter((project) => project.status === '進行中').length,
    delayed: filteredProjects.filter((project) => project.status === '遅延').length,
    completed: filteredProjects.filter((project) => project.status === '完了').length,
  }

  const hasStatusSelection = selectedStatuses.length > 0

  const emptyState =
    viewMode === 'bookmarks' && currentUser && rows.length === 0 && hasStatusSelection
      ? {
          title: '条件に一致するブックマーク案件はありません',
          description:
            'ブックマークした案件はありますが、選択中の状態フィルターに一致していません。状態を見直してください。',
        }
      : viewMode === 'bookmarks' && currentUser && rows.length === 0
        ? {
            title: 'ブックマーク案件はまだありません',
            description: '一覧の追加ボタンから案件をブックマークできます。',
          }
        : !hasStatusSelection
          ? {
              title: '状態フィルターが選択されていません',
              description: '表示したい状態にチェックを入れると、案件一覧が表示されます。',
            }
          : rows.length === 0
            ? {
                title: '条件に一致する案件はありません',
                description: '状態フィルターや表示モードを調整してください。',
              }
            : null

  const handleStatusToggle = (status: Project['status']) => {
    setSaveFeedback(null)
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
    )
  }

  const handleSaveDefaults = async () => {
    if (!currentUser) {
      return
    }

    setIsSavingDefaults(true)
    setSaveFeedback(null)

    try {
      await saveDefaultProjectStatusFilters(selectedStatuses)
      setSaveFeedback('現在の状態フィルターを既定値として保存しました。')
    } catch {
      setSaveFeedback('既定フィルターの保存に失敗しました。')
    } finally {
      setIsSavingDefaults(false)
    }
  }

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
        <h1 className={styles.sectionTitle}>案件一覧を表示できませんでした</h1>
        <p className={styles.sectionDescription}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div className={styles.heroHeader}>
          <div className={pageStyles.heroHeading}>
            <EntityIcon className={pageStyles.heroIcon} kind="project" />
            <div className={pageStyles.heroHeadingBody}>
              <p className={styles.eyebrow}>Project Portfolio</p>
              <h1 className={styles.title}>案件一覧</h1>
              <p className={styles.description}>
                進捗、体制、主システムを一覧で確認できます。利用中メンバーのブックマーク案件だけに絞り込むこともできます。
              </p>
            </div>
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
              className={viewMode === 'bookmarks' ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle}
              disabled={!currentUser}
              onClick={() => setViewMode('bookmarks')}
              type="button"
            >
              ブックマーク
            </button>
          </div>
          <p className={styles.filterHint}>
            {currentUser
              ? `${currentUser.name} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
              : '右上で利用メンバーを選ぶと、ブックマーク案件を利用できます。'}
          </p>
        </div>

        <div className={styles.statusFilters}>
          <div className={styles.statusFilterHeader}>
            <p className={styles.statusFilterTitle}>状態フィルター</p>
            <p className={styles.statusFilterHint}>複数選択できます。完了だけ外す使い方を想定しています。</p>
          </div>
          <div className={styles.statusFilterActions}>
            <Button
              disabled={!currentUser || isSavingDefaults}
              onClick={() => void handleSaveDefaults()}
              size="small"
              variant="secondary"
            >
              {isSavingDefaults ? '保存中...' : 'この状態を既定値に保存'}
            </Button>
            <p className={styles.statusFilterMeta}>
              {saveFeedback ??
                (currentUser
                  ? '利用メンバーごとに次回表示時の初期状態として保存されます。'
                  : '利用メンバーを選択すると既定値を保存できます。')}
            </p>
          </div>
          <div className={styles.statusCheckboxGroup}>
            {allWorkStatuses.map((status) => (
              <label className={styles.statusCheckbox} key={status}>
                <input
                  checked={selectedStatuses.includes(status)}
                  onChange={() => handleStatusToggle(status)}
                  type="checkbox"
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </div>
      </Panel>

      <section className={styles.summaryGrid}>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>総案件数</span>
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
              案件ごとの PM、現在フェーズ、開始日、終了日、主システムを確認できます。
            </p>
          </div>
        </div>

        {emptyState ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyStateTitle}>{emptyState.title}</h3>
            <p className={styles.emptyStateText}>{emptyState.description}</p>
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
