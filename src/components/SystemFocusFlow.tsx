import { useMemo } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ManagedSystem, SystemRelation } from '../types/project'
import styles from './SystemFocusFlow.module.css'

interface FocusNodeData extends Record<string, unknown> {
  system: ManagedSystem
  projectCount: number
  role: 'upstream' | 'center' | 'downstream'
  protocol?: string | null
}

type FocusNode = Node<FocusNodeData, 'focusNode'>

interface FocusFlowItem {
  relation: SystemRelation
  system: ManagedSystem
}

function FocusNodeView({ data }: NodeProps<FocusNode>) {
  const cardClassName = [
    styles.nodeCard,
    data.role === 'center' ? styles.nodeCardCenter : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClassName}>
      <Handle className={styles.handleLeft} position={Position.Left} type="target" />
      <Handle className={styles.handleRight} position={Position.Right} type="source" />
      <div className={styles.nodeRole}>
        {data.role === 'upstream' ? '上流' : data.role === 'downstream' ? '下流' : '中心'}
      </div>
      <div className={styles.nodeTitle}>{data.system.name}</div>
      <div className={styles.nodeMeta}>{data.system.category}</div>
      <div className={styles.nodeMeta}>関連案件 {data.projectCount} 件</div>
      {data.protocol ? <div className={styles.nodeProtocol}>プロトコル {data.protocol}</div> : null}
      {data.system.note ? <p className={styles.nodeNote}>{data.system.note}</p> : null}
    </div>
  )
}

const nodeTypes = {
  focusNode: FocusNodeView,
} satisfies NodeTypes

function FocusEdgeView({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  style,
}: EdgeProps<Edge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge className={styles.edgePath} markerEnd={markerEnd} path={edgePath} style={style} />
      <EdgeLabelRenderer>
        <div
          className={styles.edgeLabelWrap}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
          }}
        >
          <span className={styles.edgeArrow}>→</span>
          <span className={styles.edgeLabel}>{label}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = {
  focusEdge: FocusEdgeView,
} satisfies EdgeTypes

interface SystemFocusFlowProps {
  downstream: FocusFlowItem[]
  projectCountBySystemId: Map<string, number>
  selectedSystem: ManagedSystem
  upstream: FocusFlowItem[]
}

export function SystemFocusFlow({
  downstream,
  projectCountBySystemId,
  selectedSystem,
  upstream,
}: SystemFocusFlowProps) {
  const columnWidth = 340
  const rowGap = 176
  const maxColumnCount = Math.max(upstream.length, downstream.length, 1)
  const centerY = maxColumnCount > 1 ? ((maxColumnCount - 1) * rowGap) / 2 : 0

  const { nodes, edges } = useMemo(() => ({
    nodes: [
      {
        id: selectedSystem.id,
        type: 'focusNode',
        position: { x: columnWidth, y: centerY },
        data: {
          system: selectedSystem,
          projectCount: projectCountBySystemId.get(selectedSystem.id) ?? 0,
          role: 'center',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
      ...upstream.map(({ relation, system }, index) => ({
        id: `upstream-${relation.id}`,
        type: 'focusNode' as const,
        position: { x: 0, y: index * rowGap },
        data: {
          system,
          projectCount: projectCountBySystemId.get(system.id) ?? 0,
          role: 'upstream' as const,
          protocol: relation.protocol ?? null,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })),
      ...downstream.map(({ relation, system }, index) => ({
        id: `downstream-${relation.id}`,
        type: 'focusNode' as const,
        position: { x: columnWidth * 2, y: index * rowGap },
        data: {
          system,
          projectCount: projectCountBySystemId.get(system.id) ?? 0,
          role: 'downstream' as const,
          protocol: relation.protocol ?? null,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      })),
    ] as FocusNode[],
    edges: [
      ...upstream.map(({ relation }) => ({
        id: `upstream-edge-${relation.id}`,
        source: `upstream-${relation.id}`,
        target: selectedSystem.id,
        type: 'focusEdge',
        label: '受信',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: '#0f4c5c',
        },
        style: {
          stroke: '#0f4c5c',
          strokeWidth: 2.4,
        },
        labelStyle: {
          fill: '#0f4c5c',
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: 'rgba(255,255,255,0.9)',
        },
        labelBgPadding: [10, 4] as [number, number],
        labelBgBorderRadius: 999,
      })),
      ...downstream.map(({ relation }) => ({
        id: `downstream-edge-${relation.id}`,
        source: selectedSystem.id,
        target: `downstream-${relation.id}`,
        type: 'focusEdge',
        label: '送信',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: '#b45309',
        },
        style: {
          stroke: '#b45309',
          strokeWidth: 2.4,
        },
        labelStyle: {
          fill: '#92400e',
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: 'rgba(255,255,255,0.9)',
        },
        labelBgPadding: [10, 4] as [number, number],
        labelBgBorderRadius: 999,
      })),
    ] as Edge[],
  }), [centerY, columnWidth, downstream, projectCountBySystemId, rowGap, selectedSystem, upstream])

  return (
    <div className={styles.flowWrap}>
      <ReactFlow
        defaultEdgeOptions={{ type: 'focusEdge' }}
        edges={edges}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        maxZoom={1.2}
        minZoom={0.45}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={48} size={1.2} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
