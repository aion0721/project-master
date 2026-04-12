import type { Connection } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { useMemo } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Member, ProjectAssignment } from '../types/project'
import styles from './ProjectStructureFlow.module.css'

interface StructureNodeData extends Record<string, unknown> {
  member: Member
  responsibilities: string[]
  isRoot: boolean
  isSelected: boolean
  isEditable: boolean
  onSelect?: (memberId: string) => void
}

type StructureNode = Node<StructureNodeData, 'structureNode'>

const responsibilityPriority = [
  'PM',
  'OS',
  '基本設計',
  '詳細設計',
  '基礎検討',
  'テスト',
  '移行',
  'インフラ統括',
]

const nodeWidth = 260
const nodeHeight = 128

function sortResponsibilities(values: string[]) {
  return [...values].sort((left, right) => {
    const leftIndex = responsibilityPriority.indexOf(left)
    const rightIndex = responsibilityPriority.indexOf(right)
    const safeLeft = leftIndex === -1 ? responsibilityPriority.length : leftIndex
    const safeRight = rightIndex === -1 ? responsibilityPriority.length : rightIndex

    return safeLeft - safeRight || left.localeCompare(right, 'ja')
  })
}

function StructureNodeView({ data }: NodeProps<StructureNode>) {
  return (
    <button
      className={styles.nodeButton}
      data-testid={`project-structure-node-${data.member.id}`}
      onClick={() => data.onSelect?.(data.member.id)}
      type="button"
    >
      <div
        className={[
          styles.nodeCard,
          data.isRoot ? styles.rootCard : '',
          data.isSelected ? styles.selectedCard : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Handle className={styles.handleTop} position={Position.Top} type="target" />
        <Handle className={styles.handleBottom} position={Position.Bottom} type="source" />
        <div className={styles.nodeHeader}>
          <span className={styles.memberName}>{data.member.name}</span>
          {data.isRoot ? <span className={styles.rootBadge}>ROOT</span> : null}
        </div>
        <div className={styles.memberMeta}>
          <span>{data.member.departmentName}</span>
          <span>{data.member.role}</span>
          <span>ID: {data.member.id}</span>
        </div>
        <div className={styles.responsibilitySummary}>
          担当: {data.responsibilities.length > 0 ? data.responsibilities.join(' / ') : '未設定'}
        </div>
      </div>
    </button>
  )
}

const nodeTypes = {
  structureNode: StructureNodeView,
} satisfies NodeTypes

interface ProjectStructureFlowProps {
  assignments: ProjectAssignment[]
  isEditable?: boolean
  members: Member[]
  onConnect?: (connection: Connection) => void
  onSelectMember?: (memberId: string) => void
  rootMemberId: string
  selectedMemberId?: string | null
}

export function ProjectStructureFlow({
  assignments,
  isEditable = false,
  members,
  onConnect,
  onSelectMember,
  rootMemberId,
  selectedMemberId = null,
}: ProjectStructureFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const memberIds = new Set(
      assignments
        .flatMap((assignment) => [assignment.memberId, assignment.reportsToMemberId ?? undefined])
        .filter((memberId): memberId is string => Boolean(memberId))
        .concat(rootMemberId),
    )

    const relevantMembers = members.filter((member) => memberIds.has(member.id))

    if (relevantMembers.length === 0) {
      return { nodes: [] as StructureNode[], edges: [] as Edge[] }
    }

    const memberById = new Map(relevantMembers.map((member) => [member.id, member]))
    const nodes: StructureNode[] = relevantMembers.map((member) => ({
      id: member.id,
      type: 'structureNode',
      position: { x: 0, y: 0 },
      data: {
        member,
        responsibilities: sortResponsibilities(
          assignments
            .filter((assignment) => assignment.memberId === member.id)
            .map((assignment) => assignment.responsibility),
        ),
        isRoot: member.id === rootMemberId,
        isSelected: selectedMemberId === member.id,
        isEditable,
        onSelect: onSelectMember,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }))

    const edges: Edge[] = assignments
      .filter((assignment) => assignment.memberId !== rootMemberId)
      .flatMap((assignment) => {
        const managerId =
          assignment.reportsToMemberId && memberById.has(assignment.reportsToMemberId)
            ? assignment.reportsToMemberId
            : rootMemberId

        if (!memberById.has(assignment.memberId) || !memberById.has(managerId)) {
          return []
        }

        return [
          {
            id: `${managerId}-${assignment.memberId}`,
            source: managerId,
            target: assignment.memberId,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: '#94a3b8',
            },
            style: {
              stroke: '#94a3b8',
              strokeWidth: 2,
            },
          },
        ]
      })

    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({
      rankdir: 'TB',
      nodesep: 56,
      ranksep: 110,
      marginx: 24,
      marginy: 24,
    })

    nodes.forEach((node) => {
      graph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })
    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target)
    })

    dagre.layout(graph)

    return {
      nodes: nodes.map((node) => {
        const layout = graph.node(node.id)
        return {
          ...node,
          position: {
            x: layout.x - nodeWidth / 2,
            y: layout.y - nodeHeight / 2,
          },
        }
      }),
      edges,
    }
  }, [assignments, isEditable, members, onSelectMember, rootMemberId, selectedMemberId])

  if (nodes.length === 0) {
    return <p className={styles.emptyText}>体制メンバーが設定されていません。</p>
  }

  return (
    <div className={styles.flowWrap} data-testid="project-structure-flow">
      <ReactFlow
        defaultEdgeOptions={{ type: 'smoothstep' }}
        edges={edges}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.24 }}
        maxZoom={1.3}
        minZoom={0.4}
        nodes={nodes}
        nodesConnectable={isEditable}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        onConnect={isEditable ? onConnect : undefined}
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={48} size={1.2} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
