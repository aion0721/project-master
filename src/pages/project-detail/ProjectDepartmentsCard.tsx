import { SearchSelect } from '../../components/ui/SearchSelect'
import { Button } from '../../components/ui/Button'
import { EditableMetaCard } from './ProjectDetailMetaCard'
import type { ProjectDepartmentRole } from '../../types/project'
import type { ProjectDepartmentsCardProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

const departmentRoleOptions: ProjectDepartmentRole[] = ['主管', '実行', '支援', '利用']

export function ProjectDepartmentsCard({
  availableDepartments,
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
  projectDepartments,
}: ProjectDepartmentsCardProps) {
  const departmentOptions = availableDepartments.map((department) => ({
    value: department.departmentName,
    label: `${department.departmentName} (${department.departmentCode})`,
    keywords: [department.departmentCode],
  }))

  return (
    <EditableMetaCard
      className={`${styles.metaCardStandard} ${styles.metaCardSupport}`}
      cancelButtonTestId="project-departments-cancel-button"
      displayClassName={styles.phaseMetaEditor}
      displayContent={
        projectDepartments.length > 0 ? (
          <div className={styles.departmentSummaryList}>
            {projectDepartments.map((projectDepartment) => (
              <div
                className={styles.departmentSummaryItem}
                data-testid={`project-department-${projectDepartment.departmentName}`}
                key={projectDepartment.id}
              >
                <span className={styles.departmentRoleChip}>{projectDepartment.role}</span>
                <strong className={styles.metaValue}>
                  {projectDepartment.departmentName}（{projectDepartment.departmentCode}）
                </strong>
                {projectDepartment.note ? (
                  <span className={styles.metaSubtle}>{projectDepartment.note}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span className={styles.metaSubtle}>部署情報は未設定です。</span>
        )
      }
      editButtonTestId="project-departments-edit-button"
      editContent={
        <div className={styles.departmentEditorList}>
          {draft.map((projectDepartment, index) => (
            <div
              className={styles.departmentEditorCard}
              data-testid={`project-department-draft-${index}`}
              key={projectDepartment.key}
            >
              <div className={styles.departmentEditorRow}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>部署名</span>
                  <SearchSelect
                    ariaLabel="部署名"
                    className={styles.selectInput}
                    dataTestId={`project-department-name-${index}`}
                    emptyMessage="一致する部署がありません"
                    onChange={(value) => {
                      const matchedDepartment = availableDepartments.find(
                        (department) => department.departmentName === value,
                      )

                      onDraftChange(projectDepartment.key, {
                        departmentName: value,
                        departmentCode: matchedDepartment?.departmentCode ?? '',
                      })
                    }}
                    options={departmentOptions}
                    placeholder="部署名を検索"
                    value={projectDepartment.departmentName}
                  />
                </label>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>役割</span>
                  <select
                    className={styles.selectInput}
                    data-testid={`project-department-role-${index}`}
                    onChange={(event) =>
                      onDraftChange(projectDepartment.key, {
                        role: event.target.value as ProjectDepartmentRole,
                      })
                    }
                    value={projectDepartment.role}
                  >
                    {departmentRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <span className={styles.metaSubtle} data-testid={`project-department-code-${index}`}>
                部署コード: {projectDepartment.departmentCode || '未選択'}
              </span>
              <label className={styles.formField}>
                <span className={styles.formLabel}>メモ</span>
                <textarea
                  className={`${styles.selectInput} ${styles.departmentMemoInput}`}
                  data-testid={`project-department-note-${index}`}
                  onChange={(event) => onDraftChange(projectDepartment.key, { note: event.target.value })}
                  value={projectDepartment.note}
                />
              </label>
              <div className={styles.departmentEditorActions}>
                <Button
                  data-testid={`project-department-remove-${index}`}
                  onClick={() => onRemove(projectDepartment.key)}
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
        <Button data-testid="project-departments-add-button" onClick={onAdd} size="small" variant="secondary">
          部署を追加
        </Button>
      }
      isEditing={isEditing}
      isSaveDisabled={isSaving || !changed}
      isSaving={isSaving}
      label="関与部署"
      onCancel={onCancel}
      onEdit={onEdit}
      onSave={onSave}
      saveButtonTestId="project-departments-save-button"
      testId="project-departments-card"
    />
  )
}
