import { useState } from 'react'
import { EntityIcon } from '../../components/EntityIcon'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import pageStyles from '../../styles/page.module.css'
import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectLink,
  ProjectStatusOverride,
} from '../../types/project'
import { getPhaseToneKey } from '../../utils/projectPhasePresets'
import { ProjectDetailMetaGrid } from './ProjectDetailMetaGrid'
import styles from '../projects/ProjectDetailPage.module.css'

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
  relatedSystems: ManagedSystem[]
  availableSystems: ManagedSystem[]
  isCurrentPhaseEditing: boolean
  currentPhaseDraftId: string
  currentPhaseChanged: boolean
  currentPhaseError: string | null
  isSavingCurrentPhase: boolean
  onCurrentPhaseDraftChange: (phaseId: string) => void
  onCurrentPhaseEdit: () => void
  onCurrentPhaseCancel: () => void
  onCurrentPhaseSave: () => void
  isProjectLinksEditing: boolean
  isProjectNoteEditing: boolean
  isProjectReportStatusEditing: boolean
  isProjectStatusEditing: boolean
  isProjectSystemsEditing: boolean
  projectLinksDraft: ProjectLink[]
  projectLinksChanged: boolean
  projectLinksError: string | null
  projectNoteChanged: boolean
  projectNoteDraft: string
  projectNoteError: string | null
  projectReportStatusChanged: boolean
  projectReportStatusDraft: boolean
  projectReportStatusError: string | null
  projectStatusOverrideChanged: boolean
  projectStatusBulkApplyEnabled: boolean
  projectStatusOverrideDraft: ProjectStatusOverride | null
  projectStatusOverrideError: string | null
  projectSystemIdsDraft: string[]
  projectSystemsChanged: boolean
  projectSystemsError: string | null
  isSavingProjectLinks: boolean
  isSavingProjectNote: boolean
  isSavingProjectReportStatus: boolean
  isSavingProjectStatusOverride: boolean
  isSavingProjectSystems: boolean
  onAddProjectLink: () => void
  onProjectLinkDraftChange: (index: number, patch: Partial<ProjectLink>) => void
  onProjectLinksEdit: () => void
  onProjectLinksCancel: () => void
  onProjectLinksSave: () => void
  onProjectNoteDraftChange: (note: string) => void
  onProjectNoteEdit: () => void
  onProjectNoteCancel: () => void
  onProjectNoteSave: () => void
  onProjectReportStatusDraftChange: (hasReportItems: boolean) => void
  onProjectReportStatusEdit: () => void
  onProjectReportStatusCancel: () => void
  onProjectReportStatusSave: () => void
  onProjectStatusBulkApplyChange: (checked: boolean) => void
  onProjectStatusOverrideDraftChange: (status: ProjectStatusOverride | null) => void
  onProjectStatusEdit: () => void
  onProjectStatusCancel: () => void
  onProjectStatusSave: () => void
  onProjectSystemsEdit: () => void
  onProjectSystemsCancel: () => void
  onProjectSystemsSave: () => void
  onProjectSystemChange: (systemId: string) => void
  onRemoveProjectLink: (index: number) => void
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
  relatedSystems,
  availableSystems,
  isCurrentPhaseEditing,
  currentPhaseDraftId,
  currentPhaseChanged,
  currentPhaseError,
  isSavingCurrentPhase,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseCancel,
  onCurrentPhaseSave,
  isProjectLinksEditing,
  isProjectNoteEditing,
  isProjectReportStatusEditing,
  isProjectStatusEditing,
  isProjectSystemsEditing,
  projectLinksDraft,
  projectLinksChanged,
  projectLinksError,
  projectNoteDraft,
  projectNoteChanged,
  projectNoteError,
  projectReportStatusDraft,
  projectReportStatusChanged,
  projectReportStatusError,
  projectStatusBulkApplyEnabled,
  projectStatusOverrideDraft,
  projectStatusOverrideChanged,
  projectStatusOverrideError,
  projectSystemIdsDraft,
  projectSystemsChanged,
  projectSystemsError,
  isSavingProjectLinks,
  isSavingProjectNote,
  isSavingProjectReportStatus,
  isSavingProjectStatusOverride,
  isSavingProjectSystems,
  onAddProjectLink,
  onProjectLinkDraftChange,
  onProjectLinksEdit,
  onProjectLinksCancel,
  onProjectLinksSave,
  onProjectNoteDraftChange,
  onProjectNoteEdit,
  onProjectNoteCancel,
  onProjectNoteSave,
  onProjectReportStatusDraftChange,
  onProjectReportStatusEdit,
  onProjectReportStatusCancel,
  onProjectReportStatusSave,
  onProjectStatusBulkApplyChange,
  onProjectStatusOverrideDraftChange,
  onProjectStatusEdit,
  onProjectStatusCancel,
  onProjectStatusSave,
  onProjectSystemsEdit,
  onProjectSystemsCancel,
  onProjectSystemsSave,
  onProjectSystemChange,
  onRemoveProjectLink,
}: ProjectDetailHeroProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const currentPhaseToneClassName = currentPhase
    ? styles[`phaseSummaryBadge${getPhaseToneKey(currentPhase.name)}`]
    : styles.phaseSummaryBadgeDefaultTone

  return (
    <Panel className={styles.hero} variant="hero">
      <div className={styles.heroTop}>
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="project" />
          <div className={pageStyles.heroHeadingBody}>
            <div className={styles.backLinks}>
              <Button size="small" to="/projects" variant="secondary">
                案件一覧へ戻る
              </Button>
              <Button size="small" to="/cross-project" variant="secondary">
                横断ビューへ戻る
              </Button>
            </div>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.description}>
              プロジェクト番号: {project.projectNumber}
              <br />
              PM、進捗、体制、主システムをまとめて確認できる案件詳細です。
            </p>
            {relatedSystems.length > 0 ? (
              <div className={styles.systemChipList}>
                {relatedSystems.map((system) => (
                  <span className={styles.systemChip} key={system.id}>
                    主システム: {system.id} / {system.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
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
          <Button
            aria-expanded={isExpanded}
            data-testid="project-hero-toggle-button"
            onClick={() => setIsExpanded((current) => !current)}
            size="small"
            variant="secondary"
          >
            {isExpanded ? '詳細を折りたたむ' : '詳細を表示'}
          </Button>
          <div className={styles.heroBadgeGroup}>
            <StatusBadge status={project.status} />
            <span
              className={`${styles.phaseSummaryBadge} ${currentPhaseToneClassName}`}
              data-testid="hero-current-phase-badge"
            >
              フェーズ: {currentPhase?.name ?? '未設定'}
            </span>
            <span
              className={
                project.hasReportItems
                  ? `${styles.phaseSummaryBadge} ${styles.reportSummaryBadgeActive}`
                  : `${styles.phaseSummaryBadge} ${styles.reportSummaryBadgeInactive}`
              }
              data-testid="hero-report-status-badge"
            >
              報告事項: {project.hasReportItems ? 'あり' : 'なし'}
            </span>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <ProjectDetailMetaGrid
          currentPhase={currentPhase}
          currentPhaseChanged={currentPhaseChanged}
          currentPhaseDraftId={currentPhaseDraftId}
          currentPhaseError={currentPhaseError}
          isCurrentPhaseEditing={isCurrentPhaseEditing}
          isProjectLinksEditing={isProjectLinksEditing}
          isProjectNoteEditing={isProjectNoteEditing}
          isProjectReportStatusEditing={isProjectReportStatusEditing}
          isProjectStatusEditing={isProjectStatusEditing}
          isSavingCurrentPhase={isSavingCurrentPhase}
          isSavingProjectLinks={isSavingProjectLinks}
          isSavingProjectNote={isSavingProjectNote}
          isSavingProjectReportStatus={isSavingProjectReportStatus}
          isSavingProjectStatusOverride={isSavingProjectStatusOverride}
          isSavingSchedule={isSavingSchedule}
          isScheduleEditing={isScheduleEditing}
          onAddProjectLink={onAddProjectLink}
          onCurrentPhaseCancel={onCurrentPhaseCancel}
          onCurrentPhaseDraftChange={onCurrentPhaseDraftChange}
          onCurrentPhaseEdit={onCurrentPhaseEdit}
          onCurrentPhaseSave={onCurrentPhaseSave}
          onProjectLinksCancel={onProjectLinksCancel}
          onProjectLinkDraftChange={onProjectLinkDraftChange}
          onProjectLinksEdit={onProjectLinksEdit}
          onProjectLinksSave={onProjectLinksSave}
          onProjectNoteDraftChange={onProjectNoteDraftChange}
          onProjectNoteEdit={onProjectNoteEdit}
          onProjectNoteCancel={onProjectNoteCancel}
          onProjectNoteSave={onProjectNoteSave}
          onProjectReportStatusDraftChange={onProjectReportStatusDraftChange}
          onProjectReportStatusEdit={onProjectReportStatusEdit}
          onProjectReportStatusCancel={onProjectReportStatusCancel}
          onProjectReportStatusSave={onProjectReportStatusSave}
          onProjectStatusBulkApplyChange={onProjectStatusBulkApplyChange}
          onProjectStatusOverrideDraftChange={onProjectStatusOverrideDraftChange}
          onProjectStatusEdit={onProjectStatusEdit}
          onProjectStatusCancel={onProjectStatusCancel}
          onProjectStatusSave={onProjectStatusSave}
          onProjectSystemsCancel={onProjectSystemsCancel}
          onProjectSystemsEdit={onProjectSystemsEdit}
          onProjectSystemsSave={onProjectSystemsSave}
          onProjectSystemChange={onProjectSystemChange}
          onRemoveProjectLink={onRemoveProjectLink}
          onScheduleCancel={onScheduleCancel}
          onScheduleDraftChange={onScheduleDraftChange}
          onScheduleEdit={onScheduleEdit}
          onScheduleSave={onScheduleSave}
          pmName={pmName}
          project={project}
          projectLinksChanged={projectLinksChanged}
          projectLinksDraft={projectLinksDraft}
          projectLinksError={projectLinksError}
          projectNoteChanged={projectNoteChanged}
          projectNoteDraft={projectNoteDraft}
          projectNoteError={projectNoteError}
          projectReportStatusChanged={projectReportStatusChanged}
          projectReportStatusDraft={projectReportStatusDraft}
          projectReportStatusError={projectReportStatusError}
          projectStatusOverrideChanged={projectStatusOverrideChanged}
          projectStatusBulkApplyEnabled={projectStatusBulkApplyEnabled}
          projectStatusOverrideDraft={projectStatusOverrideDraft}
          projectStatusOverrideError={projectStatusOverrideError}
          projectPhases={projectPhases}
          projectSystemIdsDraft={projectSystemIdsDraft}
          projectSystemsChanged={projectSystemsChanged}
          projectSystemsError={projectSystemsError}
          availableSystems={availableSystems}
          isProjectSystemsEditing={isProjectSystemsEditing}
          isSavingProjectSystems={isSavingProjectSystems}
          scheduleChanged={scheduleChanged}
          scheduleDraft={scheduleDraft}
          scheduleError={scheduleError}
        />
      ) : null}
    </Panel>
  )
}
