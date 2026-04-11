import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectSummaryCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectSummaryCard({
  changed,
  draft,
  error,
  isEditing,
  isSaving,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
  pmName,
  project,
}: ProjectSummaryCardProps) {
  return (
    <EditableMetaCard
      className={styles.metaCardStandard}
      cancelButtonTestId="project-summary-cancel-button"
      displayContent={
        <div className={styles.phaseMetaEditor}>
          <strong className={styles.metaValue} data-testid="project-summary-name-value">
            {project.name}
          </strong>
          <span className={styles.metaSubtle} data-testid="project-summary-number-value">
            {project.projectNumber}
          </span>
          <span className={styles.metaSubtle} data-testid="project-summary-pm-value">
            PM: {pmName ?? '未設定'}
          </span>
        </div>
      }
      editButtonTestId="project-summary-edit-button"
      editContent={
        <>
          <label className={styles.formField}>
            <span className={styles.formLabel}>プロジェクト番号</span>
            <input
              aria-label="プロジェクト番号"
              className={styles.selectInput}
              data-testid="project-summary-number"
              onChange={(event) => onDraftChange({ projectNumber: event.target.value })}
              type="text"
              value={draft.projectNumber}
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.formLabel}>プロジェクト名</span>
            <input
              aria-label="プロジェクト名"
              className={styles.selectInput}
              data-testid="project-summary-name"
              onChange={(event) => onDraftChange({ name: event.target.value })}
              type="text"
              value={draft.name}
            />
          </label>
        </>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="基本情報"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-summary-save-button"
    />
  )
}
