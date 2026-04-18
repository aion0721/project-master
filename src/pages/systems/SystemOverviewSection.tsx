import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import pageStyles from '../../styles/page.module.css'
import type { ManagedSystem, Member } from '../../types/project'
import { buildEditSystemForm, type SystemFormState } from './systemFormUtils'
import styles from './SystemDetailPage.module.css'

interface SystemOverviewSectionProps {
  members: Member[]
  onSave: () => Promise<void>
  structureAssignmentsCount: number
  system: ManagedSystem
  systemForm: SystemFormState
  updateSystemField: <Key extends keyof SystemFormState>(
    key: Key,
    value: SystemFormState[Key],
  ) => void
  updateSystemForm: (nextForm: SystemFormState) => void
}

export function SystemOverviewSection({
  members,
  onSave,
  structureAssignmentsCount,
  system,
  systemForm,
  updateSystemField,
  updateSystemForm,
}: SystemOverviewSectionProps) {
  const [isSystemEditing, setIsSystemEditing] = useState(false)
  const [systemError, setSystemError] = useState<string | null>(null)
  const [isSavingSystem, setIsSavingSystem] = useState(false)

  useEffect(() => {
    setIsSystemEditing(false)
    setSystemError(null)
  }, [system])

  function handleCancel() {
    updateSystemForm(buildEditSystemForm(system))
    setIsSystemEditing(false)
    setSystemError(null)
  }

  async function handleSaveSystem() {
    if (!systemForm.ownerMemberId.trim() && structureAssignmentsCount > 0) {
      setSystemError('システム体制があるため、オーナーを未設定にはできません。')
      return
    }

    setSystemError(null)
    setIsSavingSystem(true)

    try {
      await onSave()
      setIsSystemEditing(false)
    } catch (caughtError) {
      setSystemError(caughtError instanceof Error ? caughtError.message : 'システム基本情報の保存に失敗しました。')
    } finally {
      setIsSavingSystem(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>概要</h2>
          <p className={pageStyles.sectionDescription}>運用背景や補足メモを確認できます。</p>
        </div>
        {isSystemEditing ? (
          <div className={styles.headerActions}>
            <Button
              data-testid="system-overview-save-button"
              disabled={isSavingSystem}
              onClick={() => void handleSaveSystem()}
              size="small"
            >
              {isSavingSystem ? '保存中...' : '保存'}
            </Button>
            <Button onClick={handleCancel} size="small" variant="secondary">
              キャンセル
            </Button>
          </div>
        ) : (
          <Button
            data-testid="system-overview-edit-button"
            onClick={() => setIsSystemEditing(true)}
            size="small"
            variant="secondary"
          >
            編集
          </Button>
        )}
      </div>
      {isSystemEditing ? (
        <div className={styles.systemEditor}>
          <div className={styles.systemFormGrid}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>システムID</span>
              <input className={styles.input} disabled value={system.id} />
            </label>
            <label className={styles.formField}>
              <span className={styles.formLabel}>名称</span>
              <input
                className={styles.input}
                data-testid="system-detail-name-input"
                onChange={(event) => updateSystemField('name', event.target.value)}
                value={systemForm.name}
              />
            </label>
            <label className={styles.formField}>
              <span className={styles.formLabel}>カテゴリ</span>
              <input
                className={styles.input}
                data-testid="system-detail-category-input"
                onChange={(event) => updateSystemField('category', event.target.value)}
                value={systemForm.category}
              />
            </label>
            <label className={styles.formField}>
              <span className={styles.formLabel}>オーナー</span>
              <SearchSelect
                ariaLabel="システムオーナー"
                className={styles.input}
                dataTestId="system-detail-owner-select"
                onChange={(ownerMemberId) => updateSystemField('ownerMemberId', ownerMemberId)}
                options={members.map((member) => ({
                  value: member.id,
                  label: `${member.id} / ${member.name}`,
                  keywords: [member.name, member.departmentName, member.role],
                }))}
                placeholder="メンバーを検索"
                value={systemForm.ownerMemberId}
              />
            </label>
          </div>
          <label className={styles.formField}>
            <span className={styles.formLabel}>概要</span>
            <textarea
              className={`${styles.input} ${styles.systemTextarea}`}
              data-testid="system-detail-note-input"
              onChange={(event) => updateSystemField('note', event.target.value)}
              placeholder="用途や影響範囲を記載"
              value={systemForm.note}
            />
          </label>
          {systemError ? <p className={styles.errorText}>{systemError}</p> : null}
        </div>
      ) : (
        <p className={styles.noteText}>{system.note?.trim() || 'メモは未設定です。'}</p>
      )}
    </Panel>
  )
}
