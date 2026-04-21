import dagre from '@dagrejs/dagre'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Member, SystemAssignment } from '../types/project'
import { exportReactFlowToPdf } from '../utils/reactFlowPdfExport'
import styles from './SystemStructureFlow.module.css'

interface StructureNodeData extends Record<string, unknown> {
  member: Member
  responsibilities: string[]
  directCount: number
  isRoot: boolean
  hasChildren: boolean
  isEditable: boolean
}

type StructureNode = Node<StructureNodeData, 'structureNode'>

interface StructureTreeNode {
  member: Member
  responsibilities: string[]
  children: StructureTreeNode[]
}

const nodeWidth = 304
const nodeHeight = 164
const exportHandleAllowance = 20

const responsibilityPriority = [
  'オーナー',
  '業務窓口',
  '運用統括',
  '基盤担当',
  '品質管理',
  '運用窓口',
  'アプリ担当',
  '監査対応',
]

function sortResponsibilities(values: string[]) {
  return [...values].sort((left, right) => {
    const leftIndex = responsibilityPriority.indexOf(left)
    const rightIndex = responsibilityPriority.indexOf(right)
    const safeLeft = leftIndex === -1 ? responsibilityPriority.length : leftIndex
    const safeRight = rightIndex === -1 ? responsibilityPriority.length : rightIndex

    return safeLeft - safeRight || left.localeCompare(right, 'ja')
  })
}

function getResponsibilityToneClass(responsibilities: string[]) {
  const joined = responsibilities.join(' ')

  if (responsibilities.includes('オーナー')) {
    return styles.toneOwner
  }

  if (joined.includes('統括') || joined.includes('窓口')) {
    return styles.toneLead
  }

  if (joined.includes('基盤') || joined.includes('運用')) {
    return styles.tonePlatform
  }

  if (joined.includes('品質') || joined.includes('監査')) {
    return styles.toneQuality
  }

  return styles.toneDefault
}

function getMemberInitials(name: string) {
  const normalized = name.replace(/\s+/g, '')

  if (normalized.length <= 2) {
    return normalized
  }

  return normalized.slice(0, 2)
}

function buildStructureTree(
  members: Member[],
  assignments: SystemAssignment[],
  rootMemberId: string,
) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const responsibilityByMemberId = new Map<string, string[]>()
  const childrenByManagerId = new Map<string, Member[]>()

  assignments.forEach((assignment) => {
    const member = memberById.get(assignment.memberId)

    if (!member) {
      return
    }

    const responsibilities = responsibilityByMemberId.get(assignment.memberId) ?? []
    responsibilities.push(assignment.responsibility)
    responsibilityByMemberId.set(assignment.memberId, responsibilities)

    if (assignment.memberId === rootMemberId) {
      return
    }

    const nextManagerId =
      assignment.reportsToMemberId && memberById.has(assignment.reportsToMemberId)
        ? assignment.reportsToMemberId
        : rootMemberId
    const bucket = childrenByManagerId.get(nextManagerId) ?? []
    bucket.push(member)
    childrenByManagerId.set(nextManagerId, bucket)
  })

  const rootMember = memberById.get(rootMemberId)

  if (!rootMember) {
    return null
  }

  const sortMembers = (entries: Member[]) =>
    [...entries].sort((left, right) => left.name.localeCompare(right.name, 'ja'))

  const buildNode = (member: Member): StructureTreeNode => ({
    member,
    responsibilities: sortResponsibilities(responsibilityByMemberId.get(member.id) ?? []),
    children: sortMembers(childrenByManagerId.get(member.id) ?? []).map(buildNode),
  })

  return buildNode(rootMember)
}

function flattenTree(
  node: StructureTreeNode,
  nodes: StructureNode[],
  edges: Edge[],
  isEditable: boolean,
  rootMemberId: string,
) {
  const isRoot = node.member.id === rootMemberId

  nodes.push({
    id: node.member.id,
    type: 'structureNode',
    position: { x: 0, y: 0 },
    data: {
      member: node.member,
      responsibilities: node.responsibilities,
      directCount: node.children.length,
      isRoot,
      hasChildren: node.children.length > 0,
      isEditable,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  })

  node.children.forEach((child) => {
    const isOwnerEdge = node.member.id === rootMemberId
    edges.push({
      id: `${node.member.id}-${child.member.id}`,
      source: node.member.id,
      target: child.member.id,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isOwnerEdge ? '#b45309' : '#4f46e5',
      },
      style: {
        stroke: isOwnerEdge ? '#b45309' : '#4f46e5',
        strokeWidth: isOwnerEdge ? 2.5 : 2,
      },
    })

    flattenTree(child, nodes, edges, isEditable, rootMemberId)
  })
}

