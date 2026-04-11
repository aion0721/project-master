import type { Member } from '../types/project'
import {
  buildMemberHierarchyForest,
  getMemberRoleTone,
  type MemberHierarchyNode,
} from '../utils/memberHierarchyUtils'
import styles from './MemberHierarchyTree.module.css'

function getMemberInitials(name: string) {
  const normalized = name.replace(/\s+/g, '')

  if (normalized.length <= 2) {
    return normalized
  }

  return normalized.slice(0, 2)
}

function getRoleToneClass(role: string) {
  const tone = getMemberRoleTone(role)

  if (tone === 'executive') {
    return styles.toneExecutive
  }

  if (tone === 'lead') {
    return styles.toneLead
  }

  if (tone === 'quality') {
    return styles.toneQuality
  }

  if (tone === 'platform') {
    return styles.tonePlatform
  }

  return styles.toneDefault
}

function MemberHierarchyNodeView({ node, depth = 0 }: { node: MemberHierarchyNode; depth?: number }) {
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
  const forest = buildMemberHierarchyForest(members, selectedMemberId)

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
