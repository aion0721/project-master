import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Project, WorkStatus } from '../../types/project'
import { formatPeriod, getPhaseActualRange } from '../../utils/projectUtils'
import {
  buildDraftPhaseForRange,
  type PhaseFormState,
} from './projectDetailTypes'
import styles from '../ProjectDetailPage.module.css'

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
          <h2 className={styles.sectionTitle}>フェーズ構成</h2>
          <p className={styles.sectionDescription}>
            案件ごとにフェーズ名、開始週、終了週、状態、進捗率を編集できます。不要なフェーズは削除し、新しいフェーズは追加してください。
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
            {phaseDrafts.map((phase) => {
              const draftPhase = buildDraftPhaseForRange(project.projectNumber, project.pmMemberId, phase)
              const hasValidRange =
                Number.isInteger(draftPhase.startWeek) &&
                Number.isInteger(draftPhase.endWeek) &&
                draftPhase.startWeek > 0 &&
                draftPhase.endWeek >= draftPhase.startWeek
              const phaseRange = hasValidRange ? getPhaseActualRange(project, draftPhase) : null
              const range = phaseRange ? formatPeriod(phaseRange.startDate, phaseRange.endDate) : '-'

              return (
                <tr data-testid={`phase-row-${phase.key}`} key={phase.key}>
                  <td>
                    <input
                      aria-label={`${phase.name || '新規フェーズ'} のフェーズ名`}
                      className={styles.selectInput}
                      data-testid={`phase-name-${phase.key}`}
                      onChange={(event) => {
                        onUpdatePhase(phase.key, { name: event.target.value })
                      }}
                      value={phase.name}
                    />
                  </td>
                  <td>{range}</td>
                  <td>
                    <label className={styles.formField}>
                      <span className={styles.visuallyHidden}>{phase.name} の状態</span>
                      <select
                        aria-label={`${phase.name || '新規フェーズ'} の状態`}
                        className={styles.selectInput}
                        data-testid={`phase-status-${phase.key}`}
                        onChange={(event) => {
                          onUpdatePhase(phase.key, { status: event.target.value as WorkStatus })
                        }}
                        value={phase.status}
                      >
                        {workStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td>
                    <label className={styles.formField}>
                      <span className={styles.visuallyHidden}>{phase.name} の進捗率</span>
                      <input
                        aria-label={`${phase.name || '新規フェーズ'} の進捗率`}
                        className={styles.progressInput}
                        data-testid={`phase-progress-${phase.key}`}
                        inputMode="numeric"
                        max={100}
                        min={0}
                        onChange={(event) => {
                          onUpdatePhase(phase.key, { progress: event.target.value })
                        }}
                        type="number"
                        value={phase.progress}
                      />
                    </label>
                  </td>
                  <td>
                    <input
                      aria-label={`${phase.name || '新規フェーズ'} の開始週`}
                      className={styles.weekInput}
                      data-testid={`phase-start-${phase.key}`}
                      inputMode="numeric"
                      min={1}
                      onChange={(event) => {
                        onUpdatePhase(phase.key, { startWeek: event.target.value })
                      }}
                      type="number"
                      value={phase.startWeek}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${phase.name || '新規フェーズ'} の終了週`}
                      className={styles.weekInput}
                      data-testid={`phase-end-${phase.key}`}
                      inputMode="numeric"
                      min={1}
                      onChange={(event) => {
                        onUpdatePhase(phase.key, { endWeek: event.target.value })
                      }}
                      type="number"
                      value={phase.endWeek}
                    />
                  </td>
                  <td className={styles.actionCell}>
                    <Button
                      aria-label={`${phase.name || 'phase'} move up`}
                      data-testid={`phase-move-up-${phase.key}`}
                      disabled={phaseDrafts[0]?.key === phase.key}
                      onClick={() => onMovePhase(phase.key, 'up')}
                      size="small"
                      variant="secondary"
                    >
                      ↑
                    </Button>
                    <Button
                      aria-label={`${phase.name || 'phase'} move down`}
                      data-testid={`phase-move-down-${phase.key}`}
                      disabled={phaseDrafts[phaseDrafts.length - 1]?.key === phase.key}
                      onClick={() => onMovePhase(phase.key, 'down')}
                      size="small"
                      variant="secondary"
                    >
                      ↓
                    </Button>
                    <Button
                      data-testid={`phase-remove-${phase.key}`}
                      onClick={() => onRemovePhase(phase.key)}
                      size="small"
                      variant="danger"
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
