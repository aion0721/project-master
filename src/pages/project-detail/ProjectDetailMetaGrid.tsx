import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import type { Phase, Project, ProjectLink } from '../../types/project'
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
  isProjectLinksEditing: boolean
  isSavingCurrentPhase: boolean
  isSavingProjectLinks: boolean
  isSavingSchedule: boolean
  isScheduleEditing: boolean
  onAddProjectLink: () => void
  onCurrentPhaseCancel: () => void
  onCurrentPhaseDraftChange: (phaseId: string) => void
  onCurrentPhaseEdit: () => void
  onCurrentPhaseSave: () => void
  onProjectLinkDraftChange: (index: number, patch: Partial<ProjectLink>) => void
  onProjectLinksCancel: () => void
  onProjectLinksEdit: () => void
  onProjectLinksSave: () => void
  onRemoveProjectLink: (index: number) => void
  onScheduleCancel: () => void
  onScheduleDraftChange: (patch: Partial<ScheduleDraft>) => void
  onScheduleEdit: () => void
  onScheduleSave: () => void
  pmName?: string
  project: Project
  projectLinksChanged: boolean
  projectLinksDraft: ProjectLink[]
  projectLinksError: string | null
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
  isProjectLinksEditing,
  isSavingCurrentPhase,
  isSavingProjectLinks,
  isSavingSchedule,
  isScheduleEditing,
  onAddProjectLink,
  onCurrentPhaseCancel,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseSave,
  onProjectLinkDraftChange,
  onProjectLinksCancel,
  onProjectLinksEdit,
  onProjectLinksSave,
  onRemoveProjectLink,
  onScheduleCancel,
  onScheduleDraftChange,
  onScheduleEdit,
  onScheduleSave,
  pmName,
  project,
  projectLinksChanged,
  projectLinksDraft,
  projectLinksError,
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
        {isProjectLinksEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.projectLinksHeader}>
              <span className={styles.metaHelperText}>名称と URL をセットで管理できます。</span>
              <Button onClick={onAddProjectLink} size="small" variant="secondary">
                追加
              </Button>
            </div>

            <div className={styles.projectLinksEditorList}>
              {projectLinksDraft.map((link, index) => (
                <div key={`project-link-draft-${index}`} className={styles.projectLinkEditorRow}>
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>案件リンク名 {index + 1}</span>
                    <input
                      aria-label={`案件リンク名 ${index + 1}`}
                      className={styles.selectInput}
                      data-testid={`project-link-label-${index}`}
                      onChange={(event) =>
                        onProjectLinkDraftChange(index, { label: event.target.value })
                      }
                      placeholder="リンク名"
                      value={link.label}
                    />
                  </label>
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>案件リンクURL {index + 1}</span>
                    <input
                      aria-label={`案件リンクURL ${index + 1}`}
                      className={styles.selectInput}
                      data-testid={`project-link-url-${index}`}
                      onChange={(event) => onProjectLinkDraftChange(index, { url: event.target.value })}
                      placeholder="https://example.com/projects/PRJ-001"
                      type="url"
                      value={link.url}
                    />
                  </label>
                  <Button
                    data-testid={`project-link-remove-${index}`}
                    onClick={() => onRemoveProjectLink(index)}
                    size="small"
                    variant="danger"
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>

            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-links-save-button"
                disabled={isSavingProjectLinks || !projectLinksChanged}
                onClick={onProjectLinksSave}
                size="small"
              >
                {isSavingProjectLinks ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-links-cancel-button"
                onClick={onProjectLinksCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectLinksError ? <p className={styles.metaError}>{projectLinksError}</p> : null}
          </div>
        ) : (
          <div className={styles.projectLinksDisplay}>
            {project.projectLinks.length > 0 ? (
              <div className={styles.projectLinksList}>
                {project.projectLinks.map((link, index) => (
                  <a
                    key={`${link.label}-${link.url}-${index}`}
                    className={styles.externalLink}
                    data-testid={`project-link-anchor-${index}`}
                    href={link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <strong className={styles.metaValue} data-testid="project-link-empty">
                未設定
              </strong>
            )}
            <Button
              data-testid="project-links-edit-button"
              onClick={onProjectLinksEdit}
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
