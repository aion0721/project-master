import { useMemo } from 'react'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import pageStyles from '../styles/page.module.css'
import styles from './SystemLandscapePage.module.css'

const nodeWidth = 220
const nodeHeight = 92
const columnGap = 120
const rowGap = 68
const canvasPadding = 40

interface PositionedNode {
  id: string
  name: string
  category: string
  x: number
  y: number
  projectCount: number
}

function buildLevels(systemIds: string[], edges: Array<{ sourceSystemId: string; targetSystemId: string }>) {
  const outgoing = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  const level = new Map<string, number>()

  systemIds.forEach((id) => {
    outgoing.set(id, [])
    indegree.set(id, 0)
    level.set(id, 0)
  })

  edges.forEach((edge) => {
    outgoing.set(edge.sourceSystemId, [...(outgoing.get(edge.sourceSystemId) ?? []), edge.targetSystemId])
    indegree.set(edge.targetSystemId, (indegree.get(edge.targetSystemId) ?? 0) + 1)
  })

  const queue = systemIds.filter((id) => (indegree.get(id) ?? 0) === 0).sort()
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    visited.add(current)

    for (const next of outgoing.get(current) ?? []) {
      level.set(next, Math.max(level.get(next) ?? 0, (level.get(current) ?? 0) + 1))
      indegree.set(next, (indegree.get(next) ?? 1) - 1)

      if ((indegree.get(next) ?? 0) === 0) {
        queue.push(next)
      }
    }
  }

  const remaining = systemIds.filter((id) => !visited.has(id)).sort()
  remaining.forEach((id) => {
    level.set(id, Math.max(level.get(id) ?? 0, 0))
  })

  return level
}

export function SystemLandscapePage() {
  const { systems, systemRelations, projects, isLoading, error } = useProjectData()

  const projectCountBySystemId = useMemo(() => {
    const counts = new Map<string, number>()

    projects.forEach((project) => {
      for (const systemId of project.relatedSystemIds ?? []) {
        counts.set(systemId, (counts.get(systemId) ?? 0) + 1)
      }
    })

    return counts
  }, [projects])

  const diagram = useMemo(() => {
    if (systems.length === 0) {
      return null
    }

    const sortedSystems = [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja'))
    const levels = buildLevels(
      sortedSystems.map((system) => system.id),
      systemRelations,
    )
    const columns = new Map<number, typeof sortedSystems>()

    sortedSystems.forEach((system) => {
      const columnIndex = levels.get(system.id) ?? 0
      const columnSystems = columns.get(columnIndex) ?? []
      columnSystems.push(system)
      columns.set(columnIndex, columnSystems)
    })

    const positionedNodes = new Map<string, PositionedNode>()
    const maxColumn = Math.max(...columns.keys(), 0)
    let maxRows = 0

    for (const [columnIndex, columnSystems] of [...columns.entries()].sort((a, b) => a[0] - b[0])) {
      maxRows = Math.max(maxRows, columnSystems.length)

      columnSystems.forEach((system, rowIndex) => {
        positionedNodes.set(system.id, {
          id: system.id,
          name: system.name,
          category: system.category,
          x: canvasPadding + columnIndex * (nodeWidth + columnGap),
          y: canvasPadding + rowIndex * (nodeHeight + rowGap),
          projectCount: projectCountBySystemId.get(system.id) ?? 0,
        })
      })
    }

    return {
      nodes: [...positionedNodes.values()],
      edges: systemRelations
        .map((relation) => ({
          relation,
          source: positionedNodes.get(relation.sourceSystemId),
          target: positionedNodes.get(relation.targetSystemId),
        }))
        .filter(
          (
            item,
          ): item is {
            relation: (typeof systemRelations)[number]
            source: PositionedNode
            target: PositionedNode
          } => Boolean(item.source && item.target),
        ),
      width: canvasPadding * 2 + (maxColumn + 1) * nodeWidth + maxColumn * columnGap,
      height: canvasPadding * 2 + Math.max(maxRows, 1) * nodeHeight + Math.max(maxRows - 1, 0) * rowGap,
    }
  }, [projectCountBySystemId, systemRelations, systems])

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

  return (
    <div className={pageStyles.page}>
      <Panel variant="hero">
        <p className={pageStyles.eyebrow}>System Diagram</p>
        <h1 className={pageStyles.title}>システム関連図</h1>
        <p className={pageStyles.description}>
          システム間のつながりを矢印で表示します。左が仕向け、右が被仕向けです。
        </p>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>接続マップ</h2>
            <p className={pageStyles.sectionDescription}>
              接続元から接続先へ向かう流れを確認できます。各ノードには関連案件数も表示しています。
            </p>
          </div>
        </div>

        {diagram && diagram.edges.length > 0 ? (
          <div className={styles.diagramWrap}>
            <svg
              aria-label="システム関連図"
              className={styles.diagram}
              height={diagram.height}
              role="img"
              viewBox={`0 0 ${diagram.width} ${diagram.height}`}
              width={diagram.width}
            >
              <defs>
                <marker
                  id="system-arrow"
                  markerHeight="10"
                  markerUnits="strokeWidth"
                  markerWidth="10"
                  orient="auto"
                  refX="9"
                  refY="3"
                >
                  <path d="M0,0 L10,3 L0,6 z" fill="#0f4c5c" />
                </marker>
              </defs>

              {diagram.edges.map(({ relation, source, target }) => {
                const startX = source.x + nodeWidth
                const startY = source.y + nodeHeight / 2
                const endX = target.x
                const endY = target.y + nodeHeight / 2
                const controlOffset = Math.max((endX - startX) / 2, 60)
                const labelX = (startX + endX) / 2
                const labelY = (startY + endY) / 2 - 10

                return (
                  <g key={relation.id}>
                    <path
                      className={styles.edgePath}
                      d={`M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`}
                      markerEnd="url(#system-arrow)"
                    />
                    <text className={styles.edgeLabel} x={labelX} y={labelY}>
                      仕向け → 被仕向け
                    </text>
                  </g>
                )
              })}

              {diagram.nodes.map((node) => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect className={styles.nodeCard} height={nodeHeight} rx="18" width={nodeWidth} />
                  <text className={styles.nodeTitle} x="18" y="28">
                    {node.name}
                  </text>
                  <text className={styles.nodeSubtitle} x="18" y="50">
                    {node.category}
                  </text>
                  <text className={styles.nodeMeta} x="18" y="72">
                    関連案件 {node.projectCount} 件
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <p className={styles.emptyText}>関連システムを登録すると、ここに矢印付きの図を表示します。</p>
        )}
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>凡例</h2>
            <p className={pageStyles.sectionDescription}>
              矢印は左から右へ流れます。接続元を仕向け、接続先を被仕向けとして扱います。
            </p>
          </div>
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendChip}>仕向け</span>
          <span className={styles.legendArrow}>→</span>
          <span className={styles.legendChip}>被仕向け</span>
        </div>
      </Panel>
    </div>
  )
}
