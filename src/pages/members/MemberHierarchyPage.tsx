import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EntityIcon } from '../../components/EntityIcon'
import { MemberHierarchyTree } from '../../components/MemberHierarchyTree'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import type { Member } from '../../types/project'
import formStyles from '../../styles/form.module.css'
import pageStyles from '../../styles/page.module.css'
import styles from './MemberHierarchyPage.module.css'

type HierarchyViewMode = 'tree' | 'pyramid'

interface MemberLevelCardProps {
  member: Member
  isSelected: boolean
  isPathNode: boolean
}

interface HierarchyGroup {
  member: Member
  children: HierarchyGroup[]
}

function renderMemberLevelCard({ member, isSelected, isPathNode }: MemberLevelCardProps) {
  return (
    <article
      className={[
        styles.levelCard,
        isSelected ? styles.selectedCard : '',
        isPathNode ? styles.pathCard : '',
      ]
        .filter(Boolean)
        .join(' ')}
      key={member.id}
    >
      <div className={styles.levelCardHeader}>
        <div className={styles.memberNameRow}>
          <span className={styles.memberName}>{member.name}</span>
          {isSelected ? <span className={styles.selectedBadge}>選択中</span> : null}
        </div>
        <div className={styles.memberMeta}>
          <span>{member.id}</span>
          <span>{member.departmentName}</span>
          <span>{member.role}</span>
        </div>
      </div>
    </article>
  )
}

function renderHierarchyGroup(group: HierarchyGroup, selectedMemberId: string) {
  return (
    <div className={styles.groupNode} data-testid={`member-hierarchy-group-${group.member.id}`} key={group.member.id}>
      {renderMemberLevelCard({
        member: group.member,
        isSelected: group.member.id === selectedMemberId,
        isPathNode: false,
      })}

      {group.children.length > 0 ? (
        <div className={styles.groupChildrenSection}>
          <div aria-hidden="true" className={styles.groupConnector}>
            <span className={styles.groupConnectorLine} />
          </div>
          <div className={styles.groupChildrenRow}>
            {group.children.map((child) => renderHierarchyGroup(child, selectedMemberId))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function buildHierarchyLevels(members: Member[], selectedMemberId: string) {
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

  childrenByManagerId.forEach((bucket, managerId) => {
    childrenByManagerId.set(
      managerId,
      [...bucket].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    )
  })

  const lineage: Member[] = []
  let cursor: Member | undefined = selectedMember

  while (cursor) {
    lineage.unshift(cursor)
    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined
  }

  function buildHierarchyGroup(member: Member): HierarchyGroup {
    return {
      member,
      children: (childrenByManagerId.get(member.id) ?? []).map((child) => buildHierarchyGroup(child)),
    }
  }

  return {
    lineage,
    descendantGroups: (childrenByManagerId.get(selectedMember.id) ?? []).map((child) =>
      buildHierarchyGroup(child),
    ),
  }
}

export function MemberHierarchyPage() {
  const { members, isLoading, error } = useProjectData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<HierarchyViewMode>('tree')

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [members],
  )
  const requestedMemberId = searchParams.get('memberId') ?? ''
  const activeMemberId =
    requestedMemberId && sortedMembers.some((member) => member.id === requestedMemberId)
      ? requestedMemberId
      : (sortedMembers[0]?.id ?? '')
  const hierarchyLevels = useMemo(
    () => buildHierarchyLevels(sortedMembers, activeMemberId),
    [activeMemberId, sortedMembers],
  )

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>体制図を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>メンバー情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>体制図を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <Panel variant="hero">
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="member" />
          <div className={pageStyles.heroHeadingBody}>
            <p className={pageStyles.eyebrow}>Organization View</p>
            <h1 className={pageStyles.title}>メンバー体制図</h1>
            <p className={pageStyles.description}>
              メンバーを 1 人選ぶと、その人までの上位系統と配下メンバーを組織ツリーで表示します。
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>関係図</h2>
            <p className={pageStyles.sectionDescription}>
              `managerId` を使った組織上の上司・部下関係を表示します。案件体制とは別のビューです。
            </p>
          </div>
        </div>

        <div className={styles.hierarchySection}>
          <label className={formStyles.field}>
            <span className={formStyles.label}>対象メンバー</span>
            <select
              className={formStyles.control}
              data-testid="member-hierarchy-select"
              onChange={(event) => {
                setSearchParams(event.target.value ? { memberId: event.target.value } : {})
              }}
              value={activeMemberId}
            >
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>

          <div className={styles.viewToggle} role="group" aria-label="体制図の表示切替">
            <button
              aria-pressed={viewMode === 'tree'}
              className={[
                styles.viewToggleButton,
                viewMode === 'tree' ? styles.viewToggleButtonActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid="member-hierarchy-view-tree"
              onClick={() => setViewMode('tree')}
              type="button"
            >
              縦ツリー
            </button>
            <button
              aria-pressed={viewMode === 'pyramid'}
              className={[
                styles.viewToggleButton,
                viewMode === 'pyramid' ? styles.viewToggleButtonActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid="member-hierarchy-view-pyramid"
              onClick={() => setViewMode('pyramid')}
              type="button"
            >
              階層図
            </button>
          </div>

          {viewMode === 'tree' ? (
            <MemberHierarchyTree members={sortedMembers} selectedMemberId={activeMemberId} />
          ) : hierarchyLevels ? (
            <div className={styles.pyramidWrap} data-testid="member-hierarchy-pyramid">
              <div className={styles.pyramidLegend}>
                <span>上位系統から対象メンバー、配下の順に段表示します。</span>
              </div>

              <div className={styles.pyramidLevels}>
                {hierarchyLevels.lineage.map((member, index) => (
                  <div className={styles.levelRow} key={member.id}>
                    {renderMemberLevelCard({
                      member,
                      isSelected: member.id === activeMemberId,
                      isPathNode: true,
                    })}
                    {index < hierarchyLevels.lineage.length - 1 ? (
                      <div aria-hidden="true" className={styles.levelConnector}>
                        <span className={styles.levelConnectorLine} />
                        <span className={styles.levelConnectorArrow}>↓</span>
                      </div>
                    ) : null}
                  </div>
                ))}

                {hierarchyLevels.descendantGroups.length > 0 ? (
                  <div className={styles.descendantBlock}>
                    <div aria-hidden="true" className={styles.branchConnector}>
                      <span className={styles.branchConnectorLine} />
                    </div>
                    <div className={styles.descendantRow} data-testid="member-hierarchy-descendant-groups">
                      {hierarchyLevels.descendantGroups.map((group) =>
                        renderHierarchyGroup(group, activeMemberId),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className={styles.emptyText}>表示対象のメンバーを選択してください。</p>
          )}
        </div>
      </Panel>
    </div>
  )
}
