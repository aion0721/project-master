import { SearchSelect } from '../../components/ui/SearchSelect'
import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectSystemCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectSystemCard({
  availableSystems,
  changed,
  draftSystemIds,
  error,
  isEditing,
  isSaving,
  onCancel,
  onEdit,
  onSave,
  onSystemChange,
  project,
}: ProjectSystemCardProps) {
  const selectedSystems = availableSystems.filter((system) =>
    (project.relatedSystemIds ?? []).includes(system.id),
  )

  return (
    <EditableMetaCard
      className={styles.metaCardStandard}
      cancelButtonTestId="project-systems-cancel-button"
      displayContent={
        selectedSystems.length > 0 ? (
          <strong className={styles.metaValue} data-testid="project-system-value">
            {selectedSystems[0]?.id} / {selectedSystems[0]?.name}
          </strong>
        ) : (
          <strong className={styles.metaValue} data-testid="project-system-empty">
            未設定
          </strong>
        )
      }
      editButtonTestId="project-systems-edit-button"
      editContent={
        <div className={styles.systemSelectionList}>
          {availableSystems.length > 0 ? (
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>主システム</span>
              <SearchSelect
                ariaLabel="主システム"
                className={styles.selectInput}
                dataTestId="project-system-select"
                onChange={onSystemChange}
                options={availableSystems.map((system) => ({
                  value: system.id,
                  label: `${system.id} / ${system.name}`,
                  keywords: [system.name, system.category],
                }))}
                placeholder="システムを検索"
                value={draftSystemIds[0] ?? ''}
              />
            </label>
          ) : (
            <p className={styles.emptyText}>選択可能なシステムがありません。</p>
          )}
        </div>
      }
      error={error}
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="主システム"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-systems-save-button"
    />
  )
}
