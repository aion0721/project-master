import { useMemo } from 'react'
import { EntityIcon } from '../../components/EntityIcon'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import styles from './SystemManagementPage.module.css'

export function SystemManagementPage() {
  const { systems, members, projects, isLoading, error } = useProjectData()

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  )

  const sortedSystems = useMemo(
    () => [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [systems],
  )

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

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム一覧を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム情報を取得しています。</p>
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
      <Panel variant="hero">
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="system" />
          <div className={pageStyles.heroHeadingBody}>
            <p className={pageStyles.eyebrow}>System Directory</p>
            <h1 className={pageStyles.title}>システム一覧</h1>
            <p className={pageStyles.description}>
              利用中のシステムを一覧で確認します。詳細は個別ページで確認し、関連リンクや補足情報もそこで管理します。
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>登録済みシステム</h2>
            <p className={pageStyles.sectionDescription}>
              オーナーと対象プロジェクトを確認できます。詳細ボタンから個別ページへ移動します。
            </p>
          </div>
          <Button to="/systems/new" variant="secondary">
            システムを追加
          </Button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>システムID</th>
                <th>名称</th>
                <th>カテゴリ</th>
                <th>オーナー</th>
                <th>対象システム</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedSystems.map((system) => {
                const relatedProjectNames = projectNamesBySystemId.get(system.id) ?? []

                return (
                  <tr data-testid={`system-row-${system.id}`} key={system.id}>
                    <td className={styles.idCell}>{system.id}</td>
                    <td>{system.name}</td>
                    <td>{system.category}</td>
                    <td>{system.ownerMemberId ? memberNameById.get(system.ownerMemberId) ?? '未設定' : '未設定'}</td>
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
                            <span className={styles.noteCell}>対象案件なし</span>
                          )}
                        </div>
                        <Button
                          size="small"
                          to={`/cross-project?systemId=${system.id}`}
                          variant="secondary"
                        >
                          横断ビュー
                        </Button>
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
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
