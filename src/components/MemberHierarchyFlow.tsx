import dagre from "@dagrejs/dagre";
import { useMemo } from "react";
import {
  Background,
  type Connection,
  Controls,
  Handle,
  MarkerType,
  ReactFlow,
  type OnConnect,
  Position,
  type Edge,
  type Node,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import type { Member } from "../types/project";
import "@xyflow/react/dist/style.css";
import styles from "./MemberHierarchyFlow.module.css";

interface HierarchyNodeData extends Record<string, unknown> {
  member: Member;
  isSelected: boolean;
  isPathNode: boolean;
  hasParent: boolean;
  hasChildren: boolean;
  isEditable: boolean;
}

interface BranchBandData extends Record<string, unknown> {
  label: string;
  tone: number;
}

interface HierarchyTreeNode {
  member: Member;
  isSelected: boolean;
  isPathNode: boolean;
  children: HierarchyTreeNode[];
}

interface BranchGroup {
  id: string;
  anchorMemberId: string;
  label: string;
  tone: number;
  memberIds: string[];
}

type MemberFlowNodeType = Node<HierarchyNodeData, "memberNode">;
type BranchBandNodeType = Node<BranchBandData, "branchBand">;
type HierarchyFlowNode = MemberFlowNodeType | BranchBandNodeType;

const nodeWidth = 288;
const nodeHeight = 136;
const branchPaddingX = 28;
const branchPaddingY = 26;
const topLevelBranchGap = 44;
const branchTones = [
  { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.08)" },
  { stroke: "#34d399", fill: "rgba(52, 211, 153, 0.08)" },
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.08)" },
  { stroke: "#a78bfa", fill: "rgba(167, 139, 250, 0.08)" },
];

function sortMembers(members: Member[]) {
  return [...members].sort((left, right) =>
    left.name.localeCompare(right.name, "ja"),
  );
}

function buildDescendantNode(
  member: Member,
  childrenByManagerId: Map<string | null, Member[]>,
  selectedMemberId: string,
): HierarchyTreeNode {
  return {
    member,
    isSelected: member.id === selectedMemberId,
    isPathNode: member.id === selectedMemberId,
    children: sortMembers(childrenByManagerId.get(member.id) ?? []).map(
      (child) =>
        buildDescendantNode(child, childrenByManagerId, selectedMemberId),
    ),
  };
}

function buildHierarchyTree(members: Member[], selectedMemberId: string) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const selectedMember = memberById.get(selectedMemberId);

  if (!selectedMember) {
    return null;
  }

  const childrenByManagerId = new Map<string | null, Member[]>();

  members.forEach((member) => {
    const bucket = childrenByManagerId.get(member.managerId) ?? [];
    bucket.push(member);
    childrenByManagerId.set(member.managerId, bucket);
  });

  const lineage: Member[] = [];
  let cursor: Member | undefined = selectedMember;

  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined;
  }

  function buildPathNode(index: number): HierarchyTreeNode {
    const member = lineage[index];
    const isSelected = member.id === selectedMemberId;

    return {
      member,
      isSelected,
      isPathNode: true,
      children: isSelected
        ? sortMembers(childrenByManagerId.get(member.id) ?? []).map((child) =>
            buildDescendantNode(child, childrenByManagerId, selectedMemberId),
          )
        : lineage[index + 1]
          ? [buildPathNode(index + 1)]
          : [],
    };
  }

  return buildPathNode(0);
}

function findSelectedNode(node: HierarchyTreeNode): HierarchyTreeNode | null {
  if (node.isSelected) {
    return node;
  }

  for (const child of node.children) {
    const result = findSelectedNode(child);

    if (result) {
      return result;
    }
  }

  return null;
}

function collectMemberIds(node: HierarchyTreeNode): string[] {
  return [
    node.member.id,
    ...node.children.flatMap((child) => collectMemberIds(child)),
  ];
}

function getBranchGroups(tree: HierarchyTreeNode): BranchGroup[] {
  const selectedNode = findSelectedNode(tree);

  if (!selectedNode) {
    return [];
  }

  const orderedChildren = [...selectedNode.children].sort((left, right) => {
    const leftIsLeaf = left.children.length === 0;
    const rightIsLeaf = right.children.length === 0;

    if (leftIsLeaf !== rightIsLeaf) {
      return leftIsLeaf ? -1 : 1;
    }

    return left.member.name.localeCompare(right.member.name, "ja");
  });

  return orderedChildren.map((child, index) => ({
    id: `branch-${child.member.id}`,
    anchorMemberId: child.member.id,
    label: child.member.lineLabel?.trim() || `${child.member.name} ライン`,
    tone: index % branchTones.length,
    memberIds: collectMemberIds(child),
  }));
}

