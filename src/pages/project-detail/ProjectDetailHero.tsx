import { ListPageHero } from '../../components/ListPageHero'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectLink,
  ProjectStatusEntry,
  ProjectStatusOverride,
} from '../../types/project'
import { getPhaseToneKey } from '../../utils/projectPhasePresets'
import { ProjectDetailMetaGrid } from './ProjectDetailMetaGrid'
import styles from '../projects/ProjectDetailPage.module.css'

interface ScheduleDraft {
  startDate: string
  endDate: string
}

interface ProjectSummaryDraft {
  projectNumber: string
  name: string
}

interface ProjectDetailHeroProps {
  project: Project
  pmName?: string
  currentUser: unknown
  isBookmarked: boolean
  onToggleBookmark: () => void
  isScheduleEditing: boolean
  isProjectSummaryEditing: boolean
  scheduleDraft: ScheduleDraft
  projectSummaryDraft: ProjectSummaryDraft
  scheduleChanged: boolean
  projectSummaryChanged: boolean
  scheduleError: string | null
  projectSummaryError: string | null
  isSavingSchedule: boolean
  isSavingProjectSummary: boolean
  onProjectSummaryDraftChange: (patch: Partial<ProjectSummaryDraft>) => void
  onProjectSummaryEdit: () => void
  onProjectSummaryCancel: () => void
  onProjectSummarySave: () => void
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
  isProjectStatusEntriesEditing: boolean
  isProjectReportStatusEditing: boolean
  isProjectStatusEditing: boolean
  isProjectSystemsEditing: boolean
  projectLinksDraft: ProjectLink[]
  projectLinksChanged: boolean
  projectLinksError: string | null
  projectNoteChanged: boolean
  projectNoteDraft: string
  projectNoteError: string | null
  projectStatusEntriesChanged: boolean
  projectStatusEntriesDraft: ProjectStatusEntry[]
  projectStatusEntriesError: string | null
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
  isSavingProjectStatusEntries: boolean
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
  onAddProjectStatusEntry: () => void
  onProjectStatusEntryDraftChange: (index: number, patch: Partial<ProjectStatusEntry>) => void
  onProjectStatusEntryMove: (index: number, direction: 'up' | 'down') => void
  onProjectStatusEntriesEdit: () => void
  onProjectStatusEntriesCancel: () => void
  onProjectStatusEntriesSave: () => void
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
  onRemoveProjectStatusEntry: (index: number) => void
}

