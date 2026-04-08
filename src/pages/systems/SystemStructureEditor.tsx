import { Button } from '../../components/ui/Button'
import type { Member } from '../../types/project'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import styles from './SystemDetailPage.module.css'

export interface SystemStructureDraft {
  id?: string
  memberId: string
  responsibility: string
  reportsToMemberId: string
}

interface SystemStructureEditorProps {
  members: Member[]
  ownerMemberId: string
  assignments: SystemStructureDraft[]
  changed: boolean
  error: string | null
  isSaving: boolean
  onOwnerChange: (memberId: string) => void
  onAddAssignment: () => void
  onUpdateAssignment: (index: number, patch: Partial<SystemStructureDraft>) => void
  onRemoveAssignment: (index: number) => void
  onClose: () => void
  onSave: () => void
}

function getReportingOptions(
  members: Member[],
  ownerMemberId: string,
  assignments: SystemStructureDraft[],
) {
  const availableIds = new Set<string>(
    [ownerMemberId, ...assignments.map((assignment) => assignment.memberId)].filter(Boolean),
  )

  return members.filter((member) => availableIds.has(member.id))
}

export function SystemStructureEditor({
  members,
  ownerMemberId,
  assignments,
  changed,
  error,
  isSaving,
  onOwnerChange,
  onAddAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  onClose,
  onSave,
}: SystemStructureEditorProps) {
  const reportingOptions = getReportingOptions(members, ownerMemberId, assignments)
  const responsibilityListId = 'system-structure-responsibilities'

  return (
    <div className={styles.structureEditor} data-testid="system-structure-editor">
      <label className={styles.formField}>
        <span className={styles.formLabel}>オーナー</span>
        <select
          aria-label="オーナーを選択"
          className={styles.input}
          data-testid="system-structure-owner-select"
          onChange={(event) => onOwnerChange(event.target.value)}
          value={ownerMemberId}
        >
          <option value="">選択してください</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {formatMemberShortLabel(member)}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.assignmentEditor}>
        <div className={styles.assignmentHeader}>
          <h3 className={styles.assignmentTitle}>体制メンバー</h3>
          <Button onClick={onAddAssignment} size="small" variant="secondary">
            追加
          </Button>
        </div>

        <div className={styles.assignmentList}>
          {assignments.length === 0 ? (
            <p className={styles.emptyText}>オーナー配下の体制メンバーはまだ登録されていません。</p>
          ) : null}

          {assignments.map((assignment, index) => (
            <div className={styles.assignmentRow} key={assignment.id ?? `system-assignment-${index}`}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>役割</span>
                <input
                  aria-label={`体制メンバー${index + 1}の役割`}
                  className={styles.input}
                  data-testid={`system-structure-responsibility-${index}`}
                  list={responsibilityListId}
                  onChange={(event) => onUpdateAssignment(index, { responsibility: event.target.value })}
                  value={assignment.responsibility}
                />
              </label>

              <label className={styles.formField}>
                <span className={styles.formLabel}>メンバー</span>
                <select
                  aria-label={`体制メンバー${index + 1}を選択`}
                  className={styles.input}
                  data-testid={`system-structure-member-${index}`}
                  onChange={(event) => onUpdateAssignment(index, { memberId: event.target.value })}
                  value={assignment.memberId}
                >
                  <option value="">選択してください</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {formatMemberShortLabel(member)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formField}>
                <span className={styles.formLabel}>報告先</span>
                <select
                  aria-label={`体制メンバー${index + 1}の報告先`}
                  className={styles.input}
                  data-testid={`system-structure-reports-to-${index}`}
                  onChange={(event) =>
                    onUpdateAssignment(index, { reportsToMemberId: event.target.value })
                  }
                  value={assignment.reportsToMemberId}
                >
                  <option value="">未設定</option>
                  {reportingOptions
                    .filter((member) => member.id !== assignment.memberId)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {formatMemberShortLabel(member)}
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

      <datalist id={responsibilityListId}>
        <option value="運用統括" />
        <option value="業務窓口" />
        <option value="基盤担当" />
        <option value="アプリ担当" />
        <option value="品質管理" />
        <option value="保守窓口" />
      </datalist>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.structureActions}>
        <Button onClick={onClose} size="small" variant="secondary">
          キャンセル
        </Button>
        <Button
          data-testid="system-structure-save-button"
          disabled={isSaving || !changed}
          onClick={onSave}
          size="small"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
