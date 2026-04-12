import { Button } from '../../components/ui/Button'
import { SearchSelect } from '../../components/ui/SearchSelect'
import type { Member } from '../../types/project'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import type { StructureAssignmentDraft } from './projectDetailTypes'
import { getStructureReportingOptions } from './projectStructureUtils'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectStructureEditorProps {
  canCopyFromSystem: boolean
  copySourceSystemName?: string | null
  members: Member[]
  onAddAssignment: () => void
  onClose: () => void
  onCopyFromSystem: () => void
  onRemoveAssignment: (index: number) => void
  onSave: () => void
  onStructurePmChange: (memberId: string) => void
  onUpdateAssignment: (index: number, patch: Partial<StructureAssignmentDraft>) => void
  responsibilityOptions: string[]
  structureAssignments: StructureAssignmentDraft[]
  structureChanged: boolean
  structureError: string | null
  structurePmMemberId: string
  isSavingStructure: boolean
}

export function ProjectStructureEditor({
  canCopyFromSystem,
  copySourceSystemName = null,
  members,
  onAddAssignment,
  onClose,
  onCopyFromSystem,
  onRemoveAssignment,
  onSave,
  onStructurePmChange,
  onUpdateAssignment,
  responsibilityOptions,
  structureAssignments,
  structureChanged,
  structureError,
  structurePmMemberId,
  isSavingStructure,
}: ProjectStructureEditorProps) {
  const reportingOptions = getStructureReportingOptions(
    members,
    structurePmMemberId,
    structureAssignments,
  )
  const responsibilityListId = 'project-structure-responsibilities'
  const memberOptions = members.map((member) => ({
    value: member.id,
    label: formatMemberShortLabel(member),
    keywords: [member.name, member.departmentName, member.role],
  }))

  return (
    <div className={styles.structureEditor} data-testid="structure-editor">
      <label className={styles.formField}>
        <span className={styles.formLabel}>PM</span>
        <SearchSelect
          ariaLabel="PM"
          className={styles.selectInput}
          dataTestId="structure-pm-select"
          onChange={onStructurePmChange}
          options={memberOptions}
          placeholder="メンバーを検索"
          value={structurePmMemberId}
        />
      </label>

      <div className={styles.assignmentEditor}>
        <div className={styles.assignmentHeader}>
          <h3 className={styles.assignmentTitle}>プロジェクト体制</h3>
          <div className={styles.phaseHeaderActions}>
            <Button
              data-testid="structure-copy-from-system-button"
              disabled={!canCopyFromSystem}
              onClick={onCopyFromSystem}
              size="small"
              variant="secondary"
            >
              {copySourceSystemName ? `${copySourceSystemName} からコピー` : 'システム体制からコピー'}
            </Button>
            <Button onClick={onAddAssignment} size="small" variant="secondary">
              追加
            </Button>
          </div>
        </div>
        {!canCopyFromSystem ? (
          <p className={styles.emptyText}>主システムが未設定のため、システム体制コピーは利用できません。</p>
        ) : null}

        <div className={styles.assignmentList}>
          {structureAssignments.length === 0 ? (
            <p className={styles.emptyText}>担当はまだ登録されていません。</p>
          ) : null}

          {structureAssignments.map((assignment, index) => {
            const assignableReportingOptions = reportingOptions
              .filter((member) => member.id !== assignment.memberId)
              .map((member) => ({
                value: member.id,
                label: formatMemberShortLabel(member),
              }))

            return (
              <div key={assignment.id ?? `new-${index}`} className={styles.assignmentRow}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>役割</span>
                  <input
                    aria-label={`体制 ${index + 1} の役割`}
                    className={styles.selectInput}
                    data-testid={`structure-responsibility-${index}`}
                    list={responsibilityListId}
                    onChange={(event) => {
                      onUpdateAssignment(index, { responsibility: event.target.value })
                    }}
                    value={assignment.responsibility}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>担当者</span>
                  <SearchSelect
                    ariaLabel={`体制 ${index + 1} の担当者`}
                    className={styles.selectInput}
                    onChange={(memberId) => {
                      onUpdateAssignment(index, { memberId })
                    }}
                    options={memberOptions}
                    placeholder="メンバーを検索"
                    value={assignment.memberId}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>報告先</span>
                  <SearchSelect
                    ariaLabel={`体制 ${index + 1} の報告先`}
                    className={styles.selectInput}
                    dataTestId={`structure-reports-to-${index}`}
                    onChange={(reportsToMemberId) => {
                      onUpdateAssignment(index, { reportsToMemberId })
                    }}
                    options={assignableReportingOptions}
                    placeholder="メンバーを検索"
                    value={assignment.reportsToMemberId}
                  />
                </label>

                <Button onClick={() => onRemoveAssignment(index)} size="small" variant="danger">
                  削除
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <datalist id={responsibilityListId}>
        {responsibilityOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      {structureError ? <p className={styles.sectionError}>{structureError}</p> : null}

      <div className={styles.structureActions}>
        <Button onClick={onClose} size="small" variant="secondary">
          キャンセル
        </Button>
        <Button
          data-testid="structure-save-button"
          disabled={isSavingStructure || !structureChanged}
          onClick={onSave}
          size="small"
        >
          {isSavingStructure ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
