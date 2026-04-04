import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Phase, Project } from '../../types/project'
import { formatPeriod } from '../../utils/projectUtils'
import styles from '../ProjectDetailPage.module.css'

interface ScheduleDraft {
  startDate: string
  endDate: string
}

interface ProjectDetailHeroProps {
  project: Project
  pmName?: string
  currentUser: unknown
  isBookmarked: boolean
  onToggleBookmark: () => void
  isScheduleEditing: boolean
  scheduleDraft: ScheduleDraft
  scheduleChanged: boolean
  scheduleError: string | null
  isSavingSchedule: boolean
  onScheduleDraftChange: (patch: Partial<ScheduleDraft>) => void
  onScheduleEdit: () => void
  onScheduleCancel: () => void
  onScheduleSave: () => void
  currentPhase?: Phase
  projectPhases: Phase[]
  isCurrentPhaseEditing: boolean
  currentPhaseDraftId: string
  currentPhaseChanged: boolean
  currentPhaseError: string | null
  isSavingCurrentPhase: boolean
  onCurrentPhaseDraftChange: (phaseId: string) => void
  onCurrentPhaseEdit: () => void
  onCurrentPhaseCancel: () => void
  onCurrentPhaseSave: () => void
  isProjectLinkEditing: boolean
  projectLinkDraft: string
  projectLinkChanged: boolean
  projectLinkError: string | null
  isSavingProjectLink: boolean
  onProjectLinkDraftChange: (value: string) => void
  onProjectLinkEdit: () => void
  onProjectLinkCancel: () => void
  onProjectLinkSave: () => void
}

export function ProjectDetailHero({
  project,
  pmName,
  currentUser,
  isBookmarked,
  onToggleBookmark,
  isScheduleEditing,
  scheduleDraft,
  scheduleChanged,
  scheduleError,
  isSavingSchedule,
  onScheduleDraftChange,
  onScheduleEdit,
  onScheduleCancel,
  onScheduleSave,
  currentPhase,
  projectPhases,
  isCurrentPhaseEditing,
  currentPhaseDraftId,
  currentPhaseChanged,
  currentPhaseError,
  isSavingCurrentPhase,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseCancel,
  onCurrentPhaseSave,
  isProjectLinkEditing,
  projectLinkDraft,
  projectLinkChanged,
  projectLinkError,
  isSavingProjectLink,
  onProjectLinkDraftChange,
  onProjectLinkEdit,
  onProjectLinkCancel,
  onProjectLinkSave,
}: ProjectDetailHeroProps) {
  return (
    <Panel className={styles.hero} variant="hero">
      <div className={styles.heroTop}>
        <div>
          <Link className={styles.backTextLink} to="/projects">
            案件一覧へ戻る
          </Link>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.description}>
            プロジェクト番号: {project.projectNumber}
            <br />
            PM・進捗・体制をまとめて確認できる案件詳細です。
          </p>
        </div>

        <div className={styles.heroActions}>
          {currentUser ? (
            <Button
              onClick={onToggleBookmark}
              size="small"
              variant={isBookmarked ? 'primary' : 'secondary'}
            >
              {isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
            </Button>
          ) : null}
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className={styles.metaGrid}>
        <article className={styles.metaCard}>
          <span className={styles.metaLabel}>PM</span>
          <strong className={styles.metaValue}>{pmName ?? '未設定'}</strong>
        </article>

        <article className={styles.metaCard}>
          <span className={styles.metaLabel}>期間</span>
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
        </article>

        <article className={styles.metaCard}>
          <span className={styles.metaLabel}>現在フェーズ</span>
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
        </article>

        <article className={styles.metaCard}>
          <span className={styles.metaLabel}>案件リンク</span>
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
        </article>
      </div>
    </Panel>
  )
}
