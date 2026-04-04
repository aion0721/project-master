import { Button } from '../../components/ui/Button'
import type { Member } from '../../types/project'
import type { StructureAssignmentDraft } from './projectDetailTypes'
import { getStructureReportingOptions } from './projectStructureUtils'
import styles from '../ProjectDetailPage.module.css'

interface ProjectStructureEditorProps {
  members: Member[]
  onAddAssignment: () => void
  onClose: () => void
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
  members,
  onAddAssignment,
  onClose,
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

  return (
    <div className={styles.structureEditor} data-testid="structure-editor">
      <label className={styles.formField}>
        <span className={styles.formLabel}>PM</span>
        <select
          aria-label="PMを選択"
          className={styles.selectInput}
          data-testid="structure-pm-select"
          onChange={(event) => onStructurePmChange(event.target.value)}
          value={structurePmMemberId}
        >
          <option value="">選択してください</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.role})
            </option>
          ))}
        </select>
      </label>

      <div className={styles.assignmentEditor}>
        <div className={styles.assignmentHeader}>
          <h3 className={styles.assignmentTitle}>役割一覧</h3>
          <Button onClick={onAddAssignment} size="small" variant="secondary">
            役割を追加
          </Button>
        </div>

        <div className={styles.assignmentList}>
          {structureAssignments.length === 0 ? (
            <p className={styles.emptyText}>役割情報はまだ登録されていません。</p>
          ) : null}

          {structureAssignments.map((assignment, index) => (
            <div key={assignment.id ?? `new-${index}`} className={styles.assignmentRow}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>責務</span>
                <select
                  aria-label={`役割${index + 1} の責務`}
                  className={styles.selectInput}
                  onChange={(event) => {
                    onUpdateAssignment(index, { responsibility: event.target.value })
                  }}
                  value={assignment.responsibility}
                >
                  {responsibilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formField}>
                <span className={styles.formLabel}>担当者</span>
                <select
                  aria-label={`役割${index + 1} の担当者`}
                  className={styles.selectInput}
                  onChange={(event) => {
                    onUpdateAssignment(index, { memberId: event.target.value })
                  }}
                  value={assignment.memberId}
                >
                  <option value="">選択してください</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formField}>
                <span className={styles.formLabel}>上位メンバー</span>
                <select
                  aria-label={`役割${index + 1} の上位メンバー`}
                  className={styles.selectInput}
                  data-testid={`structure-reports-to-${index}`}
                  onChange={(event) => {
                    onUpdateAssignment(index, { reportsToMemberId: event.target.value })
                  }}
                  value={assignment.reportsToMemberId}
                >
                  <option value="">未設定</option>
                  {reportingOptions
                    .filter((member) => member.id !== assignment.memberId)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                </select>
              </label>

              <Button onClick={() => onRemoveAssignment(index)} size="small" variant="danger">
                削除
              </Button>
            </div>
          ))}
        </div>
      </div>

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
