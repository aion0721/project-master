import type { Member, ProjectAssignment } from '../types/project'
import { getResponsibilitiesForMember } from '../utils/projectUtils'
import styles from './MemberTree.module.css'

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
  projectAssignments: ProjectAssignment[],
  pmMemberId: string,
) {
  const memberIdSet = new Set(relevantMembers.map((member) => member.id))
  const childrenByManager = new Map<string | null, Member[]>()
  const managerByMemberId = new Map<string, string | null>()

  projectAssignments.forEach((assignment) => {
    if (assignment.memberId === pmMemberId) {
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

  managerByMemberId.set(pmMemberId, null)

  relevantMembers.forEach((member) => {
    const managerKey = managerByMemberId.get(member.id) ?? null
    const bucket = childrenByManager.get(managerKey) ?? []
    bucket.push(member)
    childrenByManager.set(managerKey, bucket)
  })

  const sortMembers = (entries: Member[]) =>
    [...entries].sort((left, right) => {
      if (left.id === pmMemberId) {
        return -1
      }

      if (right.id === pmMemberId) {
        return 1
      }

      return left.name.localeCompare(right.name, 'ja')
    })

  const makeNode = (member: Member): MemberNode => ({
    member,
    responsibilities: sortResponsibilities(getResponsibilitiesForMember(projectAssignments, member.id)),
    children: sortMembers(childrenByManager.get(member.id) ?? []).map(makeNode),
  })

  return sortMembers(childrenByManager.get(null) ?? []).map(makeNode)
}

function MemberTreeNodeView({ node }: { node: MemberNode }) {
  return (
    <li className={styles.nodeItem}>
      <div className={styles.nodeCard}>
        <div className={styles.nodeHeader}>
          <span className={styles.memberName}>{node.member.name}</span>
          <span className={styles.memberRole}>{node.member.role}</span>
        </div>

        <div className={styles.tagList}>
          {node.responsibilities.map((responsibility) => (
            <span key={`${node.member.id}-${responsibility}`} className={styles.tag}>
              {responsibility}
            </span>
          ))}
        </div>
      </div>

      {node.children.length > 0 ? (
        <ul className={styles.childList}>
          {node.children.map((child) => (
            <MemberTreeNodeView key={child.member.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

interface MemberTreeProps {
  members: Member[]
  projectAssignments: ProjectAssignment[]
  pmMemberId: string
}

export function MemberTree({ members, projectAssignments, pmMemberId }: MemberTreeProps) {
  const memberIds = new Set(
    projectAssignments
      .flatMap((assignment) => [assignment.memberId, assignment.reportsToMemberId ?? undefined])
      .filter((memberId): memberId is string => Boolean(memberId))
      .concat(pmMemberId),
  )
  const relevantMembers = members.filter((member) => memberIds.has(member.id))
  const tree = buildTree(relevantMembers, projectAssignments, pmMemberId)

  return (
    <ul className={styles.rootList}>
      {tree.map((node) => (
        <MemberTreeNodeView key={node.member.id} node={node} />
      ))}
    </ul>
  )
}
