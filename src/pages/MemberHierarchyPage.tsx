import { useMemo, useState } from 'react'
import { MemberHierarchyTree } from '../components/MemberHierarchyTree'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import formStyles from '../styles/form.module.css'
import pageStyles from '../styles/page.module.css'
import styles from './MemberHierarchyPage.module.css'

export function MemberHierarchyPage() {
  const { members, isLoading, error } = useProjectData()
  const [selectedMemberId, setSelectedMemberId] = useState('')

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [members],
  )
  const activeMemberId =
    selectedMemberId && sortedMembers.some((member) => member.id === selectedMemberId)
      ? selectedMemberId
      : (sortedMembers[0]?.id ?? '')

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
        <p className={pageStyles.eyebrow}>Organization View</p>
        <h1 className={pageStyles.title}>メンバー体制図</h1>
        <p className={pageStyles.description}>
          メンバーを 1 人選ぶと、その人までの上位系統と配下メンバーを組織ツリーで表示します。
        </p>
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
              onChange={(event) => setSelectedMemberId(event.target.value)}
              value={activeMemberId}
            >
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>

          <MemberHierarchyTree members={sortedMembers} selectedMemberId={activeMemberId} />
        </div>
      </Panel>
    </div>
  )
}