function flattenTree(
  node: HierarchyTreeNode,
  nodes: MemberFlowNodeType[],
  edges: Edge[],
  branchToneByMemberId: Map<string, number>,
  isEditable: boolean,
  parentId?: string,
) {
  nodes.push({
    id: node.member.id,
    type: "memberNode",
    position: { x: 0, y: 0 },
    data: {
      member: node.member,
      isSelected: node.isSelected,
      isPathNode: node.isPathNode,
      hasParent: Boolean(parentId),
      hasChildren: node.children.length > 0,
      isEditable,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  node.children.forEach((child) => {
    const branchTone = branchToneByMemberId.get(child.member.id);
    const branchColor =
      branchTone === undefined ? null : branchTones[branchTone];

    edges.push({
      id: `${node.member.id}-${child.member.id}`,
      source: node.member.id,
      target: child.member.id,
      type: "smoothstep",
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: child.isSelected
          ? "#0f766e"
          : (branchColor?.stroke ?? "#a8b2c2"),
      },
      style: {
        stroke: child.isSelected
          ? "#0f766e"
          : (branchColor?.stroke ?? "#a8b2c2"),
        strokeWidth: child.isSelected ? 2.4 : 2,
      },
    });

    flattenTree(
      child,
      nodes,
      edges,
      branchToneByMemberId,
      isEditable,
      node.member.id,
    );
  });
}

function layoutNodes(nodes: MemberFlowNodeType[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 72,
    ranksep: 138,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const layout = graph.node(node.id);

    return {
      ...node,
      position: {
        x: layout.x - nodeWidth / 2,
        y: layout.y - nodeHeight / 2,
      },
    };
  });
}

function arrangeTopLevelBranches(
  nodes: MemberFlowNodeType[],
  groups: BranchGroup[],
) {
  const boundsByGroup = groups
    .map((group) => {
      const groupNodes = nodes.filter((node) =>
        group.memberIds.includes(node.id),
      );

      if (groupNodes.length === 0) {
        return null;
      }

      const minX = Math.min(...groupNodes.map((node) => node.position.x));
      const maxX = Math.max(
        ...groupNodes.map((node) => node.position.x + nodeWidth),
      );

      return {
        group,
        minX,
        maxX,
        paddedMinX: minX - branchPaddingX,
        paddedMaxX: maxX + branchPaddingX,
        width: maxX - minX,
        paddedWidth: maxX - minX + branchPaddingX * 2,
      };
    })
    .filter(
      (
        item,
      ): item is {
        group: BranchGroup;
        minX: number;
        maxX: number;
        paddedMinX: number;
        paddedMaxX: number;
        width: number;
        paddedWidth: number;
      } => Boolean(item),
    );

  if (boundsByGroup.length <= 1) {
    return nodes;
  }

  let cursor = Math.min(...boundsByGroup.map((item) => item.paddedMinX));
  const shiftByMemberId = new Map<string, number>();

  boundsByGroup.forEach((item) => {
    const shift = cursor - item.paddedMinX;

    item.group.memberIds.forEach((memberId) => {
      shiftByMemberId.set(memberId, shift);
    });

    cursor += item.paddedWidth + topLevelBranchGap;
  });

  return nodes.map((node) => {
    const shift = shiftByMemberId.get(node.id) ?? 0;

    return shift === 0
      ? node
      : {
          ...node,
          position: {
            x: node.position.x + shift,
            y: node.position.y,
          },
        };
  });
}

function buildBranchBandNodes(
  nodes: MemberFlowNodeType[],
  groups: BranchGroup[],
): BranchBandNodeType[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const rawBounds = groups
    .map((group) => {
      const groupNodes = group.memberIds
        .map((memberId) => nodeMap.get(memberId))
        .filter((node): node is MemberFlowNodeType => Boolean(node));

      if (groupNodes.length === 0) {
        return null;
      }

      return {
        group,
        nodeCount: groupNodes.length,
        minX:
          Math.min(...groupNodes.map((node) => node.position.x)) -
          branchPaddingX,
        maxX:
          Math.max(...groupNodes.map((node) => node.position.x + nodeWidth)) +
          branchPaddingX,
        minY: Math.min(...groupNodes.map((node) => node.position.y)),
        maxY: Math.max(
          ...groupNodes.map((node) => node.position.y + nodeHeight),
        ),
      };
    })
    .filter(
      (
        item,
      ): item is {
        group: BranchGroup;
        nodeCount: number;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      } => Boolean(item),
    )
    .sort((left, right) => left.minX - right.minX);

  const adjustedBounds = rawBounds.map((bound) => {
    if (bound.nodeCount === 1) {
      return bound;
    }

    // For branches with descendants, prioritize covering the full subtree.
    // A slight overlap is preferable to losing the visual grouping under child nodes.
    return bound;
  });

  const boundsByGroupId = new Map(
    adjustedBounds.map((bound) => [bound.group.id, bound]),
  );

  return groups.flatMap((group) => {
    const bound = boundsByGroupId.get(group.id);

    if (!bound) {
      return [];
    }

    const topPadding = 48;

    return [
      {
        id: group.id,
        type: "branchBand",
        position: {
          x: bound.minX,
          y: bound.minY - topPadding,
        },
        style: {
          width: Math.max(
            bound.maxX - bound.minX,
            nodeWidth + branchPaddingX * 2,
          ),
          height: bound.maxY - bound.minY + topPadding + branchPaddingY,
        },
        data: {
          label: group.label,
          tone: group.tone,
        },
        draggable: false,
        selectable: false,
        connectable: false,
      },
    ];
  });
}

function getRoleToneClass(role: string) {
  if (role.includes("部長") || role.includes("本部長")) {
    return styles.toneExecutive;
  }

  if (role.includes("PM") || role.includes("リーダー")) {
    return styles.toneLead;
  }

  if (role.includes("テスト") || role.includes("品質")) {
    return styles.toneQuality;
  }

  if (role.includes("インフラ") || role.includes("基盤")) {
    return styles.tonePlatform;
  }

  return styles.toneDefault;
}

function MemberFlowNode({ data }: NodeProps<MemberFlowNodeType>) {
  const className = [
    styles.nodeCard,
    data.isSelected ? styles.selectedCard : "",
    data.isPathNode ? styles.pathCard : "",
    getRoleToneClass(data.member.role),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {data.hasParent || data.isEditable ? (
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

      <div className={styles.nodeInner}>
        <div className={styles.nodeHeader}>
          {data.isSelected ? (
            <span className={styles.stateBadge}>選択中</span>
          ) : null}
          {!data.isSelected && data.isPathNode ? (
            <span className={styles.pathBadge}>Path</span>
          ) : null}
        </div>

        <div className={styles.nodeMain}>
          <div className={styles.memberName}>{data.member.name}</div>
          <div className={styles.memberRole}>{data.member.role}</div>
        </div>
      </div>
    </div>
  );
}

function BranchBandNode({ data }: NodeProps<BranchBandNodeType>) {
  const toneClass = styles[`branchTone${data.tone}` as keyof typeof styles];

  return (
    <div className={[styles.branchBand, toneClass].filter(Boolean).join(" ")}>
      <span className={styles.branchLabel}>{data.label}</span>
    </div>
  );
}

const nodeTypes = {
  memberNode: MemberFlowNode,
  branchBand: BranchBandNode,
} satisfies NodeTypes;

interface MemberHierarchyFlowProps {
  members: Member[];
  selectedMemberId: string;
  isEditable?: boolean;
  onManagerConnect?: (connection: Connection) => void;
}

export function MemberHierarchyFlow({
  members,
  selectedMemberId,
  isEditable = false,
  onManagerConnect,
}: MemberHierarchyFlowProps) {
  const tree = useMemo(
    () => buildHierarchyTree(members, selectedMemberId),
    [members, selectedMemberId],
  );

  const { nodes, edges } = useMemo(() => {
    if (!tree) {
      return { nodes: [] as HierarchyFlowNode[], edges: [] as Edge[] };
    }

    const branchGroups = getBranchGroups(tree);
    const branchToneByMemberId = new Map<string, number>();

    branchGroups.forEach((group) => {
      group.memberIds.forEach((memberId) => {
        branchToneByMemberId.set(memberId, group.tone);
      });
    });

    const memberNodes: MemberFlowNodeType[] = [];
    const nextEdges: Edge[] = [];
    flattenTree(tree, memberNodes, nextEdges, branchToneByMemberId, isEditable);
    const positionedMemberNodes = arrangeTopLevelBranches(
      layoutNodes(memberNodes, nextEdges),
      branchGroups,
    );
    const branchBandNodes = buildBranchBandNodes(
      positionedMemberNodes,
      branchGroups,
    );

    return {
      nodes: [...branchBandNodes, ...positionedMemberNodes] as HierarchyFlowNode[],
      edges: nextEdges,
    };
  }, [isEditable, tree]);

  const handleConnect = useMemo<OnConnect | undefined>(() => {
    if (!isEditable || !onManagerConnect) {
      return undefined;
    }

    return (connection) => {
      onManagerConnect(connection);
    };
  }, [isEditable, onManagerConnect]);

  if (!tree) {
    return (
      <p className={styles.emptyText}>
        表示対象のメンバーを取得できませんでした。
      </p>
    );
  }

  return (
    <div className={styles.flowWrap} data-testid="member-hierarchy-tree">
      <ReactFlow
        defaultEdgeOptions={{ type: "smoothstep" }}
        edges={edges}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={isEditable}
        onConnect={handleConnect}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.28 }}
        maxZoom={1.35}
        minZoom={0.35}
        nodesDraggable={false}
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#94a3b8" gap={50} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
