import { LinkTargetEditorList } from '../../components/LinkTargetEditorList'
import { LinkTargetList } from '../../components/LinkTargetList'
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
      className={`${styles.metaCardStandard} ${styles.metaCardSupport}`}
      cancelButtonTestId="project-links-cancel-button"
      displayClassName={styles.projectLinksDisplay}
      displayContent={
        <LinkTargetList
          emptyContent={
          <strong className={styles.metaValue} data-testid="project-link-empty">
            未設定
          </strong>
          }
          linkClassName={styles.externalLink}
          links={project.projectLinks}
          listClassName={styles.projectLinksList}
          rowClassName={styles.projectLinkDisplayRow}
          testIdPrefix="project-link"
          valueClassName={styles.metaValue}
        />
      }
      editButtonTestId="project-links-edit-button"
      editContent={
        <>
          <div className={styles.projectLinksHeader}>
            <span className={styles.metaHelperText}>
              リンク名と URL またはネットワークパスをセットで入力します。
            </span>
            <Button onClick={onAdd} size="small" variant="secondary">
              追加
            </Button>
          </div>
          <LinkTargetEditorList
            fieldWrapperClassName={styles.formField}
            labelFieldAriaLabel={(index) => `案件リンク名 ${index + 1}`}
            labelFieldLabel={(index) => `案件リンク名 ${index + 1}`}
            labelInputClassName={styles.selectInput}
            labelInputPlaceholder="リンク名"
            labelTestIdPrefix="project-link-label"
            links={draft}
            listClassName={styles.projectLinksEditorList}
            onChange={onDraftChange}
            onRemove={onRemove}
            removeButtonTestIdPrefix="project-link-remove"
            rowClassName={styles.projectLinkEditorRow}
            urlFieldAriaLabel={(index) => `案件リンクURLまたはネットワークパス ${index + 1}`}
            urlFieldLabel={(index) => `案件リンクURLまたはネットワークパス ${index + 1}`}
            urlInputClassName={styles.selectInput}
            urlInputPlaceholder="https://example.com/projects/PRJ-001 または \\\\sample-server\\share"
            urlTestIdPrefix="project-link-url"
            visuallyHiddenClassName={styles.visuallyHidden}
          />
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