function layoutNodes(nodes: StructureNode[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph()

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'TB',
    align: 'UL',
    nodesep: 72,
    ranksep: 126,
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

function StructureNodeView({ data }: NodeProps<StructureNode>) {
  const cardClassName = [
    styles.nodeCard,
    data.isRoot ? styles.rootCard : '',
    getResponsibilityToneClass(data.responsibilities),
  ]
    .filter(Boolean)
    .join(' ')

  const responsibilitySummary =
    data.responsibilities.length > 0
      ? `担当: ${data.responsibilities.join(' / ')}`
      : '担当: 未設定'

  return (
    <div className={cardClassName}>
      {!data.isRoot ? (
        <Handle
          className={styles.handleTop}
          position={Position.Top}
          type="target"
        />
      ) : null}
      {data.hasChildren || data.isEditable ? (
        <Handle
          className={styles.handleBottom}
          position={Position.Bottom}
          type="source"
        />
      ) : null}

      <div className={styles.cardGlow} />

      <div className={styles.identityRow}>
        <div className={styles.avatar}>{getMemberInitials(data.member.name)}</div>

        <div className={styles.identityMain}>
          <div className={styles.memberNameRow}>
            <span className={styles.memberName}>{data.member.name}</span>
            {data.isRoot ? <span className={styles.rootBadge}>OWNER</span> : null}
          </div>

          <div className={styles.memberMeta}>
            <span>{data.member.departmentName}</span>
            <span>{data.member.role}</span>
            <span>ID: {data.member.id}</span>
          </div>
        </div>

        <div className={styles.reportStat} aria-label={`直属メンバー ${data.directCount} 名`}>
          <span className={styles.reportStatValue}>{data.directCount}</span>
          <span className={styles.reportStatLabel}>Direct</span>
        </div>
      </div>

      <div className={styles.responsibilitySummary}>{responsibilitySummary}</div>

      <div className={styles.tagList}>
        {data.responsibilities.length > 0 ? (
          data.responsibilities.map((responsibility) => (
            <span key={`${data.member.id}-${responsibility}`} className={styles.tag}>
              {responsibility}
            </span>
          ))
        ) : (
          <span className={styles.emptyTag}>責務未設定</span>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  structureNode: StructureNodeView,
} satisfies NodeTypes

interface SystemStructureFlowProps {
  assignments: SystemAssignment[]
  isEditable?: boolean
  members: Member[]
  onConnect?: (connection: Connection) => void
  rootMemberId: string
}

export interface SystemStructureFlowHandle {
  exportPdf: () => Promise<void>
}

export const SystemStructureFlow = forwardRef<
  SystemStructureFlowHandle,
  SystemStructureFlowProps
>(function SystemStructureFlow({
  assignments,
  isEditable = false,
  members,
  onConnect,
  rootMemberId,
}, ref) {
  const flowWrapRef = useRef<HTMLDivElement | null>(null)
  const rootTree = useMemo(
    () => buildStructureTree(members, assignments, rootMemberId),
    [assignments, members, rootMemberId],
  )

  const { nodes, edges } = useMemo(() => {
    if (!rootTree) {
      return { nodes: [] as StructureNode[], edges: [] as Edge[] }
    }

    const nextNodes: StructureNode[] = []
    const nextEdges: Edge[] = []
    flattenTree(rootTree, nextNodes, nextEdges, isEditable, rootMemberId)

    return {
      nodes: layoutNodes(nextNodes, nextEdges),
      edges: nextEdges,
    }
  }, [isEditable, rootMemberId, rootTree])

  const exportBounds = useMemo(() => {
    if (nodes.length === 0) {
      return null
    }

    const minX = Math.min(...nodes.map((node) => node.position.x))
    const minY = Math.min(...nodes.map((node) => node.position.y - exportHandleAllowance))
    const maxX = Math.max(...nodes.map((node) => node.position.x + nodeWidth))
    const maxY = Math.max(
      ...nodes.map((node) => node.position.y + nodeHeight + exportHandleAllowance),
    )

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }, [nodes])

  const handleConnect = useMemo<OnConnect | undefined>(() => {
    if (!isEditable || !onConnect) {
      return undefined
    }

    return (connection) => {
      onConnect(connection)
    }
  }, [isEditable, onConnect])

  useImperativeHandle(
    ref,
    () => ({
      async exportPdf() {
        const flowWrapElement = flowWrapRef.current

        if (!flowWrapElement || nodes.length === 0) {
          throw new Error('PDF 出力の準備ができていません。')
        }

        await exportReactFlowToPdf({
          bounds: exportBounds ?? undefined,
          fileName: 'system-structure.pdf',
          flowContainer: flowWrapElement,
          nodes,
        })
      },
    }),
    [exportBounds, nodes],
  )

  if (!rootTree) {
    return (
      <p className={styles.emptyText}>
        システム体制を表示できませんでした。
      </p>
    )
  }

  return (
    <div className={styles.flowWrap} data-testid="system-structure-flow" ref={flowWrapRef}>
      <ReactFlow
        defaultEdgeOptions={{ type: 'smoothstep' }}
        edges={edges}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.26 }}
        maxZoom={1.35}
        minZoom={0.35}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={isEditable}
        nodesDraggable={false}
        onConnect={handleConnect}
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#94a3b8" gap={48} size={1.4} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
})
