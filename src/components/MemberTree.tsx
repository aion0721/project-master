import type { Member, ProjectAssignment, SystemAssignment } from '../types/project'
import styles from './MemberTree.module.css'

type TreeAssignment = ProjectAssignment | SystemAssignment

interface MemberNode {
  member: Member
  responsibilities: string[]
  children: MemberNode[]
}

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

function sortResponsibilities(values: string[]) {
  return [...values].sort((left, right) => {
    const leftIndex = responsibilityPriority.indexOf(left)
    const rightIndex = responsibilityPriority.indexOf(right)
    const safeLeft = leftIndex === -1 ? responsibilityPriority.length : leftIndex
    const safeRight = rightIndex === -1 ? responsibilityPriority.length : rightIndex

    return safeLeft - safeRight || left.localeCompare(right, 'ja')
  })
}

function buildTree(
  relevantMembers: Member[],
  assignments: TreeAssignment[],
  rootMemberId: string,
) {
  const memberIdSet = new Set(relevantMembers.map((member) => member.id))
  const childrenByManager = new Map<string | null, Member[]>()
  const managerByMemberId = new Map<string, string | null>()

  assignments.forEach((assignment) => {
    if (assignment.memberId === rootMemberId) {
      managerByMemberId.set(assignment.memberId, null)
      return
    }

    if (managerByMemberId.has(assignment.memberId)) {
      return
    }

    const nextManagerId =
      assignment.reportsToMemberId && memberIdSet.has(assignment.reportsToMemberId)
        ? assignment.reportsToMemberId
        : null

    managerByMemberId.set(assignment.memberId, nextManagerId)
  })

  managerByMemberId.set(rootMemberId, null)

  relevantMembers.forEach((member) => {
    const managerKey = managerByMemberId.get(member.id) ?? null
    const bucket = childrenByManager.get(managerKey) ?? []
    bucket.push(member)
    childrenByManager.set(managerKey, bucket)
  })

  const sortMembers = (entries: Member[]) =>
    [...entries].sort((left, right) => {
      if (left.id === rootMemberId) {
        return -1
      }

      if (right.id === rootMemberId) {
        return 1
      }

      return left.name.localeCompare(right.name, 'ja')
    })

  const makeNode = (member: Member): MemberNode => ({
    member,
    responsibilities: sortResponsibilities(
      assignments
        .filter((assignment) => assignment.memberId === member.id)
        .map((assignment) => assignment.responsibility),
    ),
    children: sortMembers(childrenByManager.get(member.id) ?? []).map(makeNode),
  })

  return sortMembers(childrenByManager.get(null) ?? []).map(makeNode)
}

function getMemberInitials(name: string) {
  const normalized = name.replace(/\s+/g, '')

  if (normalized.length <= 2) {
    return normalized
  }

  return normalized.slice(0, 2)
}

function getResponsibilityToneClass(responsibilities: string[]) {
  const joined = responsibilities.join(' ')

  if (responsibilities.includes('PM')) {
    return styles.toneLead
  }

  if (joined.includes('設計') || joined.includes('統括')) {
    return styles.toneDesign
  }

  if (joined.includes('テスト') || joined.includes('移行')) {
    return styles.toneDelivery
  }

  if (responsibilities.includes('OS')) {
    return styles.toneOps
  }

  return styles.toneDefault
}

function MemberTreeNodeView({
  node,
  depth = 0,
  isRoot = false,
}: {
  node: MemberNode
  depth?: number
  isRoot?: boolean
}) {
  const cardClassName = [
    styles.nodeCard,
    isRoot ? styles.rootCard : '',
    getResponsibilityToneClass(node.responsibilities),
  ]
    .filter(Boolean)
    .join(' ')

  const responsibilitySummary =
    node.responsibilities.length > 0 ? `担当: ${node.responsibilities.join(' / ')}` : '担当: 未設定'

  return (
    <li className={styles.nodeItem}>
      <div className={cardClassName} data-depth={depth}>
        <div className={styles.cardGlow} />

        <div className={styles.identityRow}>
          <div className={styles.avatar}>{getMemberInitials(node.member.name)}</div>

          <div className={styles.identityMain}>
            <div className={styles.memberNameRow}>
              <span className={styles.memberName}>{node.member.name}</span>
              {isRoot ? <span className={styles.rootBadge}>ROOT</span> : null}
            </div>

            <div className={styles.memberMeta}>
              <span>{node.member.departmentName}</span>
              <span>{node.member.role}</span>
              <span>ID: {node.member.id}</span>
            </div>
          </div>

          <div className={styles.reportStat} aria-label={`直属メンバー ${node.children.length} 名`}>
            <span className={styles.reportStatValue}>{node.children.length}</span>
            <span className={styles.reportStatLabel}>Direct</span>
          </div>
        </div>

        <div className={styles.responsibilitySummary}>{responsibilitySummary}</div>

        <div className={styles.tagList}>
          {node.responsibilities.length > 0 ? (
            node.responsibilities.map((responsibility) => (
              <span key={`${node.member.id}-${responsibility}`} className={styles.tag}>
                {responsibility}
              </span>
            ))
          ) : (
            <span className={styles.emptyTag}>責務未設定</span>
          )}
        </div>
      </div>

      {node.children.length > 0 ? (
        <ul className={styles.childList}>
          {node.children.map((child) => (
            <MemberTreeNodeView key={child.member.id} depth={depth + 1} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface MemberTreeProps {
  members: Member[]
  assignments: TreeAssignment[]
  rootMemberId: string
}

export function MemberTree({ members, assignments, rootMemberId }: MemberTreeProps) {
  const memberIds = new Set(
    assignments
      .flatMap((assignment) => [assignment.memberId, assignment.reportsToMemberId ?? undefined])
      .filter((memberId): memberId is string => Boolean(memberId))
      .concat(rootMemberId),
  )
  const relevantMembers = members.filter((member) => memberIds.has(member.id))
  const tree = buildTree(relevantMembers, assignments, rootMemberId)

  if (tree.length === 0) {
    return <p className={styles.emptyText}>体制メンバーが設定されていません。</p>
  }

  return (
    <div className={styles.treeWrap} data-testid="member-tree">
      <ul className={styles.rootList}>
        {tree.map((node) => (
          <MemberTreeNodeView key={node.member.id} isRoot={node.member.id === rootMemberId} node={node} />
        ))}
      </ul>
    </div>
  )
}
