import { Button } from '../../components/ui/Button'
import { SearchSelect } from '../../components/ui/SearchSelect'
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
  const memberOptions = members.map((member) => ({
    value: member.id,
    label: formatMemberShortLabel(member),
    keywords: [member.name, member.departmentName, member.role],
  }))

  return (
    <div className={styles.structureEditor} data-testid="system-structure-editor">
      <label className={styles.formField}>
        <span className={styles.formLabel}>オーナー</span>
        <SearchSelect
          ariaLabel="オーナーを選択"
          className={styles.input}
          dataTestId="system-structure-owner-select"
          onChange={onOwnerChange}
          options={memberOptions}
          placeholder="メンバーを検索"
          value={ownerMemberId}
        />
      </label>

      <div className={styles.assignmentEditor}>
        <div className={styles.assignmentHeader}>
          <h3 className={styles.assignmentTitle}>担当メンバー</h3>
          <Button onClick={onAddAssignment} size="small" variant="secondary">
            追加
          </Button>
        </div>

        <div className={styles.assignmentList}>
          {assignments.length === 0 ? (
            <p className={styles.emptyText}>オーナー配下の担当メンバーはまだ登録されていません。</p>
          ) : null}

          {assignments.map((assignment, index) => {
            const assignableReportingOptions = reportingOptions
              .filter((member) => member.id !== assignment.memberId)
              .map((member) => ({
                value: member.id,
                label: formatMemberShortLabel(member),
              }))

            return (
              <div className={styles.assignmentRow} key={assignment.id ?? `system-assignment-${index}`}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>役割</span>
                  <input
                    aria-label={`担当メンバー ${index + 1} の役割`}
                    className={styles.input}
                    data-testid={`system-structure-responsibility-${index}`}
                    list={responsibilityListId}
                    onChange={(event) => onUpdateAssignment(index, { responsibility: event.target.value })}
                    value={assignment.responsibility}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>メンバー</span>
                  <SearchSelect
                    ariaLabel={`担当メンバー ${index + 1} を選択`}
                    className={styles.input}
                    dataTestId={`system-structure-member-${index}`}
                    onChange={(memberId) => onUpdateAssignment(index, { memberId })}
                    options={memberOptions}
                    placeholder="メンバーを検索"
                    value={assignment.memberId}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>報告先</span>
                  <SearchSelect
                    ariaLabel={`担当メンバー ${index + 1} の報告先`}
                    className={styles.input}
                    dataTestId={`system-structure-reports-to-${index}`}
                    onChange={(reportsToMemberId) =>
                      onUpdateAssignment(index, { reportsToMemberId })
                    }
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
        <option value="業務統括" />
        <option value="運用責任者" />
        <option value="開発担当" />
        <option value="アプリ担当" />
        <option value="基盤管理者" />
        <option value="監査対応" />
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
