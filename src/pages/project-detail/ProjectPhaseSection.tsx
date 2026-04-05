import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
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
    <Panel className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>フェーズ編集</h2>
          <p className={styles.sectionDescription}>
            案件ごとにフェーズ名、期間、状態、進捗を編集できます。不要なフェーズは削除し、新しいフェーズも追加できます。
          </p>
        </div>
        <div className={styles.phaseHeaderActions}>
          <Button onClick={onAddPhase} size="small" variant="secondary">
            フェーズを追加
          </Button>
          <Button
            data-testid="phase-structure-save-button"
            disabled={isSavingPhaseStructure}
            onClick={onSave}
            size="small"
          >
            {isSavingPhaseStructure ? '保存中...' : 'フェーズ構成を保存'}
          </Button>
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
              <th>進捗率</th>
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
    </Panel>
  )
}
