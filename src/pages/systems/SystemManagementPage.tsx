import { useMemo, useState } from 'react'
import { ListPageContentSection } from '../../components/ListPageContentSection'
import { ListPageFilterSection } from '../../components/ListPageFilterSection'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import formStyles from '../../styles/form.module.css'
import pageStyles from '../../styles/page.module.css'
import styles from './SystemManagementPage.module.css'

export function SystemManagementPage() {
  const { systems, members, projects, isLoading, error } = useProjectData()
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [filterSystemId, setFilterSystemId] = useState('')
  const [filterDepartmentName, setFilterDepartmentName] = useState('')

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

  const projectNamesBySystemId = useMemo(() => {
    const map = new Map<string, string[]>()

    projects.forEach((project) => {
      const systemId = project.relatedSystemIds?.[0]

      if (!systemId) {
        return
      }

      const current = map.get(systemId) ?? []
      current.push(project.name)
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
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム一覧を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム情報を準備しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム一覧を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/systems/new">新規システム</Button>}
        className={styles.hero}
        collapsible
        description="利用中のシステムを一覧で整理します。カテゴリ、責任者、関連案件、メモを並べて比較しながら確認できます。"
        eyebrow="System Directory"
        iconKind="system"
        storageKey="project-master:hero-collapsed:systems"
        stats={[
          { label: '登録システム', value: systemSummary.total },
          { label: '関連案件あり', value: systemSummary.connectedProjects },
          { label: '責任者設定済み', value: systemSummary.owners },
        ]}
        title="システム一覧"
      />

      {isFilterVisible ? (
        <ListPageFilterSection
          className={styles.controls}
          topRow={
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
          }
          summary={
            <div className={styles.filterSummary}>
              <span className={styles.filterSummaryLabel}>表示条件</span>
              <span className={styles.filterSummaryValue}>{filterSummaryText}</span>
            </div>
          }
        />
      ) : null}

      <ListPageContentSection
        actions={
          <Button
            aria-expanded={isFilterVisible}
            onClick={() => setIsFilterVisible((current) => !current)}
            size="small"
            variant="secondary"
          >
            {isFilterVisible ? '絞り込みを非表示' : '絞り込みを表示'}
          </Button>
        }
        description="オーナーと関連プロジェクトを比較できます。操作列から横断ビューにも移動できます。"
        emptyState={
          filteredSystems.length === 0
            ? {
              title: '条件に一致するシステムはありません',
              description:
                  'システムIDや所管部署の絞り込み条件を見直して、表示されるシステムを確認してください。',
              }
            : null
        }
        title="管理対象システム"
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
                <th>対象システム</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSystems.map((system) => {
                const relatedProjectNames = projectNamesBySystemId.get(system.id) ?? []

                return (
                  <tr data-testid={`system-row-${system.id}`} key={system.id}>
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
                        <span className={styles.projectCount}>{relatedProjectNames.length} 件</span>
                        <div className={styles.projectList}>
                          {relatedProjectNames.length > 0 ? (
                            relatedProjectNames.map((projectName) => (
                              <span className={styles.projectChip} key={`${system.id}-${projectName}`}>
                                {projectName}
                              </span>
                            ))
                          ) : (
                            <span className={styles.noteCell}>関連案件なし</span>
                          )}
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
      </ListPageContentSection>
    </div>
  )
}
