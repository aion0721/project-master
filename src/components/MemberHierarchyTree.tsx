import type { Member } from '../types/project'
import styles from './MemberHierarchyTree.module.css'

interface HierarchyNode {
  member: Member
  children: HierarchyNode[]
  isSelected: boolean
  isPathNode: boolean
}

function sortMembers(members: Member[]) {
  return [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja'))
}

function buildDescendantNode(
  member: Member,
  childrenByManagerId: Map<string | null, Member[]>,
  selectedMemberId: string,
): HierarchyNode {
  return {
    member,
    isSelected: member.id === selectedMemberId,
    isPathNode: member.id === selectedMemberId,
    children: sortMembers(childrenByManagerId.get(member.id) ?? []).map((child) =>
      buildDescendantNode(child, childrenByManagerId, selectedMemberId),
    ),
  }
}

function buildHierarchyTree(members: Member[], selectedMemberId: string) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const selectedMember = memberById.get(selectedMemberId)

  if (!selectedMember) {
    return null
  }

  const childrenByManagerId = new Map<string | null, Member[]>()

  members.forEach((member) => {
    const bucket = childrenByManagerId.get(member.managerId) ?? []
    bucket.push(member)
    childrenByManagerId.set(member.managerId, bucket)
  })

  const lineage: Member[] = []
  let cursor: Member | undefined = selectedMember

  while (cursor) {
    lineage.unshift(cursor)
    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined
  }

  function buildPathNode(index: number): HierarchyNode {
    const member = lineage[index]
    const isSelected = member.id === selectedMemberId

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
    }
  }

  return buildPathNode(0)
}

function MemberHierarchyNodeView({ node }: { node: HierarchyNode }) {
  return (
    <li className={styles.nodeItem}>
      <div
        className={[styles.nodeCard, node.isSelected ? styles.selectedCard : '', node.isPathNode ? styles.pathCard : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.nodeHeader}>
          <div>
            <div className={styles.memberNameRow}>
              <span className={styles.memberName}>{node.member.name}</span>
              {node.isSelected ? <span className={styles.selectedBadge}>選択中</span> : null}
            </div>
            <div className={styles.memberMeta}>
              <span>{node.member.id}</span>
              <span>{node.member.departmentName}</span>
              <span>{node.member.role}</span>
            </div>
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <ul className={styles.childList}>
          {node.children.map((child) => (
            <MemberHierarchyNodeView key={child.member.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface MemberHierarchyTreeProps {
  members: Member[]
  selectedMemberId: string
}

export function MemberHierarchyTree({ members, selectedMemberId }: MemberHierarchyTreeProps) {
  const tree = buildHierarchyTree(members, selectedMemberId)

  if (!tree) {
    return <p className={styles.emptyText}>表示対象のメンバーを選択してください。</p>
  }

  return (
    <div className={styles.treeWrap} data-testid="member-hierarchy-tree">
      <ul className={styles.rootList}>
        <MemberHierarchyNodeView node={tree} />
      </ul>
    </div>
  )
}
