import { useRef, useState } from 'react'
import type { Connection } from '@xyflow/react'
import { MemberTree } from '../../components/MemberTree'
import {
  ProjectStructureFlow,
  type ProjectStructureFlowHandle,
} from '../../components/ProjectStructureFlow'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Member, ProjectAssignment } from '../../types/project'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import type { StructureAssignmentDraft } from './projectDetailTypes'
import { ProjectStructureEditor } from './ProjectStructureEditor'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectStructureSectionProps {
  members: Member[]
  projectAssignments: ProjectAssignment[]
  pmMemberId: string
  copySourceSystemName?: string | null
  canCopyFromSystem?: boolean
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
  onAddAssignmentForMember: (memberId: string, responsibility?: string) => void
  onCopyFromSystem: () => void
  onRemoveAssignmentByMemberId: (memberId: string) => void
  onUpdateAssignmentByMemberId: (
    memberId: string,
    patch: Partial<StructureAssignmentDraft>,
  ) => void
}

export function ProjectStructureSection({
  members,
  projectAssignments,
  pmMemberId,
  copySourceSystemName = null,
  canCopyFromSystem = false,
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
  onAddAssignmentForMember,
  onCopyFromSystem,
  onRemoveAssignmentByMemberId,
  onUpdateAssignmentByMemberId,
}: ProjectStructureSectionProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'flow'>('tree')
  const [selectedFlowMemberId, setSelectedFlowMemberId] = useState<string | null>(null)
  const [pendingMemberId, setPendingMemberId] = useState('')
  const [isExportingFlowPdf, setIsExportingFlowPdf] = useState(false)
  const [flowExportError, setFlowExportError] = useState<string | null>(null)
  const flowRef = useRef<ProjectStructureFlowHandle | null>(null)
  const flowAssignments: ProjectAssignment[] = isEditing
    ? [
        {
          id: 'draft-pm',
          projectId: 'draft',
          memberId: pmMemberId,
          responsibility: 'PM',
          reportsToMemberId: null,
        },
        ...structureAssignments
          .filter((assignment) => assignment.memberId)
          .map((assignment, index) => ({
            id: assignment.id ?? `draft-${index}`,
            projectId: 'draft',
            memberId: assignment.memberId,
            responsibility: assignment.responsibility,
            reportsToMemberId: assignment.reportsToMemberId || null,
          })),
      ]
    : projectAssignments

  const availableMembers = members
    .filter(
      (member) =>
        member.id !== pmMemberId &&
        !structureAssignments.some((assignment) => assignment.memberId === member.id),
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'ja'))

  function handleFlowConnect(connection: Connection) {
    const managerId = connection.source
    const memberId = connection.target

    if (!isEditing || !memberId) {
      return
    }

    if (memberId === pmMemberId) {
      return
    }

    onUpdateAssignmentByMemberId(memberId, {
      reportsToMemberId: managerId && managerId !== pmMemberId ? managerId : '',
    })
  }

  function handleAddMemberToFlow() {
    if (!pendingMemberId) {
      return
    }

    onAddAssignmentForMember(pendingMemberId)
    setSelectedFlowMemberId(pendingMemberId)
    setPendingMemberId('')
  }

  function handleRemoveMemberFromFlow() {
    if (!selectedFlowMemberId) {
      return
    }

    onRemoveAssignmentByMemberId(selectedFlowMemberId)
    setSelectedFlowMemberId(null)
  }

  async function handleExportFlowPdf() {
    if (!flowRef.current || isExportingFlowPdf) {
      return
    }

    setFlowExportError(null)
    setIsExportingFlowPdf(true)

    try {
      await flowRef.current.exportPdf()
    } catch (caughtError) {
      setFlowExportError(
        caughtError instanceof Error ? caughtError.message : 'PDF の出力に失敗しました。',
      )
    } finally {
      setIsExportingFlowPdf(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>プロジェクト体制</h2>
          <p className={styles.sectionDescription}>
            PM と役割の担当を確認できます。必要なときだけ編集フォームを開いて更新します。
          </p>
        </div>
        <div className={styles.structureHeaderControls}>
          <div className={styles.viewModeToggle} role="tablist" aria-label="体制図表示切替">
            <button
              aria-pressed={viewMode === 'tree'}
              className={viewMode === 'tree' ? styles.viewModeButtonActive : styles.viewModeButton}
              data-testid="structure-view-tree"
              onClick={() => setViewMode('tree')}
              type="button"
            >
              ツリー
            </button>
            <button
              aria-pressed={viewMode === 'flow'}
              className={viewMode === 'flow' ? styles.viewModeButtonActive : styles.viewModeButton}
              data-testid="structure-view-flow"
              onClick={() => setViewMode('flow')}
              type="button"
            >
              フロー
            </button>
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
      </div>

      {isEditing ? (
        <ProjectStructureEditor
          canCopyFromSystem={canCopyFromSystem}
          copySourceSystemName={copySourceSystemName}
          isSavingStructure={isSavingStructure}
          members={members}
          onAddAssignment={onAddAssignment}
          onClose={onClose}
          onCopyFromSystem={onCopyFromSystem}
          onRemoveAssignment={onRemoveAssignment}
          onSave={onSave}
          onStructurePmChange={onStructurePmChange}
          onUpdateAssignment={onUpdateAssignment}
          responsibilityOptions={responsibilityOptions}
          structureAssignments={structureAssignments}
          structureChanged={structureChanged}
          structureError={structureError}
          structurePmMemberId={structurePmMemberId}
        />
      ) : null}

      <div className={styles.treeSection}>
        {viewMode === 'tree' ? (
          <MemberTree members={members} rootMemberId={pmMemberId} assignments={projectAssignments} />
        ) : (
          <>
            <div className={styles.flowAssistHeader}>
              <p className={styles.emptyText}>
                {isEditing
                  ? 'ノード間をドラッグ接続すると報告先を変更できます。必要なら表示中の体制図を PDF として保存できます。'
                  : 'プロジェクト体制をフローで確認できます。表示中の体制図を PDF として保存できます。'}
              </p>
              <Button
                data-testid="project-structure-export-pdf"
                disabled={isExportingFlowPdf}
                onClick={() => void handleExportFlowPdf()}
                size="small"
                variant="secondary"
              >
                {isExportingFlowPdf ? 'PDF 出力中...' : 'PDF 出力'}
              </Button>
            </div>
            {isExportingFlowPdf ? (
              <p className={styles.emptyText}>表示中の体制図を PDF に変換しています...</p>
            ) : null}
            {flowExportError ? <p className={styles.sectionError}>{flowExportError}</p> : null}
            {isEditing ? (
              <div className={styles.flowToolbar}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>表示するメンバーを追加</span>
                  <select
                    className={styles.selectInput}
                    data-testid="structure-flow-member-select"
                    onChange={(event) => setPendingMemberId(event.target.value)}
                    value={pendingMemberId}
                  >
                    <option value="">メンバーを選択</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {formatMemberShortLabel(member)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.phaseHeaderActions}>
                  <Button
                    data-testid="structure-flow-add-button"
                    disabled={!pendingMemberId}
                    onClick={handleAddMemberToFlow}
                    size="small"
                    variant="secondary"
                  >
                    追加
                  </Button>
                  <Button
                    data-testid="structure-flow-remove-button"
                    disabled={!selectedFlowMemberId}
                    onClick={handleRemoveMemberFromFlow}
                    size="small"
                    variant="danger"
                  >
                    削除
                  </Button>
                </div>
              </div>
            ) : null}
            <ProjectStructureFlow
              assignments={flowAssignments}
              isEditable={isEditing}
              members={members}
              onConnect={handleFlowConnect}
              onSelectMember={setSelectedFlowMemberId}
              ref={flowRef}
              rootMemberId={pmMemberId}
              selectedMemberId={selectedFlowMemberId}
            />
          </>
        )}
      </div>
    </Panel>
  )
}
