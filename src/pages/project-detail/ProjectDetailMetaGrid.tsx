import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import type { ManagedSystem, Phase, Project, ProjectLink, ProjectStatusOverride } from '../../types/project'
import { getPhaseToneKey } from '../../utils/projectPhasePresets'
import { formatPeriod } from '../../utils/projectUtils'
import styles from '../projects/ProjectDetailPage.module.css'

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
  isProjectNoteEditing: boolean
  isProjectReportStatusEditing: boolean
  isProjectStatusEditing: boolean
  isProjectSystemsEditing: boolean
  isSavingCurrentPhase: boolean
  isSavingProjectLinks: boolean
  isSavingProjectNote: boolean
  isSavingProjectReportStatus: boolean
  isSavingProjectStatusOverride: boolean
  isSavingProjectSystems: boolean
  isSavingSchedule: boolean
  isScheduleEditing: boolean
  availableSystems: ManagedSystem[]
  onAddProjectLink: () => void
  onCurrentPhaseCancel: () => void
  onCurrentPhaseDraftChange: (phaseId: string) => void
  onCurrentPhaseEdit: () => void
  onCurrentPhaseSave: () => void
  onProjectLinkDraftChange: (index: number, patch: Partial<ProjectLink>) => void
  onProjectLinksCancel: () => void
  onProjectLinksEdit: () => void
  onProjectLinksSave: () => void
  onProjectNoteCancel: () => void
  onProjectNoteDraftChange: (note: string) => void
  onProjectNoteEdit: () => void
  onProjectNoteSave: () => void
  onProjectReportStatusCancel: () => void
  onProjectReportStatusDraftChange: (hasReportItems: boolean) => void
  onProjectReportStatusEdit: () => void
  onProjectReportStatusSave: () => void
  onProjectStatusCancel: () => void
  onProjectStatusOverrideDraftChange: (status: ProjectStatusOverride | null) => void
  onProjectStatusEdit: () => void
  onProjectStatusSave: () => void
  onProjectSystemsCancel: () => void
  onProjectSystemsEdit: () => void
  onProjectSystemsSave: () => void
  onProjectSystemChange: (systemId: string) => void
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
  projectNoteChanged: boolean
  projectNoteDraft: string
  projectNoteError: string | null
  projectReportStatusChanged: boolean
  projectReportStatusDraft: boolean
  projectReportStatusError: string | null
  projectStatusOverrideChanged: boolean
  projectStatusOverrideDraft: ProjectStatusOverride | null
  projectStatusOverrideError: string | null
  projectPhases: Phase[]
  projectSystemIdsDraft: string[]
  projectSystemsChanged: boolean
  projectSystemsError: string | null
  scheduleChanged: boolean
  scheduleDraft: ScheduleDraft
  scheduleError: string | null
}

function getCurrentPhaseCardClassName(phase?: Phase) {
  if (!phase) {
    return undefined
  }

  switch (getPhaseToneKey(phase.name)) {
    case 'preStudy':
      return styles.metaCardPhaseTonePreStudy
    case 'discovery':
      return styles.metaCardPhaseToneDiscovery
    case 'basicDesign':
      return styles.metaCardPhaseToneBasicDesign
    case 'detailDesign':
      return styles.metaCardPhaseToneDetailDesign
    case 'ct':
      return styles.metaCardPhaseToneCt
    case 'ita':
      return styles.metaCardPhaseToneIta
    case 'itb':
      return styles.metaCardPhaseToneItb
    case 'uat':
      return styles.metaCardPhaseToneUat
    case 'migration':
      return styles.metaCardPhaseToneMigration
    case 'defaultTone':
    default:
      return styles.metaCardPhaseToneDefault
  }
}

function getProjectStatusCardClassName(status?: Project['status']) {
  switch (status) {
    case '進行中':
      return styles.metaCardPhaseInProgress
    case '完了':
      return styles.metaCardPhaseCompleted
    case '遅延':
      return styles.metaCardPhaseDelayed
    case '中止':
      return styles.metaCardStatusCancelled
    case '未着手':
    default:
      return styles.metaCardPhaseNotStarted
  }
}

