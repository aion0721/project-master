import type { Project, WorkStatus } from '../../types/project'
import type { PhaseFormState } from './projectDetailTypes'
import { ProjectPhaseTableRow } from './ProjectPhaseTableRow'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectPhaseSectionProps {
  project: Project
  phaseDrafts: PhaseFormState[]
  workStatusOptions: WorkStatus[]
  phaseStructureError: string | null
  isSavingPhaseStructure: boolean
  onAddPhase: () => void
  onMovePhase: (key: string, direction: 'up' | 'down') => void
  onUpdatePhase: (key: string, patch: Partial<PhaseFormState>) => void
  onRemovePhase: (key: string) => void
  onSave: () => void
}

export function ProjectPhaseSection({
  project,
  phaseDrafts,
  workStatusOptions,
  phaseStructureError,
  isSavingPhaseStructure,
  onAddPhase,
  onMovePhase,
  onUpdatePhase,
  onRemovePhase,
  onSave,
}: ProjectPhaseSectionProps) {
  return (
    <div className={styles.phaseEditorDetail}>
      <div className={styles.phaseEditorToolbar}>
        <p className={styles.phaseEditorDescription}>
          フェーズ名の詳細変更や開始週の直接入力が必要な場合だけこの表を使います。
        </p>
        <div className={styles.phaseHeaderActions}>
          <button
            className={styles.phaseInlineButton}
            onClick={onAddPhase}
            type="button"
          >
            フェーズを追加
          </button>
          <button
            className={styles.phaseInlinePrimaryButton}
            data-testid="phase-structure-save-button"
            disabled={isSavingPhaseStructure}
            onClick={onSave}
            type="button"
          >
            {isSavingPhaseStructure ? '保存中...' : 'フェーズ構成を保存'}
          </button>
        </div>
      </div>
      {phaseStructureError ? <p className={styles.sectionError}>{phaseStructureError}</p> : null}
      <div className={styles.phaseTableWrap}>
        <table className={styles.phaseTable}>
          <thead>
            <tr>
              <th>フェーズ名</th>
              <th>期間</th>
              <th>状態</th>
              <th>開始週</th>
              <th>終了週</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {phaseDrafts.map((phase, index) => (
              <ProjectPhaseTableRow
                isFirst={index === 0}
                isLast={index === phaseDrafts.length - 1}
                key={phase.key}
                onMovePhase={onMovePhase}
                onRemovePhase={onRemovePhase}
                onUpdatePhase={onUpdatePhase}
                phase={phase}
                project={project}
                workStatusOptions={workStatusOptions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
