import { EditableMetaCard } from './ProjectDetailMetaCard'
import { getProjectStatusCardClassName } from './ProjectDetailMetaCardUtils'
import type { ProjectStatusCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectStatusCard({
  bulkApplyEnabled,
  changed,
  draft,
  error,
  isEditing,
  isSaving,
  onBulkApplyChange,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
  project,
}: ProjectStatusCardProps) {
  return (
    <EditableMetaCard
      className={[styles.metaCardStandard, styles.metaCardProjectStatus, getProjectStatusCardClassName(project.status)]
        .filter(Boolean)
        .join(' ')}
      cancelButtonTestId="project-status-override-cancel-button"
      displayContent={
        <div className={styles.projectStatusDisplay}>
          <strong className={styles.metaValue} data-testid="project-status-value">
            {project.status}
          </strong>
          <span className={styles.metaHelperText} data-testid="project-status-mode">
            {project.statusOverride ? '手動上書き' : '自動判定'}
          </span>
        </div>
      }
      editButtonTestId="project-status-edit-button"
      editContent={
        <>
          <label className={styles.formField}>
            <span className={styles.visuallyHidden}>案件状態</span>
            <select
              aria-label="案件状態"
              className={styles.selectInput}
              data-testid="project-status-override-select"
              onChange={(event) => onDraftChange(event.target.value ? event.target.value as typeof draft : null)}
              value={draft ?? ''}
            >
              <option value="">自動</option>
              <option value="未着手">未着手</option>
              <option value="進行中">進行中</option>
              <option value="完了">完了</option>
              <option value="遅延">遅延</option>
              <option value="中止">中止</option>
            </select>
          </label>
          {draft === '未着手' || draft === '完了' ? (
            <label className={styles.statusSyncOption}>
              <input
                checked={bulkApplyEnabled}
                data-testid="project-status-apply-all-phases"
                onChange={(event) => onBulkApplyChange(event.target.checked)}
                type="checkbox"
              />
              <span>
                この状態を全フェーズへ反映
                <span className={styles.statusSyncHint}>
                  {draft === '完了'
                    ? '全フェーズを完了 / 進捗100%にします。'
                    : '全フェーズを未着手 / 進捗0%にします。'}
                </span>
              </span>
            </label>
          ) : null}
        </>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !(changed || bulkApplyEnabled)}
      isSaving={isSaving}
      label="案件状態"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-status-override-save-button"
      testId="project-status-card"
    />
  )
}
