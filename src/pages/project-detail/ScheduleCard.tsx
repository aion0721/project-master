import { formatPeriod } from '../../utils/projectUtils'
import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ScheduleCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ScheduleCard({
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
}: ScheduleCardProps) {
  return (
    <EditableMetaCard
      className={styles.metaCardStandard}
      cancelButtonTestId="project-schedule-cancel-button"
      displayContent={
        <strong className={styles.metaValue} data-testid="project-schedule-value">
          {formatPeriod(project.startDate, project.endDate)}
        </strong>
      }
      editButtonTestId="project-schedule-edit-button"
      editContent={
        <>
          <label className={styles.formField}>
            <span className={styles.visuallyHidden}>開始日</span>
            <input
              aria-label="開始日"
              className={styles.selectInput}
              data-testid="project-schedule-start"
              onChange={(event) => onDraftChange({ startDate: event.target.value })}
              type="date"
              value={draft.startDate}
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.visuallyHidden}>終了日</span>
            <input
              aria-label="終了日"
              className={styles.selectInput}
              data-testid="project-schedule-end"
              onChange={(event) => onDraftChange({ endDate: event.target.value })}
              type="date"
              value={draft.endDate}
            />
          </label>
        </>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="期間"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-schedule-save-button"
    />
  )
}
