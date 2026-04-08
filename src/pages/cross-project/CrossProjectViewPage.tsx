import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EntityIcon } from '../../components/EntityIcon'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import { useProjectData } from '../../store/useProjectData'
import { useUserSession } from '../../store/useUserSession'
import pageStyles from '../../styles/page.module.css'
import type { Member, Project, ProjectAssignment } from '../../types/project'
import { allWorkStatuses, getMemberDefaultProjectStatusFilters } from '../../utils/userPreferences'
import { getActivePhasesForWeek, getProjectPm, isDateInWeekSlot } from '../../utils/projectUtils'
import { getPhaseToneKey, useCrossProjectView } from './useCrossProjectView'
import styles from './CrossProjectViewPage.module.css'

export function CrossProjectViewPage() {
  const {
    projects,
    members,
    getProjectPhases,
    getProjectEvents,
    getProjectAssignments,
    getMemberById,
    systems,
    isLoading,
    error,
  } = useProjectData()
  const { currentUser, saveDefaultProjectStatusFilters } = useUserSession()
  const currentUserId = currentUser?.id ?? null
  const currentUserRef = useRef(currentUser)
  currentUserRef.current = currentUser
  const [selectedStatuses, setSelectedStatuses] = useState<Project['status'][]>(() =>
    getMemberDefaultProjectStatusFilters(currentUser),
  )
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [isStructureVisible, setIsStructureVisible] = useState(false)
  const [isNoteVisible, setIsNoteVisible] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const [isGroupedByPrimarySystem, setIsGroupedByPrimarySystem] = useState(false)
  const [expandedNoteProjectIds, setExpandedNoteProjectIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedStatuses(getMemberDefaultProjectStatusFilters(currentUserRef.current))
    setSaveFeedback(null)
  }, [currentUserId])

  const {
    filteredProjects,
    globalWeekSlots,
    hasNoProjectsInMode,
    hasNoSearchResults,
    hasNoStatusMatches,
    hasNoStatusesSelected,
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
    selectedStatuses,
  })

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
      setSaveFeedback('既定値フィルターの保存に失敗しました。')
    } finally {
      setIsSavingDefaults(false)
    }
  }

  const toggleExpandedNote = (projectNumber: string) => {
    setExpandedNoteProjectIds((current) =>
      current.includes(projectNumber)
        ? current.filter((id) => id !== projectNumber)
        : current.concat(projectNumber),
    )
  }

  const systemNameById = useMemo(
    () => new Map(systems.map((system) => [system.id, system.name])),
    [systems],
  )

  const groupedProjects = useMemo(() => {
    const groups = new Map<string, Project[]>()

    filteredProjects.forEach((project) => {
      const primarySystemId = project.relatedSystemIds?.[0]
      const groupLabel = primarySystemId
        ? `${primarySystemId} / ${systemNameById.get(primarySystemId) ?? primarySystemId}`
        : '未設定'
      const current = groups.get(groupLabel) ?? []
      current.push(project)
      groups.set(groupLabel, current)
    })

    return [...groups.entries()]
      .sort((left, right) => {
        if (left[0] === '未設定') {
          return 1
        }

        if (right[0] === '未設定') {
          return -1
        }

        return left[0].localeCompare(right[0], 'ja')
      })
      .map(([label, projectsInGroup]) => ({
        label,
        projects: projectsInGroup.sort((left, right) =>
          left.name.localeCompare(right.name, 'ja'),
        ),
      }))
  }, [filteredProjects, systemNameById])

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを読み込み中です</h1>
        <p className={styles.description}>横断表示に必要な案件データを取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを表示できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </Panel>
    )
  }

  const emptyState =
    isBookmarkMode && hasNoProjectsInMode
      ? {
          title: 'ブックマーク案件はまだありません',
          description:
            '案件一覧または案件詳細から案件をブックマークすると、ここで横断表示できます。',
        }
      : hasNoStatusesSelected
        ? {
            title: '状態フィルターが選択されていません',
            description: '表示したい状態にチェックを入れると、横断ビューが表示されます。',
          }
        : hasNoStatusMatches
          ? {
              title: '条件に一致する案件はありません',
              description: '状態フィルターや表示モードを調整してください。',
            }
          : hasNoSearchResults
            ? {
                title: '検索条件に一致する案件がありません',
                description: 'プロジェクト番号または案件名で検索条件を見直してください。',
              }
            : null

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div className={styles.heroMain}>
          <div className={pageStyles.heroHeading}>
            <EntityIcon className={pageStyles.heroIcon} kind="project" />
            <div className={pageStyles.heroHeadingBody}>
              <p className={styles.eyebrow}>Cross Project Timeline</p>
              <h1 className={styles.title}>複数案件横断ビュー</h1>
              <p className={styles.description}>
                複数案件がどの週にどのフェーズへ入っているかを横断で確認できます。表示モードを切り替えると、
                利用中メンバーのブックマーク案件だけも見られます。
              </p>
            </div>
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

            <label className={styles.searchField}>
              <span className={styles.searchLabel}>案件フィルター</span>
              <input
                aria-label="プロジェクト番号または案件名でフィルター"
                className={styles.searchInput}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="例: PRJ-001 / 基幹会計刷新"
                type="search"
                value={keyword}
              />
            </label>
          </div>

          <div className={styles.statusFilters}>
            <div className={styles.statusFilterHeader}>
              <p className={styles.statusFilterTitle}>状態フィルター</p>
              <p className={styles.statusFilterHint}>
                複数選択できます。横断ビューでも完了案件を外して見られます。
              </p>
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
              <p className={styles.statusFilterMeta}>{saveFeedback ?? '利用メンバーを選択すると既定値を保存できます。'}</p>
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

          <p className={styles.filterHint}>
            {currentUser
              ? `${currentUser.name} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
              : '利用メンバーを選ぶと、ブックマーク案件だけで絞り込めます。'}
          </p>

          <div className={styles.structureToggleRow}>
            <p className={styles.structureToggleHint}>
              体制は必要なときだけ表示できます。横断比較の見やすさは維持したまま全員を確認できます。
            </p>
            <div className={styles.toggleActionGroup}>
              <Button
                onClick={() => setIsStructureVisible((current) => !current)}
                size="small"
                variant="secondary"
              >
                {isStructureVisible ? '体制を隠す' : '体制を表示'}
              </Button>
              <Button
                onClick={() => setIsNoteVisible((current) => !current)}
                size="small"
                variant="secondary"
              >
                {isNoteVisible ? 'メモを隠す' : 'メモを表示'}
              </Button>
              <Button
                onClick={() => setIsCompactMode((current) => !current)}
                size="small"
                variant="secondary"
              >
                {isCompactMode ? '標準表示' : '短く表示'}
              </Button>
              <Button
                onClick={() => setIsGroupedByPrimarySystem((current) => !current)}
                size="small"
                variant="secondary"
              >
                {isGroupedByPrimarySystem ? '通常並び' : '主システム別'}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.heroStats}>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>表示案件数</span>
            <strong className={styles.statValue}>{filteredProjects.length}</strong>
          </Panel>
          <Panel as="article" className={styles.statCard} variant="compact">
            <span className={styles.statLabel}>最大混雑度</span>
            <strong className={styles.statValue}>{peakBusy} Phase / Week</strong>
          </Panel>
        </div>
      </Panel>

      <Panel className={styles.section}>
        {emptyState ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>{emptyState.title}</h2>
            <p className={styles.emptyStateText}>{emptyState.description}</p>
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
                {(isGroupedByPrimarySystem
                  ? groupedProjects.flatMap((group) => [
                      { type: 'group' as const, label: group.label },
                      ...group.projects.map((project) => ({ type: 'project' as const, project })),
                    ])
                  : filteredProjects.map((project) => ({ type: 'project' as const, project }))
                ).map((row) => {
                  if (row.type === 'group') {
                    return (
                      <tr className={styles.groupRow} key={`group-${row.label}`}>
                        <td
                          className={`${styles.stickyColumn} ${styles.groupCell}`}
                          colSpan={globalWeekSlots.length + 1}
                          data-testid={`cross-project-group-${row.label}`}
                        >
                          主システム: {row.label}
                        </td>
                      </tr>
                    )
                  }

                  const project = row.project
                  const projectPhases = getProjectPhases(project.projectNumber)
                  const projectEvents = getProjectEvents(project.projectNumber)
                  const structureMembers = getProjectAssignments(project.projectNumber)
                    .map((assignment) => ({
                      assignment,
                      member: getMemberById(assignment.memberId),
                    }))
                    .filter(
                      (
                        item,
                      ): item is {
                        assignment: ProjectAssignment
                        member: Member
                      } => item.member !== undefined,
                    )
                    .sort((left, right) => {
                      const responsibilityCompare = left.assignment.responsibility.localeCompare(
                        right.assignment.responsibility,
                        'ja',
                      )

                      if (responsibilityCompare !== 0) {
                        return responsibilityCompare
                      }

                      return left.member.name.localeCompare(right.member.name, 'ja')
                    })
                  const pm = getProjectPm(project, members)
                  const hasLongNote = (project.note?.trim().length ?? 0) > 90
                  const isNoteExpanded = expandedNoteProjectIds.includes(project.projectNumber)

                  return (
                    <tr key={project.projectNumber}>
                      <td className={styles.stickyColumn}>
                        <div
                          className={
                            isCompactMode
                              ? `${styles.projectInfo} ${styles.projectInfoCompact}`
                              : styles.projectInfo
                          }
                          data-testid={`cross-project-project-info-${project.projectNumber}`}
                        >
                          <Link className={styles.projectLink} to={`/projects/${project.projectNumber}`}>
                            {project.name}
                          </Link>
                          <div className={styles.metaLine}>{project.projectNumber}</div>
                          {!isCompactMode ? (
                            <>
                              <div className={styles.metaLine}>PM: {pm?.name ?? '未設定'}</div>
                              <div className={styles.metaLine}>体制: {structureMembers.length}名</div>
                              <div className={styles.metaLine}>
                                報告事項: {project.hasReportItems ? 'あり' : 'なし'}
                              </div>
                              <div className={styles.metaLine}>
                                メモ: {project.note?.trim() ? 'あり' : 'なし'}
                              </div>
                            </>
                          ) : null}
                          <StatusBadge status={project.status} />
                          {isNoteVisible && project.note?.trim() ? (
                            <div className={styles.noteBlock}>
                              <p
                                className={
                                  isNoteExpanded
                                    ? `${styles.noteText} ${styles.noteTextExpanded}`
                                    : isCompactMode
                                      ? `${styles.noteText} ${styles.noteTextCompact}`
                                      : styles.noteText
                                }
                                data-testid={`cross-project-note-${project.projectNumber}`}
                              >
                                {project.note}
                              </p>
                              {hasLongNote ? (
                                <button
                                  className={styles.noteToggle}
                                  data-testid={`cross-project-note-toggle-${project.projectNumber}`}
                                  onClick={() => toggleExpandedNote(project.projectNumber)}
                                  type="button"
                                >
                                  {isNoteExpanded ? '折りたたむ' : '全文表示'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          {isStructureVisible ? (
                            <div className={styles.structureList}>
                              {structureMembers.map(({ assignment, member }) => (
                                <div
                                  key={assignment.id}
                                  className={styles.structureItem}
                                  data-testid={`cross-project-structure-${project.projectNumber}-${assignment.id}`}
                                >
                                  <span className={styles.structureRole}>{assignment.responsibility}</span>
                                  <span className={styles.structureMember}>
                                    {formatMemberShortLabel(member)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {globalWeekSlots.map((slot) => {
                        const activePhases = getActivePhasesForWeek(project, projectPhases, slot.startDate)
                        const activeEvents = projectEvents.filter((event) => event.week === slot.index)
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
