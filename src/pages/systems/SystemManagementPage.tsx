import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterVisibilityToggleButton } from '../../components/FilterVisibilityToggleButton'
import { ListPageScaffold } from '../../components/ListPageScaffold'
import { PageStatePanel } from '../../components/PageStatePanel'
import { Button } from '../../components/ui/Button'
import { useProjectData } from '../../store/useProjectData'
import formStyles from '../../styles/form.module.css'
import styles from './SystemManagementPage.module.css'

const systemSkeletonRows = Array.from({ length: 6 }, (_, index) => index)

function SystemManagementSkeleton() {
  return (
    <ListPageScaffold
      contentProps={{
        actions: (
          <div className={styles.toolbarActions}>
            <span className={`${styles.skeletonBox} ${styles.skeletonButton}`} />
            <span className={`${styles.skeletonBox} ${styles.skeletonButtonWide}`} />
          </div>
        ),
        description: 'システム情報を準備しています。',
        title: '一覧を読み込み中です',
      }}
      filterProps={{
        className: styles.controls,
        summary: (
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>表示条件</span>
            <span className={`${styles.skeletonBox} ${styles.skeletonSummary}`} />
          </div>
        ),
        topRow: (
          <div className={styles.headerActions}>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>システムID</span>
              <span className={`${styles.skeletonBox} ${styles.skeletonField}`} />
            </label>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>所管部署</span>
              <span className={`${styles.skeletonBox} ${styles.skeletonField}`} />
            </label>
          </div>
        ),
        visible: true,
      }}
      hero={{
        action: <span className={`${styles.skeletonBox} ${styles.skeletonHeroAction}`} />,
        className: styles.hero,
        collapsible: true,
        description:
          '利用中のシステムを一覧で整理します。カテゴリ、責任者、関連案件、メモを並べて比較しながら確認できます。',
        eyebrow: 'System Directory',
        iconKind: 'system',
        storageKey: 'project-master:hero-collapsed:systems',
        stats: [
          { label: '登録システム', value: <span className={`${styles.skeletonBox} ${styles.skeletonHeroStat}`} /> },
          { label: '関連案件あり', value: <span className={`${styles.skeletonBox} ${styles.skeletonHeroStat}`} /> },
          { label: '責任者設定済み', value: <span className={`${styles.skeletonBox} ${styles.skeletonHeroStat}`} /> },
        ],
        title: 'システム一覧を読み込み中',
      }}
    >
      <div
        aria-hidden="true"
        className={styles.tableWrap}
        data-testid="system-management-skeleton"
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>システムID</th>
              <th>名称</th>
              <th>カテゴリ</th>
              <th>オーナー</th>
              <th>所管部署</th>
              <th>対象案件</th>
              <th>メモ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {systemSkeletonRows.map((rowIndex) => (
              <tr className={styles.systemRow} key={`skeleton-${rowIndex}`}>
                <td><span className={`${styles.skeletonBox} ${styles.skeletonTextShort}`} /></td>
                <td><span className={`${styles.skeletonBox} ${styles.skeletonTextMedium}`} /></td>
                <td><span className={`${styles.skeletonBox} ${styles.skeletonTextShort}`} /></td>
                <td><span className={`${styles.skeletonBox} ${styles.skeletonTextMedium}`} /></td>
                <td>
                  <div className={styles.departmentList}>
                    <span className={`${styles.skeletonBox} ${styles.skeletonChip}`} />
                    <span className={`${styles.skeletonBox} ${styles.skeletonChip}`} />
                  </div>
                </td>
                <td>
                  <div className={styles.projectSummary}>
                    <span className={`${styles.skeletonBox} ${styles.skeletonTextShort}`} />
                    <div className={styles.projectList}>
                      <span className={`${styles.skeletonBox} ${styles.skeletonChipWide}`} />
                    </div>
                  </div>
                </td>
                <td><span className={`${styles.skeletonBox} ${styles.skeletonTextLong}`} /></td>
                <td>
                  <div className={styles.rowActions}>
                    <span className={`${styles.skeletonBox} ${styles.skeletonAction}`} />
                    <span className={`${styles.skeletonBox} ${styles.skeletonAction}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListPageScaffold>
  )
}

export function SystemManagementPage() {
  const { systems, members, projects, isLoading, error } = useProjectData()
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [filterSystemId, setFilterSystemId] = useState('')
  const [filterDepartmentName, setFilterDepartmentName] = useState('')
  const [isProjectListVisible, setIsProjectListVisible] = useState(false)

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  )

  const sortedSystems = useMemo(
    () => [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [systems],
  )

  const departmentOptions = useMemo(
    () =>
      [...new Set(systems.flatMap((system) => system.departmentNames ?? []))].sort((left, right) =>
        left.localeCompare(right, 'ja'),
      ),
    [systems],
  )

  const filteredSystems = useMemo(() => {
    const normalizedSystemId = filterSystemId.trim().toLowerCase()

    return sortedSystems.filter((system) => {
      const matchesSystemId = !normalizedSystemId || system.id.toLowerCase().includes(normalizedSystemId)
      const matchesDepartment =
        !filterDepartmentName ||
        (filterDepartmentName === '__unassigned__'
          ? (system.departmentNames ?? []).length === 0
          : (system.departmentNames ?? []).includes(filterDepartmentName))

      return matchesSystemId && matchesDepartment
    })
  }, [filterDepartmentName, filterSystemId, sortedSystems])

  const filterSummaryText = useMemo(() => {
    const tokens = []

    if (filterSystemId.trim()) {
      tokens.push(`ID: "${filterSystemId.trim()}"`)
    }

    if (filterDepartmentName) {
      tokens.push(
        filterDepartmentName === '__unassigned__' ? '所管部署: 未設定' : `所管部署: ${filterDepartmentName}`,
      )
    }

    return tokens.length > 0 ? `${filteredSystems.length} 件表示 / ${tokens.join(' / ')}` : `${filteredSystems.length} 件表示`
  }, [filterDepartmentName, filterSystemId, filteredSystems.length])

  const relatedProjectsBySystemId = useMemo(() => {
    const map = new Map<string, Array<{ projectNumber: string; name: string }>>()

    projects.forEach((project) => {
      const systemId = project.relatedSystemIds?.[0]

      if (!systemId) {
        return
      }

      const current = map.get(systemId) ?? []
      current.push({
        projectNumber: project.projectNumber,
        name: project.name,
      })
      map.set(systemId, current)
    })

    return map
  }, [projects])

  const systemSummary = useMemo(
    () => ({
      total: systems.length,
      connectedProjects: projects.filter((project) => project.relatedSystemIds?.[0]).length,
      owners: systems.filter((system) => Boolean(system.ownerMemberId)).length,
    }),
    [projects, systems],
  )

  if (isLoading) {
    return <SystemManagementSkeleton />
  }

  if (error) {
    return (
      <PageStatePanel description={error} title="システム一覧を表示できませんでした" />
    )
  }

  return (
    <ListPageScaffold
      contentProps={{
        actions: (
          <div className={styles.toolbarActions}>
            <FilterVisibilityToggleButton
              isVisible={isFilterVisible}
              onToggle={() => setIsFilterVisible((current) => !current)}
            />
            <Button
              aria-pressed={isProjectListVisible}
              className={
                isProjectListVisible
                  ? `${styles.toggleStateButton} ${styles.toggleStateButtonActive}`
                  : styles.toggleStateButton
              }
              onClick={() => setIsProjectListVisible((current) => !current)}
              size="small"
              variant="secondary"
            >
              {`案件の表示: ${isProjectListVisible ? 'ON' : 'OFF'}`}
            </Button>
          </div>
        ),
        description: 'オーナーと関連プロジェクトを比較できます。操作列から横断ビューにも移動できます。',
        emptyState:
          filteredSystems.length === 0
            ? {
                title: '条件に一致するシステムはありません',
                description:
                  'システムIDや所管部署の絞り込み条件を見直して、表示されるシステムを確認してください。',
              }
            : null,
        title: '管理対象システム',
      }}
      filterProps={{
        className: styles.controls,
        summary: (
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>表示条件</span>
            <span className={styles.filterSummaryValue}>{filterSummaryText}</span>
          </div>
        ),
        topRow: (
          <div className={styles.headerActions}>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>システムID</span>
              <input
                aria-label="システムIDで絞り込み"
                className={formStyles.control}
                onChange={(event) => setFilterSystemId(event.target.value)}
                placeholder="例: sys-accounting"
                type="search"
                value={filterSystemId}
              />
            </label>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>所管部署</span>
              <select
                aria-label="所管部署で絞り込み"
                className={formStyles.control}
                onChange={(event) => setFilterDepartmentName(event.target.value)}
                value={filterDepartmentName}
              >
                <option value="">すべて</option>
                <option value="__unassigned__">未設定</option>
                {departmentOptions.map((departmentName) => (
                  <option key={departmentName} value={departmentName}>
                    {departmentName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ),
        visible: isFilterVisible,
      }}
      hero={{
        action: <Button to="/systems/new">新規システム</Button>,
        className: styles.hero,
        collapsible: true,
        description:
          '利用中のシステムを一覧で整理します。カテゴリ、責任者、関連案件、メモを並べて比較しながら確認できます。',
        eyebrow: 'System Directory',
        iconKind: 'system',
        storageKey: 'project-master:hero-collapsed:systems',
        stats: [
          { label: '登録システム', value: systemSummary.total },
          { label: '関連案件あり', value: systemSummary.connectedProjects },
          { label: '責任者設定済み', value: systemSummary.owners },
        ],
        title: 'システム一覧',
      }}
    >
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>システムID</th>
              <th>名称</th>
              <th>カテゴリ</th>
              <th>オーナー</th>
              <th>所管部署</th>
              <th>対象案件</th>
              <th>メモ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredSystems.map((system) => {
              const relatedProjects = relatedProjectsBySystemId.get(system.id) ?? []

              return (
                <tr className={styles.systemRow} data-testid={`system-row-${system.id}`} key={system.id}>
                  <td className={styles.idCell}>{system.id}</td>
                  <td>{system.name}</td>
                  <td>{system.category}</td>
                  <td>
                    {system.ownerMemberId
                      ? memberNameById.get(system.ownerMemberId) ?? '未設定'
                      : '未設定'}
                  </td>
                  <td>
                    <div className={styles.departmentList}>
                      {(system.departmentNames ?? []).length > 0 ? (
                        (system.departmentNames ?? []).map((departmentName) => (
                          <span className={styles.departmentChip} key={`${system.id}-${departmentName}`}>
                            {departmentName}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noteCell}>未設定</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.projectSummary}>
                      <span className={styles.projectCount}>{relatedProjects.length} 件</span>
                      <div className={styles.projectList}>
                        {relatedProjects.length > 0 && isProjectListVisible
                          ? relatedProjects.map((project) => (
                              <Link
                                className={styles.projectChipLink}
                                key={`${system.id}-${project.projectNumber}`}
                                to={`/projects/${project.projectNumber}`}
                              >
                                {project.projectNumber} / {project.name}
                              </Link>
                            ))
                          : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.noteCell}>{system.note ?? 'なし'}</div>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button size="small" to={`/systems/${system.id}`} variant="secondary">
                        詳細
                      </Button>
                      <Button
                        size="small"
                        to={`/cross-project?systemId=${system.id}`}
                        variant="secondary"
                      >
                        横断ビュー
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </ListPageScaffold>
  )
}
