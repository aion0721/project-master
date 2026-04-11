import dagre from '@dagrejs/dagre'
import { useEffect, useMemo } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ManagedSystem, SystemRelation } from '../types/project'
import styles from './SystemLandscapeFlow.module.css'

interface LandscapeNodeData extends Record<string, unknown> {
  system: ManagedSystem
  projectCount: number
}

interface LandscapeEdgeData extends Record<string, unknown> {
  relation: SystemRelation
  sourceName: string
  targetName: string
  isActive: boolean
  onHover: (edgeId: string) => void
  onLeave: (edgeId: string) => void
}

type LandscapeNode = Node<LandscapeNodeData, 'landscapeNode'>
type LandscapeEdge = Edge<LandscapeEdgeData, 'landscapeEdge'>

const nodeWidth = 252
const nodeHeight = 112

function layoutNodes(nodes: LandscapeNode[], edges: LandscapeEdge[]) {
  const graph = new dagre.graphlib.Graph()

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'LR',
    align: 'UL',
    nodesep: 64,
    ranksep: 136,
    marginx: 28,
    marginy: 28,
  })

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target)
  })

  dagre.layout(graph)

  return nodes.map((node) => {
    const layout = graph.node(node.id)

    return {
      ...node,
      position: {
        x: layout.x - nodeWidth / 2,
        y: layout.y - nodeHeight / 2,
      },
    }
  })
}

function LandscapeNodeView({ data }: NodeProps<LandscapeNode>) {
  return (
    <div className={styles.nodeCard}>
      <Handle className={styles.handleLeft} position={Position.Left} type="target" />
      <Handle className={styles.handleRight} position={Position.Right} type="source" />
      <div className={styles.nodeGlow} />
      <div className={styles.nodeTitle}>{data.system.name}</div>
      <div className={styles.nodeSubtitle}>{data.system.category}</div>
      <div className={styles.nodeMeta}>関連案件 {data.projectCount} 件</div>
      {data.system.note ? <p className={styles.nodeNote}>{data.system.note}</p> : null}
    </div>
  )
}

function LandscapeEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<LandscapeEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const edgeClassName = [
    styles.edgePath,
    data?.isActive ? styles.edgePathActive : '',
  ]
    .filter(Boolean)
    .join(' ')

  const flowClassName = [
    styles.edgeFlow,
    data?.isActive ? styles.edgeFlowActive : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <BaseEdge className={edgeClassName} markerEnd={markerEnd} path={edgePath} />
      <BaseEdge className={flowClassName} path={edgePath} />
      <path
        aria-label={`${data?.sourceName ?? ''} から ${data?.targetName ?? ''} への接続`}
        className={styles.edgeHitArea}
        d={edgePath}
        data-testid={`diagram-edge-${id}`}
        onBlur={() => data?.onLeave(id)}
        onFocus={() => data?.onHover(id)}
        onMouseEnter={() => data?.onHover(id)}
        onMouseLeave={() => data?.onLeave(id)}
        tabIndex={0}
      />
      <EdgeLabelRenderer>
        <div
          className={styles.edgeLabelWrap}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 14}px)`,
          }}
        >
          <span
            className={[
              styles.edgeLabel,
              data?.isActive ? styles.edgeLabelActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            仕向け → 被仕向け
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = {
  landscapeNode: LandscapeNodeView,
} satisfies NodeTypes

const edgeTypes = {
  landscapeEdge: LandscapeEdgeView,
} satisfies EdgeTypes

interface SystemLandscapeFlowProps {
  activeEdgeId?: string | null
  onEdgeHover: (edgeId: string) => void
  onEdgeLeave: (edgeId: string) => void
  projectCountBySystemId: Map<string, number>
  systemRelations: SystemRelation[]
  systems: ManagedSystem[]
}

export function SystemLandscapeFlow({
  activeEdgeId,
  onEdgeHover,
  onEdgeLeave,
  projectCountBySystemId,
  systemRelations,
  systems,
}: SystemLandscapeFlowProps) {
  const systemById = useMemo(
    () => new Map(systems.map((system) => [system.id, system])),
    [systems],
  )

  const { initialNodes, initialEdges } = useMemo(() => {
    const nextNodes: LandscapeNode[] = systems.map((system) => ({
      id: system.id,
      type: 'landscapeNode',
      position: { x: 0, y: 0 },
      data: {
        system,
        projectCount: projectCountBySystemId.get(system.id) ?? 0,
      },
    }))

    const nextEdges: LandscapeEdge[] = systemRelations
      .filter(
        (relation) => systemById.has(relation.sourceSystemId) && systemById.has(relation.targetSystemId),
      )
      .map((relation) => ({
        id: relation.id,
        type: 'landscapeEdge',
        source: relation.sourceSystemId,
        target: relation.targetSystemId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: '#0f4c5c',
        },
        data: {
          relation,
          sourceName: systemById.get(relation.sourceSystemId)?.name ?? relation.sourceSystemId,
          targetName: systemById.get(relation.targetSystemId)?.name ?? relation.targetSystemId,
          isActive: relation.id === activeEdgeId,
          onHover: onEdgeHover,
          onLeave: onEdgeLeave,
        },
      }))

    return {
      initialNodes: layoutNodes(nextNodes, nextEdges),
      initialEdges: nextEdges,
    }
  }, [activeEdgeId, onEdgeHover, onEdgeLeave, projectCountBySystemId, systemById, systemRelations, systems])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  if (nodes.length === 0 || edges.length === 0) {
    return (
      <p className={styles.emptyText}>
        関連システムを登録すると、ここに全体の関連図を表示します。
      </p>
    )
  }

  return (
    <div className={styles.flowWrap} data-testid="system-landscape-flow">
      <div aria-label="システム関連図" className={styles.flowA11y} role="img" />
      <ReactFlow
        defaultEdgeOptions={{ type: 'landscapeEdge' }}
        edges={edges}
        edgeTypes={edgeTypes}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        maxZoom={1.3}
        minZoom={0.3}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#94a3b8" gap={52} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