function MetaCard({
  children,
  className,
  testId,
  label,
}: {
  children: ReactNode
  className?: string
  testId?: string
  label: string
}) {
  return (
    <article
      className={className ? `${styles.metaCard} ${className}` : styles.metaCard}
      data-testid={testId}
    >
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
  isProjectNoteEditing,
  isProjectReportStatusEditing,
  isProjectStatusEditing,
  isProjectSystemsEditing,
  isSavingCurrentPhase,
  isSavingProjectLinks,
  isSavingProjectNote,
  isSavingProjectReportStatus,
  isSavingProjectStatusOverride,
  isSavingProjectSystems,
  isSavingSchedule,
  isScheduleEditing,
  availableSystems,
  onAddProjectLink,
  onCurrentPhaseCancel,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseSave,
  onProjectLinkDraftChange,
  onProjectLinksCancel,
  onProjectLinksEdit,
  onProjectLinksSave,
  onProjectNoteCancel,
  onProjectNoteDraftChange,
  onProjectNoteEdit,
  onProjectNoteSave,
  onProjectReportStatusCancel,
  onProjectReportStatusDraftChange,
  onProjectReportStatusEdit,
  onProjectReportStatusSave,
  onProjectStatusCancel,
  onProjectStatusOverrideDraftChange,
  onProjectStatusEdit,
  onProjectStatusSave,
  onProjectSystemsCancel,
  onProjectSystemsEdit,
  onProjectSystemsSave,
  onProjectSystemChange,
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
  projectNoteChanged,
  projectNoteDraft,
  projectNoteError,
  projectReportStatusChanged,
  projectReportStatusDraft,
  projectReportStatusError,
  projectStatusOverrideChanged,
  projectStatusOverrideDraft,
  projectStatusOverrideError,
  projectPhases,
  projectSystemIdsDraft,
  projectSystemsChanged,
  projectSystemsError,
  scheduleChanged,
  scheduleDraft,
  scheduleError,
}: ProjectDetailMetaGridProps) {
  const selectedSystems = availableSystems.filter((system) =>
    (project.relatedSystemIds ?? []).includes(system.id),
  )

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
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={`${styles.metaCardCurrentPhase} ${getCurrentPhaseCardClassName(currentPhase) ?? ''}`.trim()}
        label="現在フェーズ"
        testId="current-phase-card"
      >
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
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={`${styles.metaCardProjectStatus} ${getProjectStatusCardClassName(project.status) ?? ''}`.trim()}
        label="案件状態"
        testId="project-status-card"
      >
        {isProjectStatusEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>案件状態</span>
              <select
                aria-label="案件状態"
                className={styles.selectInput}
                data-testid="project-status-override-select"
                onChange={(event) =>
                  onProjectStatusOverrideDraftChange(
                    event.target.value ? (event.target.value as ProjectStatusOverride) : null,
                  )
                }
                value={projectStatusOverrideDraft ?? ''}
              >
                <option value="">自動</option>
                <option value="未着手">未着手</option>
                <option value="進行中">進行中</option>
                <option value="完了">完了</option>
                <option value="遅延">遅延</option>
                <option value="中止">中止</option>
              </select>
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-status-override-save-button"
                disabled={isSavingProjectStatusOverride || !projectStatusOverrideChanged}
                onClick={onProjectStatusSave}
                size="small"
              >
                {isSavingProjectStatusOverride ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-status-override-cancel-button"
                onClick={onProjectStatusCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectStatusOverrideError ? <p className={styles.metaError}>{projectStatusOverrideError}</p> : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <div className={styles.projectStatusDisplay}>
              <strong className={styles.metaValue} data-testid="project-status-value">
                {project.status}
              </strong>
              <span className={styles.metaHelperText} data-testid="project-status-mode">
                {project.statusOverride ? '手動上書き' : '自動判定'}
              </span>
            </div>
            <Button
              data-testid="project-status-edit-button"
              onClick={onProjectStatusEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardProjectLinks} label="案件リンク">
        {isProjectLinksEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.projectLinksHeader}>
              <span className={styles.metaHelperText}>リンク名と URL をセットで登録できます。</span>
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
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardWide} label="状況メモ">
        {isProjectNoteEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>状況メモ</span>
              <textarea
                aria-label="状況メモ"
                className={`${styles.selectInput} ${styles.memoInput}`}
                data-testid="project-note-input"
                onChange={(event) => onProjectNoteDraftChange(event.target.value)}
                placeholder="状況、懸念、次のアクションを記録"
                value={projectNoteDraft}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-note-save-button"
                disabled={isSavingProjectNote || !projectNoteChanged}
                onClick={onProjectNoteSave}
                size="small"
              >
                {isSavingProjectNote ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-note-cancel-button"
                onClick={onProjectNoteCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectNoteError ? <p className={styles.metaError}>{projectNoteError}</p> : null}
          </div>
        ) : (
          <div className={styles.projectNoteDisplay}>
            <strong className={styles.metaValue} data-testid="project-note-value">
              {project.note?.trim() || '未設定'}
            </strong>
            <Button
              data-testid="project-note-edit-button"
              onClick={onProjectNoteEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={
          project.hasReportItems
            ? `${styles.metaCardReport} ${styles.metaCardReportActive}`
            : styles.metaCardReport
        }
        label="報告事項"
        testId="project-report-status-card"
      >
        {isProjectReportStatusEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>報告事項の有無</span>
              <select
                aria-label="報告事項の有無"
                className={styles.selectInput}
                data-testid="project-report-status-select"
                onChange={(event) => onProjectReportStatusDraftChange(event.target.value === 'true')}
                value={String(projectReportStatusDraft)}
              >
                <option value="false">なし</option>
                <option value="true">あり</option>
              </select>
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-report-status-save-button"
                disabled={isSavingProjectReportStatus || !projectReportStatusChanged}
                onClick={onProjectReportStatusSave}
                size="small"
              >
                {isSavingProjectReportStatus ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-report-status-cancel-button"
                onClick={onProjectReportStatusCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectReportStatusError ? <p className={styles.metaError}>{projectReportStatusError}</p> : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong className={styles.metaValue} data-testid="project-report-status-value">
              {project.hasReportItems ? 'あり' : 'なし'}
            </strong>
            <Button
              data-testid="project-report-status-edit-button"
              onClick={onProjectReportStatusEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardSystem} label="主システム">
        {isProjectSystemsEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.systemSelectionList}>
                {availableSystems.length > 0 ? (
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>主システム</span>
                    <select
                      aria-label="主システム"
                      className={styles.selectInput}
                      data-testid="project-system-select"
                      onChange={(event) => onProjectSystemChange(event.target.value)}
                      value={projectSystemIdsDraft[0] ?? ''}
                    >
                      <option value="">選択してください</option>
                      {availableSystems.map((system) => (
                        <option key={system.id} value={system.id}>
                          {system.id} / {system.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className={styles.emptyText}>登録済みシステムがありません。</p>
                )}
              </div>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-systems-save-button"
                disabled={isSavingProjectSystems || !projectSystemsChanged}
                onClick={onProjectSystemsSave}
                size="small"
              >
                {isSavingProjectSystems ? '保存中...' : '保存'}
              </Button>
              <Button
                data-testid="project-systems-cancel-button"
                onClick={onProjectSystemsCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectSystemsError ? <p className={styles.metaError}>{projectSystemsError}</p> : null}
          </div>
        ) : (
          <div className={styles.projectLinksDisplay}>
            {selectedSystems.length > 0 ? (
              <div className={styles.systemChipList}>
                {selectedSystems.map((system) => (
                  <span className={styles.systemChip} key={system.id}>
                    {system.id} / {system.name}
                  </span>
                ))}
              </div>
            ) : (
              <strong className={styles.metaValue} data-testid="project-system-empty">
                未設定
              </strong>
            )}
            <Button
              data-testid="project-systems-edit-button"
              onClick={onProjectSystemsEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>
    </div>
  )
}
