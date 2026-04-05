import { Button } from '../../components/ui/Button'
import type { Project, WorkStatus } from '../../types/project'
import { formatPeriod, getPhaseActualRange } from '../../utils/projectUtils'
import type { PhaseFormState } from './projectDetailTypes'
import { getDraftPhaseRange } from './phaseEditorUtils'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectPhaseTableRowProps {
  isFirst: boolean
  isLast: boolean
  onMovePhase: (key: string, direction: 'up' | 'down') => void
  onRemovePhase: (key: string) => void
  onUpdatePhase: (key: string, patch: Partial<PhaseFormState>) => void
  phase: PhaseFormState
  project: Project
  workStatusOptions: WorkStatus[]
}

export function ProjectPhaseTableRow({
  isFirst,
  isLast,
  onMovePhase,
  onRemovePhase,
  onUpdatePhase,
  phase,
  project,
  workStatusOptions,
}: ProjectPhaseTableRowProps) {
  const draftPhase = getDraftPhaseRange(project, phase)
  const phaseRange = draftPhase ? getPhaseActualRange(project, draftPhase) : null
  const range = phaseRange ? formatPeriod(phaseRange.startDate, phaseRange.endDate) : '-'
  const phaseLabel = phase.name || '新規フェーズ'

  return (
    <tr data-testid={`phase-row-${phase.key}`}>
      <td>
        <input
          aria-label={`${phaseLabel} のフェーズ名`}
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
          <span className={styles.visuallyHidden}>{phaseLabel} の状態</span>
          <select
            aria-label={`${phaseLabel} の状態`}
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
          <span className={styles.visuallyHidden}>{phaseLabel} の進捗率</span>
          <input
            aria-label={`${phaseLabel} の進捗率`}
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
          aria-label={`${phaseLabel} の開始週`}
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
          aria-label={`${phaseLabel} の終了週`}
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
          aria-label={`${phaseLabel} move up`}
          data-testid={`phase-move-up-${phase.key}`}
          disabled={isFirst}
          onClick={() => onMovePhase(phase.key, 'up')}
          size="small"
          variant="secondary"
        >
          ↑
        </Button>
        <Button
          aria-label={`${phaseLabel} move down`}
          data-testid={`phase-move-down-${phase.key}`}
          disabled={isLast}
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
}
