import { useMemo, useState } from 'react'
import { SystemFocusFlow } from '../../components/SystemFocusFlow'
import { SystemLandscapeFlow } from '../../components/SystemLandscapeFlow'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import { formatSystemOptionLabel } from './systemFormUtils'
import styles from './SystemLandscapePage.module.css'

interface HoveredEdgeTooltip {
  id: string
  sourceName: string
  targetName: string
  protocol: string | null
  note: string | null
}

export function SystemLandscapePage() {
  const { systems, systemRelations, projects, isLoading, error } = useProjectData()
  const [selectedSystemId, setSelectedSystemId] = useState<string>('')
  const [hoveredEdge, setHoveredEdge] = useState<HoveredEdgeTooltip | null>(null)

  const sortedSystems = useMemo(
    () => [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [systems],
  )

  const projectCountBySystemId = useMemo(() => {
    const counts = new Map<string, number>()

    projects.forEach((project) => {
      const systemId = project.relatedSystemIds?.[0]

      if (!systemId) {
        return
      }

      counts.set(systemId, (counts.get(systemId) ?? 0) + 1)
    })

    return counts
  }, [projects])

  const systemById = useMemo(
    () => new Map(sortedSystems.map((system) => [system.id, system])),
    [sortedSystems],
  )

  const selectedSystem = useMemo(() => {
    const defaultSystemId = selectedSystemId || sortedSystems[0]?.id || ''
    return systemById.get(defaultSystemId) ?? null
  }, [selectedSystemId, sortedSystems, systemById])

  const focusedView = useMemo(() => {
    if (!selectedSystem) {
      return null
    }

    const upstreamRelations = systemRelations.filter((relation) => relation.targetSystemId === selectedSystem.id)
    const downstreamRelations = systemRelations.filter((relation) => relation.sourceSystemId === selectedSystem.id)

    return {
      upstream: upstreamRelations
        .map((relation) => ({
          relation,
          system: systemById.get(relation.sourceSystemId),
        }))
        .filter(
          (
            item,
          ): item is {
            relation: (typeof upstreamRelations)[number]
            system: NonNullable<typeof selectedSystem>
          } => Boolean(item.system),
        ),
      downstream: downstreamRelations
        .map((relation) => ({
          relation,
          system: systemById.get(relation.targetSystemId),
        }))
        .filter(
          (
            item,
          ): item is {
            relation: (typeof downstreamRelations)[number]
            system: NonNullable<typeof selectedSystem>
          } => Boolean(item.system),
        ),
    }
  }, [selectedSystem, systemById, systemRelations])

  const summary = useMemo(
    () => ({
      systems: sortedSystems.length,
      relations: systemRelations.length,
      projects: projects.filter((project) => project.relatedSystemIds?.[0]).length,
    }),
    [projects, sortedSystems.length, systemRelations.length],
  )

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>関連図を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム関連を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>関連図を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  function handleEdgeHover(edgeId: string) {
    const relation = systemRelations.find((item) => item.id === edgeId)

    if (!relation) {
      return
    }

    setHoveredEdge({
      id: relation.id,
      sourceName: systemById.get(relation.sourceSystemId)?.name ?? relation.sourceSystemId,
      targetName: systemById.get(relation.targetSystemId)?.name ?? relation.targetSystemId,
      protocol: relation.protocol ?? null,
      note: relation.note ?? null,
    })
  }

  function handleEdgeLeave(edgeId: string) {
    setHoveredEdge((current) => (current?.id === edgeId ? null : current))
  }

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/systems">システム一覧</Button>}
        className={styles.hero}
        collapsible
        description="システム同士のつながりを俯瞰で表示します。上流からの受け取りと下流への連携を、選択ビューと全体図の両方で確認できます。"
        eyebrow="System Diagram"
        iconKind="system"
        storageKey="project-master:hero-collapsed:system-landscape"
        stats={[
          { label: '登録システム', value: summary.systems },
          { label: '関連線', value: summary.relations },
          { label: '関連案件あり', value: summary.projects },
        ]}
        title="システム関連図"
      />

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>システム別フォーカスビュー</h2>
            <p className={pageStyles.sectionDescription}>
              対象システムを1つ選ぶと、上流に受けるシステムと下流へ渡すシステムを並べて表示します。
            </p>
          </div>
        </div>

        <label className={styles.selectorField}>
          <span className={styles.selectorLabel}>表示対象システム</span>
          <select
            className={styles.selectorInput}
            data-testid="focused-system-select"
            onChange={(event) => setSelectedSystemId(event.target.value)}
            value={selectedSystem?.id ?? ''}
          >
            {sortedSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {formatSystemOptionLabel(system)}
              </option>
            ))}
          </select>
        </label>

        {selectedSystem && focusedView ? (
          <div className={styles.focusSection}>
            <div className={styles.focusHeadingRow}>
              <section className={styles.focusColumn} data-testid="focused-system-upstream">
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>上流</span>
                  <h3 className={styles.focusTitle}>データをもらう元</h3>
                </header>
                {focusedView.upstream.length > 0 ? (
                  <div className={styles.focusNameList}>
                    {focusedView.upstream.map(({ relation, system }) => (
                      <span className={styles.focusNameChip} key={relation.id}>
                        {system.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.focusListText}>
                    このシステムにデータを送る上流システムはありません。
                  </div>
                )}
              </section>

              <section className={`${styles.focusColumn} ${styles.focusColumnPrimary}`}>
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>中心</span>
                  <h3 className={styles.focusTitle}>選択中のシステム</h3>
                </header>
                <div className={styles.focusListText} data-testid="focused-system-center">
                  {selectedSystem.name}
                </div>
              </section>

              <section className={styles.focusColumn} data-testid="focused-system-downstream">
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>下流</span>
                  <h3 className={styles.focusTitle}>データを渡す先</h3>
                </header>
                {focusedView.downstream.length > 0 ? (
                  <div className={styles.focusNameList}>
                    {focusedView.downstream.map(({ relation, system }) => (
                      <span className={styles.focusNameChip} key={relation.id}>
                        {system.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.focusListText}>
                    このシステムからデータを渡す下流システムはありません。
                  </div>
                )}
              </section>
            </div>

            <div
              aria-label={`${selectedSystem.name} の上流接続メモ`}
              className={`${styles.focusConnectorAssist} ${focusedView.upstream.length > 0 ? '' : styles.focusConnectorIdle}`}
              data-testid="focused-connector-upstream"
              tabIndex={focusedView.upstream.length > 0 ? 0 : -1}
            >
              {focusedView.upstream.length > 0 ? (
                <div className={styles.focusConnectorTooltip}>
                  <strong className={styles.focusConnectorTooltipTitle}>
                    上流から {selectedSystem.name} への連携
                  </strong>
                  <ul className={styles.focusConnectorTooltipList}>
                    {focusedView.upstream.map(({ relation, system }) => (
                      <li className={styles.focusConnectorTooltipItem} key={relation.id}>
                        <span className={styles.focusConnectorTooltipItemName}>{system.name}</span>
                        <span className={styles.focusConnectorTooltipItemText}>{relation.note ?? 'メモは未設定です。'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div
              aria-label={`${selectedSystem.name} の下流接続メモ`}
              className={`${styles.focusConnectorAssist} ${focusedView.downstream.length > 0 ? '' : styles.focusConnectorIdle}`}
              data-testid="focused-connector-downstream"
              tabIndex={focusedView.downstream.length > 0 ? 0 : -1}
            />

            <SystemFocusFlow
              downstream={focusedView.downstream}
              projectCountBySystemId={projectCountBySystemId}
              selectedSystem={selectedSystem}
              upstream={focusedView.upstream}
            />
          </div>
        ) : (
          <p className={styles.emptyText}>表示できるシステムがありません。</p>
        )}
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>接続ネットワーク</h2>
            <p className={pageStyles.sectionDescription}>
              接続元から接続先へ向かう線で表現します。ノードには関連案件数を表示しています。
            </p>
          </div>
        </div>

        {sortedSystems.length > 0 && systemRelations.length > 0 ? (
          <div className={styles.diagramWrap}>
            <SystemLandscapeFlow
              activeEdgeId={hoveredEdge?.id ?? null}
              onEdgeHover={handleEdgeHover}
              onEdgeLeave={handleEdgeLeave}
              projectCountBySystemId={projectCountBySystemId}
              systemRelations={systemRelations}
              systems={sortedSystems}
            />
            <div className={styles.edgeAssistList}>
              {systemRelations.map((relation) => {
                const sourceName = systemById.get(relation.sourceSystemId)?.name ?? relation.sourceSystemId
                const targetName = systemById.get(relation.targetSystemId)?.name ?? relation.targetSystemId

                return (
                  <button
                    aria-label={`${sourceName} から ${targetName} への接続`}
                    className={styles.edgeAssistButton}
                    data-testid={`diagram-edge-${relation.id}`}
                    key={relation.id}
                    onBlur={() => handleEdgeLeave(relation.id)}
                    onFocus={() => handleEdgeHover(relation.id)}
                    onMouseEnter={() => handleEdgeHover(relation.id)}
                    onMouseLeave={() => handleEdgeLeave(relation.id)}
                    type="button"
                  >
                    仕向け → 被仕向け
                  </button>
                )
              })}
            </div>
            {hoveredEdge ? (
              <div className={styles.edgeTooltip} role="tooltip">
                <strong className={styles.edgeTooltipTitle}>
                  {hoveredEdge.sourceName} → {hoveredEdge.targetName}
                </strong>
                <p className={styles.edgeTooltipText}>プロトコル: {hoveredEdge.protocol?.trim() || '未設定'}</p>
                <p className={styles.edgeTooltipText}>{hoveredEdge.note ?? 'メモは未設定です。'}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className={styles.emptyText}>関連システムを登録すると、ここに全体の関連図を表示します。</p>
        )}
      </Panel>
    </div>
  )
}