export function ProjectDetailHero({
  project,
  pmName,
  currentUser,
  isBookmarked,
  onToggleBookmark,
  isScheduleEditing,
  isProjectSummaryEditing,
  scheduleDraft,
  projectSummaryDraft,
  scheduleChanged,
  projectSummaryChanged,
  scheduleError,
  projectSummaryError,
  isSavingSchedule,
  isSavingProjectSummary,
  onProjectSummaryDraftChange,
  onProjectSummaryEdit,
  onProjectSummaryCancel,
  onProjectSummarySave,
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
  isProjectStatusEntriesEditing,
  isProjectReportStatusEditing,
  isProjectStatusEditing,
  isProjectSystemsEditing,
  projectLinksDraft,
  projectLinksChanged,
  projectLinksError,
  projectNoteDraft,
  projectNoteChanged,
  projectNoteError,
  projectStatusEntriesChanged,
  projectStatusEntriesDraft,
  projectStatusEntriesError,
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
  isSavingProjectStatusEntries,
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
  onAddProjectStatusEntry,
  onProjectStatusEntryDraftChange,
  onProjectStatusEntryMove,
  onProjectStatusEntriesEdit,
  onProjectStatusEntriesCancel,
  onProjectStatusEntriesSave,
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
  onRemoveProjectStatusEntry,
}: ProjectDetailHeroProps) {
  const currentPhaseToneClassName = currentPhase
    ? styles[`phaseSummaryBadge${getPhaseToneKey(currentPhase.name)}`]
    : styles.phaseSummaryBadgeDefaultTone

  return (
    <ListPageHero
      action={
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
      }
      className={styles.hero}
      collapsible
      collapseToggleTestId="project-hero-toggle-button"
      description={`プロジェクト番号: ${project.projectNumber}。基本情報、PM、進捗、体制、主システムをまとめて確認できる案件詳細です。`}
      descriptionSupplement={
        relatedSystems.length > 0 ? (
          <div className={styles.systemChipList}>
            {relatedSystems.map((system) => (
              <span className={styles.systemChip} key={system.id}>
                主システム: {system.id} / {system.name}
              </span>
            ))}
          </div>
        ) : null
      }
      eyebrow="Project Detail"
      iconKind="project"
      leadingContent={
        <div className={styles.backLinks}>
          <Button size="small" to="/projects" variant="secondary">
            案件一覧へ戻る
          </Button>
          <Button size="small" to="/cross-project" variant="secondary">
            横断ビューへ戻る
          </Button>
        </div>
      }
      stats={[]}
      storageKey="project-master:hero-collapsed:project-detail"
      title={project.name}
    >
        <ProjectDetailMetaGrid
          currentPhase={currentPhase}
          currentPhaseChanged={currentPhaseChanged}
          currentPhaseDraftId={currentPhaseDraftId}
          currentPhaseError={currentPhaseError}
          isCurrentPhaseEditing={isCurrentPhaseEditing}
          isProjectSummaryEditing={isProjectSummaryEditing}
          isProjectLinksEditing={isProjectLinksEditing}
          isProjectNoteEditing={isProjectNoteEditing}
          isProjectStatusEntriesEditing={isProjectStatusEntriesEditing}
          isProjectReportStatusEditing={isProjectReportStatusEditing}
          isProjectStatusEditing={isProjectStatusEditing}
          isSavingCurrentPhase={isSavingCurrentPhase}
          isSavingProjectSummary={isSavingProjectSummary}
          isSavingProjectLinks={isSavingProjectLinks}
          isSavingProjectNote={isSavingProjectNote}
          isSavingProjectStatusEntries={isSavingProjectStatusEntries}
          isSavingProjectReportStatus={isSavingProjectReportStatus}
          isSavingProjectStatusOverride={isSavingProjectStatusOverride}
          isSavingSchedule={isSavingSchedule}
          isScheduleEditing={isScheduleEditing}
          onProjectSummaryDraftChange={onProjectSummaryDraftChange}
          onProjectSummaryEdit={onProjectSummaryEdit}
          onProjectSummaryCancel={onProjectSummaryCancel}
          onProjectSummarySave={onProjectSummarySave}
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
          onAddProjectStatusEntry={onAddProjectStatusEntry}
          onProjectStatusEntryDraftChange={onProjectStatusEntryDraftChange}
          onProjectStatusEntryMove={onProjectStatusEntryMove}
          onProjectStatusEntriesEdit={onProjectStatusEntriesEdit}
          onProjectStatusEntriesCancel={onProjectStatusEntriesCancel}
          onProjectStatusEntriesSave={onProjectStatusEntriesSave}
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
          onRemoveProjectStatusEntry={onRemoveProjectStatusEntry}
          onScheduleCancel={onScheduleCancel}
          onScheduleDraftChange={onScheduleDraftChange}
          onScheduleEdit={onScheduleEdit}
          onScheduleSave={onScheduleSave}
          pmName={pmName}
          project={project}
          projectSummaryChanged={projectSummaryChanged}
          projectSummaryDraft={projectSummaryDraft}
          projectSummaryError={projectSummaryError}
          projectLinksChanged={projectLinksChanged}
          projectLinksDraft={projectLinksDraft}
          projectLinksError={projectLinksError}
          projectNoteChanged={projectNoteChanged}
          projectNoteDraft={projectNoteDraft}
          projectNoteError={projectNoteError}
          projectStatusEntriesChanged={projectStatusEntriesChanged}
          projectStatusEntriesDraft={projectStatusEntriesDraft}
          projectStatusEntriesError={projectStatusEntriesError}
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
    </ListPageHero>
  )
}
