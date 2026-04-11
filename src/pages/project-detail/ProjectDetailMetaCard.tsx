import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import styles from '../projects/ProjectDetailPage.module.css'

interface MetaCardProps {
  children?: ReactNode
  className?: string
  label: string
  testId?: string
}

interface EditableMetaCardProps extends MetaCardProps {
  cancelButtonTestId?: string
  displayClassName?: string
  displayContent: ReactNode
  editClassName?: string
  editContent: ReactNode
  editButtonTestId: string
  error?: string | null
  extraActions?: ReactNode
  isEditing: boolean
  isSaving?: boolean
  isSaveDisabled?: boolean
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
  saveButtonTestId: string
}

export function MetaCard({ children, className, label, testId }: MetaCardProps) {
  return (
    <article
      className={className ? `${styles.metaCard} ${className}` : styles.metaCard}
      data-testid={testId}
    >
      <span className={styles.metaLabel}>{label}</span>
      {children}
    </article>
  )
}

export function EditableMetaCard({
  className,
  cancelButtonTestId,
  displayClassName = styles.phaseMetaDisplay,
  displayContent,
  editClassName = styles.phaseMetaEditor,
  editContent,
  editButtonTestId,
  error,
  extraActions,
  isEditing,
  isSaveDisabled = false,
  isSaving = false,
  label,
  onCancel,
  onEdit,
  onSave,
  saveButtonTestId,
  testId,
}: EditableMetaCardProps) {
  return (
    <MetaCard className={className} label={label} testId={testId}>
      {isEditing ? (
        <div className={editClassName}>
          {editContent}
          <div className={styles.phaseMetaActions}>
            {extraActions}
            <Button data-testid={saveButtonTestId} disabled={isSaveDisabled} onClick={onSave} size="small">
              {isSaving ? '保存中...' : '保存'}
            </Button>
            <Button data-testid={cancelButtonTestId} onClick={onCancel} size="small" variant="secondary">
              キャンセル
            </Button>
          </div>
          {error ? <p className={styles.metaError}>{error}</p> : null}
        </div>
      ) : (
        <div className={displayClassName}>
          {displayContent}
          <Button data-testid={editButtonTestId} onClick={onEdit} size="small" variant="secondary">
            編集
          </Button>
        </div>
      )}
    </MetaCard>
  )
}
