import { EditableMetaCard } from './ProjectDetailMetaCard'
import { getCurrentPhaseCardClassName } from './ProjectDetailMetaCardUtils'
import type { CurrentPhaseCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function CurrentPhaseCard({
  changed,
  currentPhase,
  draftId,
  error,
  isEditing,
  isSaving,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
  projectPhases,
}: CurrentPhaseCardProps) {
  return (
    <EditableMetaCard
      className={[styles.metaCardStandard, styles.metaCardCurrentPhase, getCurrentPhaseCardClassName(currentPhase)]
        .filter(Boolean)
        .join(' ')}
      cancelButtonTestId="current-phase-cancel-button"
      displayContent={
        <strong className={styles.metaValue} data-testid="current-phase-value">
          {currentPhase?.name ?? '未設定'}
        </strong>
      }
      editButtonTestId="current-phase-edit-button"
      editContent={
        <label className={styles.formField}>
          <span className={styles.visuallyHidden}>現在フェーズ</span>
          <select
            aria-label="現在フェーズ"
            className={styles.selectInput}
            data-testid="current-phase-select"
            onChange={(event) => onDraftChange(event.target.value)}
            value={draftId}
          >
            <option value="">選択してください</option>
            {projectPhases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name}
              </option>
            ))}
          </select>
        </label>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="現在フェーズ"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="current-phase-save-button"
      testId="current-phase-card"
    />
  )
}
