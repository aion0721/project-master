import { MemberTree } from '../../components/MemberTree'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Member, ProjectAssignment } from '../../types/project'
import type { StructureAssignmentDraft } from './projectDetailTypes'
import { ProjectStructureEditor } from './ProjectStructureEditor'
import styles from '../projects/ProjectDetailPage.module.css'

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
            PM と役割の担当を確認できます。必要なときだけ編集フォームを開いて更新します。
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
        <ProjectStructureEditor
          isSavingStructure={isSavingStructure}
          members={members}
          onAddAssignment={onAddAssignment}
          onClose={onClose}
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
        <MemberTree members={members} pmMemberId={pmMemberId} projectAssignments={projectAssignments} />
      </div>
    </Panel>
  )
}
