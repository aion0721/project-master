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
  const [filterSystemId, setFilterSystemId] = useState('')

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  )

  const sortedSystems = useMemo(
    () => [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [systems],
  )

  const filteredSystems = useMemo(() => {
    const normalizedSystemId = filterSystemId.trim().toLowerCase()

    return sortedSystems.filter((system) => {
      if (!normalizedSystemId) {
        return true
      }

      return system.id.toLowerCase().includes(normalizedSystemId)
    })
  }, [filterSystemId, sortedSystems])

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

  const filterSummaryText = filterSystemId.trim()
    ? `${filteredSystems.length} 件表示 / "${filterSystemId.trim()}"`
    : `${filteredSystems.length} 件表示`

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/systems/new">新規システム</Button>}
        className={styles.hero}
        description="利用中のシステムを一覧で整理します。カテゴリ、責任者、関連案件、メモを並べて比較しながら確認できます。"
        eyebrow="System Directory"
        iconKind="system"
        stats={[
          { label: '登録システム', value: systemSummary.total },
          { label: '関連案件あり', value: systemSummary.connectedProjects },
          { label: '責任者設定済み', value: systemSummary.owners },
        ]}
        title="システム一覧"
      />

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
            <Button to="/systems/new" variant="secondary">
              システムを追加
            </Button>
          </div>
        }
        summary={
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>表示条件</span>
            <span className={styles.filterSummaryValue}>{filterSummaryText}</span>
          </div>
        }
      />

      <ListPageContentSection
        actions={
          <Button to="/systems/new" variant="secondary">
            システムを追加
          </Button>
        }
        description="オーナーと関連プロジェクトを比較できます。操作列から横断ビューにも移動できます。"
        emptyState={
          filteredSystems.length === 0
            ? {
                title: '条件に一致するシステムはありません',
                description:
                  'システムIDの絞り込み条件を見直して、表示されるシステムを確認してください。',
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
