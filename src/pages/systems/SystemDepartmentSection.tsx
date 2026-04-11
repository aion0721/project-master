import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import pageStyles from '../../styles/page.module.css'
import type { ManagedSystem } from '../../types/project'
import { buildEditSystemForm, type SystemFormState } from './systemFormUtils'
import styles from './SystemDetailPage.module.css'

interface SystemDepartmentSectionProps {
  departmentOptions: string[]
  onSave: () => Promise<void>
  system: ManagedSystem
  systemForm: SystemFormState
  toggleSystemDepartmentName: (departmentName: string) => void
  updateSystemForm: (nextForm: SystemFormState) => void
}

export function SystemDepartmentSection({
  departmentOptions,
  onSave,
  system,
  systemForm,
  toggleSystemDepartmentName,
  updateSystemForm,
}: SystemDepartmentSectionProps) {
  const [isDepartmentEditing, setIsDepartmentEditing] = useState(false)
  const [departmentError, setDepartmentError] = useState<string | null>(null)
  const [isSavingDepartment, setIsSavingDepartment] = useState(false)

  useEffect(() => {
    setIsDepartmentEditing(false)
    setDepartmentError(null)
  }, [system])

  function handleCancel() {
    updateSystemForm(buildEditSystemForm(system))
    setIsDepartmentEditing(false)
    setDepartmentError(null)
  }

  async function handleSaveDepartments() {
    setDepartmentError(null)
    setIsSavingDepartment(true)

    try {
      await onSave()
      setIsDepartmentEditing(false)
    } catch (caughtError) {
      setDepartmentError(caughtError instanceof Error ? caughtError.message : '所管部署の保存に失敗しました。')
    } finally {
      setIsSavingDepartment(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>所管部署</h2>
          <p className={pageStyles.sectionDescription}>このシステムの所管部署をここから直接変更できます。</p>
        </div>
        {isDepartmentEditing ? (
          <div className={styles.headerActions}>
            <Button
              disabled={isSavingDepartment}
              onClick={() => void handleSaveDepartments()}
              size="small"
            >
              {isSavingDepartment ? '保存中...' : '保存'}
            </Button>
            <Button onClick={handleCancel} size="small" variant="secondary">
              キャンセル
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsDepartmentEditing(true)} size="small" variant="secondary">
            編集
          </Button>
        )}
      </div>
      {isDepartmentEditing ? (
        <div className={styles.systemEditor}>
          <div className={styles.checkboxGroup} data-testid="system-department-editor">
            {departmentOptions.map((departmentName) => (
              <label className={styles.checkboxItem} key={departmentName}>
                <input
                  checked={systemForm.departmentNames.includes(departmentName)}
                  data-testid={`system-detail-department-${departmentName}`}
                  onChange={() => toggleSystemDepartmentName(departmentName)}
                  type="checkbox"
                />
                <span>{departmentName}</span>
              </label>
            ))}
          </div>
          {departmentError ? <p className={styles.errorText}>{departmentError}</p> : null}
        </div>
      ) : (
        <div className={styles.departmentSummary}>
          {system.departmentNames && system.departmentNames.length > 0 ? (
            system.departmentNames.map((departmentName) => (
              <span className={styles.checkboxItem} key={`summary-${departmentName}`}>
                {departmentName}
              </span>
            ))
          ) : (
            <p className={styles.emptyText}>所管部署は未設定です。</p>
          )}
        </div>
      )}
    </Panel>
  )
}
