import { Button } from '../../components/ui/Button'
import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectLinksCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectLinksCard({
  changed,
  draft,
  error,
  isEditing,
  isSaving,
  onAdd,
  onCancel,
  onDraftChange,
  onEdit,
  onRemove,
  onSave,
  project,
}: ProjectLinksCardProps) {
  return (
    <EditableMetaCard
      className={`${styles.metaCardTwoColumn} ${styles.metaCardSupport}`}
      cancelButtonTestId="project-links-cancel-button"
      displayClassName={styles.projectLinksDisplay}
      displayContent={
        project.projectLinks.length > 0 ? (
          <div className={styles.projectLinksList}>
            {project.projectLinks.map((link, index) => (
              <a
                key={`${link.label}-${link.url}-${index}`}
                className={styles.externalLink}
                data-testid={`project-link-anchor-${index}`}
                href={link.url}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : (
          <strong className={styles.metaValue} data-testid="project-link-empty">
            未設定
          </strong>
        )
      }
      editButtonTestId="project-links-edit-button"
      editContent={
        <>
          <div className={styles.projectLinksHeader}>
            <span className={styles.metaHelperText}>リンク名と URL をセットで入力します。</span>
            <Button onClick={onAdd} size="small" variant="secondary">
              追加
            </Button>
          </div>
          <div className={styles.projectLinksEditorList}>
            {draft.map((link, index) => (
              <div key={`project-link-draft-${index}`} className={styles.projectLinkEditorRow}>
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>案件リンク名 {index + 1}</span>
                  <input
                    aria-label={`案件リンク名 ${index + 1}`}
                    className={styles.selectInput}
                    data-testid={`project-link-label-${index}`}
                    onChange={(event) => onDraftChange(index, { label: event.target.value })}
                    placeholder="リンク名"
                    value={link.label}
                  />
                </label>
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>案件リンクURL {index + 1}</span>
                  <input
                    aria-label={`案件リンクURL ${index + 1}`}
                    className={styles.selectInput}
                    data-testid={`project-link-url-${index}`}
                    onChange={(event) => onDraftChange(index, { url: event.target.value })}
                    placeholder="https://example.com/projects/PRJ-001"
                    type="url"
                    value={link.url}
                  />
                </label>
                <Button
                  data-testid={`project-link-remove-${index}`}
                  onClick={() => onRemove(index)}
                  size="small"
                  variant="danger"
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="案件リンク"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-links-save-button"
    />
  )
}
