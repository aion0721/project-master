import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectStatusEntriesCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectStatusEntriesCard({
  changed,
  draft,
  error,
  isEditing,
  isSaving,
  onAdd,
  onCancel,
  onDraftChange,
  onEdit,
  onMove,
  onRemove,
  onSave,
  project,
}: ProjectStatusEntriesCardProps) {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const sortedStatusEntries = useMemo(() => {
    const entries = [...(project.statusEntries ?? [])]
    entries.sort((left, right) =>
      sortOrder === 'desc'
        ? right.date.localeCompare(left.date)
        : left.date.localeCompare(right.date),
    )
    return entries
  }, [project.statusEntries, sortOrder])

  return (
    <EditableMetaCard
      className={styles.metaCardWide}
      cancelButtonTestId="project-status-entries-cancel-button"
      displayClassName={styles.statusEntriesDisplay}
      displayContent={
        project.statusEntries && project.statusEntries.length > 0 ? (
          <>
            <div className={styles.statusEntriesToolbar}>
              <Button
                data-testid="project-status-entries-sort-button"
                onClick={() => setSortOrder((current) => (current === 'desc' ? 'asc' : 'desc'))}
                size="small"
                variant="secondary"
              >
                {sortOrder === 'desc' ? '日付: 新しい順' : '日付: 古い順'}
              </Button>
            </div>
            <div className={styles.statusEntriesList}>
              {sortedStatusEntries.map((entry, index) => (
                <div className={styles.statusEntryCard} key={`${entry.date}-${index}`}>
                  <span className={styles.statusEntryDate}>{entry.date}</span>
                  <strong className={styles.metaValue} data-testid={`project-status-entry-value-${index}`}>
                    {entry.content}
                  </strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <strong className={styles.metaValue} data-testid="project-status-entries-empty">
            未設定
          </strong>
        )
      }
      editButtonTestId="project-status-entries-edit-button"
      editContent={
        <div className={styles.statusEntryList}>
          {draft.map((entry, index) => (
            <div className={styles.statusEntryRow} key={`status-entry-${index}`}>
              <label className={styles.formField}>
                <span className={styles.visuallyHidden}>状況日付 {index + 1}</span>
                <input
                  aria-label={`状況日付 ${index + 1}`}
                  className={styles.selectInput}
                  data-testid={`project-status-entry-date-${index}`}
                  onChange={(event) => onDraftChange(index, { date: event.target.value })}
                  type="date"
                  value={entry.date}
                />
              </label>
              <label className={`${styles.formField} ${styles.statusEntryContentField}`}>
                <span className={styles.visuallyHidden}>状況内容 {index + 1}</span>
                <textarea
                  aria-label={`状況内容 ${index + 1}`}
                  className={`${styles.selectInput} ${styles.statusEntryContentInput}`}
                  data-testid={`project-status-entry-content-${index}`}
                  onChange={(event) => onDraftChange(index, { content: event.target.value })}
                  placeholder="状況の内容を入力してください"
                  value={entry.content}
                />
              </label>
              <div className={styles.statusEntryRowActions}>
                <Button
                  data-testid={`project-status-entry-move-up-${index}`}
                  disabled={index === 0}
                  onClick={() => onMove(index, 'up')}
                  size="small"
                  variant="secondary"
                >
                  上へ
                </Button>
                <Button
                  data-testid={`project-status-entry-move-down-${index}`}
                  disabled={index === draft.length - 1}
                  onClick={() => onMove(index, 'down')}
                  size="small"
                  variant="secondary"
                >
                  下へ
                </Button>
                <Button
                  data-testid={`project-status-entry-remove-${index}`}
                  onClick={() => onRemove(index)}
                  size="small"
                  variant="secondary"
                >
                  削除
                </Button>
              </div>
            </div>
          ))}
        </div>
      }
      error={error}
      extraActions={
        <Button data-testid="project-status-entry-add-button" onClick={onAdd} size="small" variant="secondary">
          行追加
        </Button>
      }
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="状況"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-status-entries-save-button"
    />
  )
}
