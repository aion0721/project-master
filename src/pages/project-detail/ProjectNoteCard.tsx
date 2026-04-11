import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectNoteCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectNoteCard({
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
}: ProjectNoteCardProps) {
  return (
    <EditableMetaCard
      className={`${styles.metaCardTwoColumn} ${styles.metaCardSupport}`}
      cancelButtonTestId="project-note-cancel-button"
      displayClassName={styles.projectNoteDisplay}
      displayContent={
        <strong className={styles.metaValue} data-testid="project-note-value">
          {project.note?.trim() || '未設定'}
        </strong>
      }
      editButtonTestId="project-note-edit-button"
      editContent={
        <label className={styles.formField}>
          <span className={styles.visuallyHidden}>メモ</span>
          <textarea
            aria-label="メモ"
            className={`${styles.selectInput} ${styles.memoInput}`}
            data-testid="project-note-input"
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="状況、課題、次回アクションを入力"
            value={draft}
          />
        </label>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="メモ"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-note-save-button"
    />
  )
}
