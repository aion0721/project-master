import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectReportStatusCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectReportStatusCard({
  changed,
  draft,
  error,
  isEditing,
  isSaving,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
  project,
}: ProjectReportStatusCardProps) {
  return (
    <EditableMetaCard
      className={
        project.hasReportItems
          ? `${styles.metaCardStandard} ${styles.metaCardReport} ${styles.metaCardReportActive}`
          : `${styles.metaCardStandard} ${styles.metaCardReport}`
      }
      cancelButtonTestId="project-report-status-cancel-button"
      displayContent={
        <strong className={styles.metaValue} data-testid="project-report-status-value">
          {project.hasReportItems ? 'あり' : 'なし'}
        </strong>
      }
      editButtonTestId="project-report-status-edit-button"
      editContent={
        <label className={styles.formField}>
          <span className={styles.visuallyHidden}>報告事項の有無</span>
          <select
            aria-label="報告事項の有無"
            className={styles.selectInput}
            data-testid="project-report-status-select"
            onChange={(event) => onDraftChange(event.target.value === 'true')}
            value={String(draft)}
          >
            <option value="false">なし</option>
            <option value="true">あり</option>
          </select>
        </label>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="報告事項"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-report-status-save-button"
      testId="project-report-status-card"
    />
  )
}
