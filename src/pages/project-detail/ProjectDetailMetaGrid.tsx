import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import type { Phase, Project } from '../../types/project'
import { formatPeriod } from '../../utils/projectUtils'
import styles from '../ProjectDetailPage.module.css'

interface ScheduleDraft {
  startDate: string
  endDate: string
}

interface ProjectDetailMetaGridProps {
  currentPhase?: Phase
  currentPhaseChanged: boolean
  currentPhaseDraftId: string
  currentPhaseError: string | null
  isCurrentPhaseEditing: boolean
  isProjectLinkEditing: boolean
  isSavingCurrentPhase: boolean
  isSavingProjectLink: boolean
  isSavingSchedule: boolean
  isScheduleEditing: boolean
  onCurrentPhaseCancel: () => void
  onCurrentPhaseDraftChange: (phaseId: string) => void
  onCurrentPhaseEdit: () => void
  onCurrentPhaseSave: () => void
  onProjectLinkCancel: () => void
  onProjectLinkDraftChange: (value: string) => void
  onProjectLinkEdit: () => void
  onProjectLinkSave: () => void
  onScheduleCancel: () => void
  onScheduleDraftChange: (patch: Partial<ScheduleDraft>) => void
  onScheduleEdit: () => void
  onScheduleSave: () => void
  pmName?: string
  project: Project
  projectLinkChanged: boolean
  projectLinkDraft: string
  projectLinkError: string | null
  projectPhases: Phase[]
  scheduleChanged: boolean
  scheduleDraft: ScheduleDraft
  scheduleError: string | null
}

function MetaCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <article className={styles.metaCard}>
      <span className={styles.metaLabel}>{label}</span>
      {children}
    </article>
  )
}

export function ProjectDetailMetaGrid({
  currentPhase,
  currentPhaseChanged,
  currentPhaseDraftId,
  currentPhaseError,
  isCurrentPhaseEditing,
  isProjectLinkEditing,
  isSavingCurrentPhase,
  isSavingProjectLink,
  isSavingSchedule,
  isScheduleEditing,
  onCurrentPhaseCancel,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseSave,
  onProjectLinkCancel,
  onProjectLinkDraftChange,
  onProjectLinkEdit,
  onProjectLinkSave,
  onScheduleCancel,
  onScheduleDraftChange,
  onScheduleEdit,
  onScheduleSave,
  pmName,
  project,
  projectLinkChanged,
  projectLinkDraft,
  projectLinkError,
  projectPhases,
  scheduleChanged,
  scheduleDraft,
  scheduleError,
}: ProjectDetailMetaGridProps) {
  return (
    <div className={styles.metaGrid}>
      <MetaCard label="PM">
        <strong className={styles.metaValue}>{pmName ?? '未設定'}</strong>
      </MetaCard>

      <MetaCard label="期間">
        {isScheduleEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>開始日</span>
              <input
                aria-label="開始日"
                className={styles.selectInput}
                data-testid="project-schedule-start"
                onChange={(event) => onScheduleDraftChange({ startDate: event.target.value })}
                type="date"
                value={scheduleDraft.startDate}
              />
            </label>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>終了日</span>
              <input
                aria-label="終了日"
                className={styles.selectInput}
                data-testid="project-schedule-end"
                onChange={(event) => onScheduleDraftChange({ endDate: event.target.value })}
                type="date"
                value={scheduleDraft.endDate}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-schedule-save-button"
                disabled={isSavingSchedule || !scheduleChanged}
                onClick={onScheduleSave}
                size="small"
              >
                {isSavingSchedule ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-schedule-cancel-button"
                onClick={onScheduleCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {scheduleError ? <p className={styles.metaError}>{scheduleError}</p> : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong className={styles.metaValue} data-testid="project-schedule-value">
              {formatPeriod(project.startDate, project.endDate)}
            </strong>
            <Button
              data-testid="project-schedule-edit-button"
              onClick={onScheduleEdit}
              size="small"
              variant="secondary"
            >
              変更
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard label="現在フェーズ">
        {isCurrentPhaseEditing ? (
          <div className={styles.phaseMetaEditor}>
            <select
              aria-label="現在フェーズを選択"
              className={styles.selectInput}
              data-testid="current-phase-select"
              onChange={(event) => onCurrentPhaseDraftChange(event.target.value)}
              value={currentPhaseDraftId}
            >
              <option value="">選択してください</option>
              {projectPhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="current-phase-save-button"
                disabled={isSavingCurrentPhase || !currentPhaseChanged}
                onClick={onCurrentPhaseSave}
                size="small"
              >
                {isSavingCurrentPhase ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="current-phase-cancel-button"
                onClick={onCurrentPhaseCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {currentPhaseError ? <p className={styles.metaError}>{currentPhaseError}</p> : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong className={styles.metaValue} data-testid="current-phase-value">
              {currentPhase?.name ?? '未設定'}
            </strong>
            <Button
              data-testid="current-phase-edit-button"
              onClick={onCurrentPhaseEdit}
              size="small"
              variant="secondary"
            >
              変更
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard label="案件リンク">
        {isProjectLinkEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>案件リンク</span>
              <input
                aria-label="案件リンク"
                className={styles.selectInput}
                data-testid="project-link-input"
                onChange={(event) => onProjectLinkDraftChange(event.target.value)}
                placeholder="https://example.com/projects/PRJ-001"
                type="url"
                value={projectLinkDraft}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-link-save-button"
                disabled={isSavingProjectLink || !projectLinkChanged}
                onClick={onProjectLinkSave}
                size="small"
              >
                {isSavingProjectLink ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-link-cancel-button"
                onClick={onProjectLinkCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectLinkError ? <p className={styles.metaError}>{projectLinkError}</p> : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            {project.projectLink ? (
              <a
                className={styles.externalLink}
                data-testid="project-link-anchor"
                href={project.projectLink}
                rel="noreferrer"
                target="_blank"
              >
                案件リンクを開く
              </a>
            ) : (
              <strong className={styles.metaValue} data-testid="project-link-empty">
                未設定
              </strong>
            )}
            <Button
              data-testid="project-link-edit-button"
              onClick={onProjectLinkEdit}
              size="small"
              variant="secondary"
            >
              変更
            </Button>
          </div>
        )}
      </MetaCard>
    </div>
  )
}
