import { MemberTree } from '../../components/MemberTree'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Member, ProjectAssignment } from '../../types/project'
import type { StructureAssignmentDraft } from './projectDetailTypes'
import styles from '../ProjectDetailPage.module.css'

interface ProjectStructureSectionProps {
  members: Member[]
  projectAssignments: ProjectAssignment[]
  pmMemberId: string
  isEditing: boolean
  structurePmMemberId: string
  structureAssignments: StructureAssignmentDraft[]
  responsibilityOptions: string[]
  structureError: string | null
  isSavingStructure: boolean
  structureChanged: boolean
  onOpen: () => void
  onClose: () => void
  onStructurePmChange: (memberId: string) => void
  onAddAssignment: () => void
  onUpdateAssignment: (index: number, patch: Partial<StructureAssignmentDraft>) => void
  onRemoveAssignment: (index: number) => void
  onSave: () => void
}

export function ProjectStructureSection({
  members,
  projectAssignments,
  pmMemberId,
  isEditing,
  structurePmMemberId,
  structureAssignments,
  responsibilityOptions,
  structureError,
  isSavingStructure,
  structureChanged,
  onOpen,
  onClose,
  onStructurePmChange,
  onAddAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  onSave,
}: ProjectStructureSectionProps) {
  return (
    <Panel className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>プロジェクト体制</h2>
          <p className={styles.sectionDescription}>
            PM と各役割の担当者を確認できます。必要なときだけ編集フォームを開いて更新します。
          </p>
        </div>
        {isEditing ? (
          <Button
            data-testid="structure-edit-toggle"
            onClick={onClose}
            size="small"
            variant="secondary"
          >
            編集を閉じる
          </Button>
        ) : (
          <Button
            data-testid="structure-edit-toggle"
            onClick={onOpen}
            size="small"
            variant="secondary"
          >
            編集
          </Button>
        )}
      </div>

      {isEditing ? (
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
                <p className={styles.emptyText}>役割担当はまだ登録されていません。</p>
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

                  <Button
                    onClick={() => onRemoveAssignment(index)}
                    size="small"
                    variant="danger"
                  >
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
      ) : null}

      <div className={styles.treeSection}>
        <MemberTree members={members} pmMemberId={pmMemberId} projectAssignments={projectAssignments} />
      </div>
    </Panel>
  )
}
