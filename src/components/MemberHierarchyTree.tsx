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

function getRootMembers(
  members: Member[],
  memberById: Map<string, Member>,
) {
  return sortMembers(
    members.filter((member) => !member.managerId || !memberById.has(member.managerId)),
  )
}

function buildDescendantNode(
  member: Member,
  childrenByManagerId: Map<string | null, Member[]>,
  selectedMemberId?: string,
): HierarchyNode {
  return {
    member,
    isSelected: member.id === selectedMemberId,
    isPathNode: Boolean(selectedMemberId) && member.id === selectedMemberId,
    children: sortMembers(childrenByManagerId.get(member.id) ?? []).map((child) =>
      buildDescendantNode(child, childrenByManagerId, selectedMemberId),
    ),
  }
}

function buildHierarchyForest(members: Member[], selectedMemberId?: string) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const selectedMember = selectedMemberId ? memberById.get(selectedMemberId) : undefined

  const childrenByManagerId = new Map<string | null, Member[]>()

  members.forEach((member) => {
    const bucket = childrenByManagerId.get(member.managerId) ?? []
    bucket.push(member)
    childrenByManagerId.set(member.managerId, bucket)
  })

  if (!selectedMember) {
    return getRootMembers(members, memberById).map((member) => buildDescendantNode(member, childrenByManagerId))
  }

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

  return [buildPathNode(0)]
}

function getMemberInitials(name: string) {
  const normalized = name.replace(/\s+/g, '')

  if (normalized.length <= 2) {
    return normalized
  }

  return normalized.slice(0, 2)
}

function getRoleToneClass(role: string) {
  if (role.includes('部長') || role.includes('本部長')) {
    return styles.toneExecutive
  }

  if (role.includes('PM') || role.includes('リーダー')) {
    return styles.toneLead
  }

  if (role.includes('テスト') || role.includes('品質')) {
    return styles.toneQuality
  }

  if (role.includes('インフラ') || role.includes('基盤')) {
    return styles.tonePlatform
  }

  return styles.toneDefault
}

function MemberHierarchyNodeView({ node, depth = 0 }: { node: HierarchyNode; depth?: number }) {
  const className = [
    styles.nodeCard,
    node.isSelected ? styles.selectedCard : '',
    node.isPathNode ? styles.pathCard : '',
    getRoleToneClass(node.member.role),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={styles.nodeItem}>
      <div className={className} data-depth={depth}>
        <div className={styles.cardGlow} />

        <div className={styles.identityRow}>
          <div className={styles.avatar}>{getMemberInitials(node.member.name)}</div>

          <div className={styles.identityMain}>
            <div className={styles.memberNameRow}>
              <span className={styles.memberName}>{node.member.name}</span>
              {node.isSelected ? <span className={styles.selectedBadge}>選択中</span> : null}
              {!node.isSelected && node.isPathNode ? <span className={styles.pathBadge}>Path</span> : null}
            </div>

            <div className={styles.memberMeta}>
              <span>{node.member.id}</span>
              <span>{node.member.departmentName}</span>
              <span>{node.member.role}</span>
            </div>
          </div>

          <div className={styles.reportStat} aria-label={`配下メンバー ${node.children.length} 名`}>
            <span className={styles.reportStatValue}>{node.children.length}</span>
            <span className={styles.reportStatLabel}>Reports</span>
          </div>
        </div>

        <div className={styles.memberSummary}>
          {!node.isSelected && !node.isPathNode
            ? '表示中のメンバーです。'
            : node.isSelected
            ? '現在の選択メンバーです。'
            : node.isPathNode
              ? '選択メンバーまでの経路に含まれています。'
              : '選択メンバー配下のメンバーです。'}
        </div>
      </div>

      {node.children.length > 0 ? (
        <ul className={styles.childList}>
          {node.children.map((child) => (
            <MemberHierarchyNodeView key={child.member.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface MemberHierarchyTreeProps {
  members: Member[]
  selectedMemberId?: string
}

export function MemberHierarchyTree({ members, selectedMemberId }: MemberHierarchyTreeProps) {
  const forest = buildHierarchyForest(members, selectedMemberId)

  if (forest.length === 0) {
    return <p className={styles.emptyText}>表示対象のメンバーを取得できませんでした。</p>
  }

  return (
    <div className={styles.treeWrap} data-testid="member-hierarchy-tree">
      <ul className={styles.rootList}>
        {forest.map((node) => (
          <MemberHierarchyNodeView key={node.member.id} node={node} />
        ))}
      </ul>
    </div>
  )
}
