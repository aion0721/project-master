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
import type {
  ManagedSystem,
  SystemRelation,
  SystemTransaction,
  SystemTransactionStep,
} from '../types/project'
import styles from './SystemTransactionFlow.module.css'

interface TransactionNodeData extends Record<string, unknown> {
  system: ManagedSystem
  projectCount: number
  role: 'start' | 'middle' | 'end'
}

type TransactionNode = Node<TransactionNodeData, 'transactionNode'>

interface TransactionEdgeData extends Record<string, unknown> {
  actionLabel: string
  protocol: string | null
  stepOrder: number
}

type TransactionEdge = Edge<TransactionEdgeData, 'transactionEdge'>

function TransactionNodeView({ data }: NodeProps<TransactionNode>) {
  const className = [
    styles.nodeCard,
    data.role === 'start' ? styles.nodeStart : '',
    data.role === 'end' ? styles.nodeEnd : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <Handle className={styles.handleLeft} position={Position.Left} type="target" />
      <Handle className={styles.handleRight} position={Position.Right} type="source" />
      <div className={styles.nodeRole}>
        {data.role === 'start' ? '起点' : data.role === 'end' ? '終点' : '経由'}
      </div>
      <div className={styles.nodeTitle}>{data.system.name}</div>
      <div className={styles.nodeMeta}>{data.system.category}</div>
      <div className={styles.nodeMeta}>関連案件 {data.projectCount} 件</div>
      {data.system.note ? <p className={styles.nodeNote}>{data.system.note}</p> : null}
    </div>
  )
}

function TransactionEdgeView({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<TransactionEdge>) {
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
      <BaseEdge className={styles.edgePath} markerEnd={markerEnd} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          className={styles.edgeLabelWrap}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
          }}
        >
          <span className={styles.edgeOrder}>Step {data?.stepOrder ?? '-'}</span>
          <span className={styles.edgeLabel}>{data?.actionLabel ?? '処理'}</span>
          {data?.protocol?.trim() ? <span className={styles.edgeProtocol}>{data.protocol}</span> : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = {
  transactionNode: TransactionNodeView,
} satisfies NodeTypes

const edgeTypes = {
  transactionEdge: TransactionEdgeView,
} satisfies EdgeTypes

interface SystemTransactionFlowProps {
  projectCountBySystemId: Map<string, number>
  relationById: Map<string, SystemRelation>
  systemById: Map<string, ManagedSystem>
  transaction: SystemTransaction
  steps: SystemTransactionStep[]
}

export function SystemTransactionFlow({
  projectCountBySystemId,
  relationById,
  systemById,
  transaction,
  steps,
}: SystemTransactionFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const orderedSteps = [...steps].sort((left, right) => left.stepOrder - right.stepOrder)
    const orderedSystemIds = orderedSteps.reduce<string[]>((ids, step) => {
      if (ids.length === 0) {
        return [step.sourceSystemId, step.targetSystemId]
      }

      return ids.at(-1) === step.sourceSystemId ? [...ids, step.targetSystemId] : [...ids, step.sourceSystemId, step.targetSystemId]
    }, [])

    const uniqueSystemIds = orderedSystemIds.filter((systemId, index) => orderedSystemIds.indexOf(systemId) === index)
    const columnWidth = 320

    const nextNodes = uniqueSystemIds.flatMap((systemId, index) => {
        const system = systemById.get(systemId)

        if (!system) {
          return []
        }

        return [
          {
            id: systemId,
            type: 'transactionNode' as const,
            position: { x: index * columnWidth, y: 0 },
            data: {
              system,
              projectCount: projectCountBySystemId.get(systemId) ?? 0,
              role:
                index === 0
                  ? ('start' as const)
                  : index === uniqueSystemIds.length - 1
                    ? ('end' as const)
                    : ('middle' as const),
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          } satisfies TransactionNode,
        ]
      })

    const nextEdges = orderedSteps.map((step) => {
      const relation = relationById.get(step.relationId)

      return {
        id: step.id,
        type: 'transactionEdge',
        source: step.sourceSystemId,
        target: step.targetSystemId,
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
        data: {
          actionLabel: step.actionLabel?.trim() || transaction.dataLabel,
          protocol: relation?.protocol ?? null,
          stepOrder: step.stepOrder,
        },
      }
    }) as TransactionEdge[]

    return {
      nodes: nextNodes,
      edges: nextEdges,
    }
  }, [projectCountBySystemId, relationById, steps, systemById, transaction.dataLabel])

  if (nodes.length === 0 || edges.length === 0) {
    return <p className={styles.emptyText}>データ流れの経路を表示できませんでした。</p>
  }

  return (
    <div className={styles.flowWrap} data-testid="system-transaction-flow">
      <ReactFlow
        defaultEdgeOptions={{ type: 'transactionEdge' }}
        edges={edges}
        edgeTypes={edgeTypes}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        maxZoom={1.2}
        minZoom={0.45}
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
