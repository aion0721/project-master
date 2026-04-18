import { ListPageHero } from '../../components/ListPageHero'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectDepartmentAssignment,
  ProjectLink,
  ProjectStatusEntry,
  ProjectStatusOverride,
} from '../../types/project'
import { getPhaseToneKey } from '../../utils/projectPhasePresets'
import { ProjectDetailMetaGrid } from './ProjectDetailMetaGrid'
import type {
  ProjectDetailMetaGridProps,
  ProjectSummaryDraft,
  ScheduleDraft,
} from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

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
  projectDepartments: ProjectDepartmentAssignment[]
  availableDepartments: Array<{
    departmentCode: string
    departmentName: string
  }>
  isProjectDepartmentsEditing: boolean
  projectDepartmentDrafts: Array<{
    key: string
    id?: string
    departmentCode: string
    departmentName: string
    role: ProjectDepartmentAssignment['role']
    note: string
  }>
  projectDepartmentsChanged: boolean
  projectDepartmentsError: string | null
  isSavingProjectDepartments: boolean
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
  onAddProjectDepartment: () => void
  onProjectDepartmentDraftChange: (
    key: string,
    patch: Partial<{
      id?: string
      departmentCode: string
      departmentName: string
      role: ProjectDepartmentAssignment['role']
      note: string
    }>,
  ) => void
  onProjectDepartmentsEdit: () => void
  onProjectDepartmentsCancel: () => void
  onProjectDepartmentsSave: () => void
  onRemoveProjectDepartment: (key: string) => void
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
  projectDepartments,
  availableDepartments,
  isProjectDepartmentsEditing,
  projectDepartmentDrafts,
  projectDepartmentsChanged,
  projectDepartmentsError,
  isSavingProjectDepartments,
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
  onAddProjectDepartment,
  onProjectDepartmentDraftChange,
  onProjectDepartmentsEdit,
  onProjectDepartmentsCancel,
  onProjectDepartmentsSave,
  onRemoveProjectDepartment,
  onRemoveProjectLink,
  onRemoveProjectStatusEntry,
}: ProjectDetailHeroProps) {
  const metaGridProps: ProjectDetailMetaGridProps = {
    projectSummaryProps: {
      changed: projectSummaryChanged,
      draft: projectSummaryDraft,
      error: projectSummaryError,
      isEditing: isProjectSummaryEditing,
      isSaving: isSavingProjectSummary,
      onCancel: onProjectSummaryCancel,
      onDraftChange: onProjectSummaryDraftChange,
      onEdit: onProjectSummaryEdit,
      onSave: onProjectSummarySave,
      pmName,
      project,
    },
    scheduleProps: {
      changed: scheduleChanged,
      draft: scheduleDraft,
      error: scheduleError,
      isEditing: isScheduleEditing,
      isSaving: isSavingSchedule,
      onCancel: onScheduleCancel,
      onDraftChange: onScheduleDraftChange,
      onEdit: onScheduleEdit,
      onSave: onScheduleSave,
      project,
    },
    projectSystemProps: {
      availableSystems,
      changed: projectSystemsChanged,
      draftSystemIds: projectSystemIdsDraft,
      error: projectSystemsError,
      isEditing: isProjectSystemsEditing,
      isSaving: isSavingProjectSystems,
      onCancel: onProjectSystemsCancel,
      onEdit: onProjectSystemsEdit,
      onSave: onProjectSystemsSave,
      onSystemChange: onProjectSystemChange,
      project,
    },
    projectDepartmentsProps: {
      availableDepartments,
      changed: projectDepartmentsChanged,
      draft: projectDepartmentDrafts,
      error: projectDepartmentsError,
      isEditing: isProjectDepartmentsEditing,
      isSaving: isSavingProjectDepartments,
      onAdd: onAddProjectDepartment,
      onDraftChange: onProjectDepartmentDraftChange,
      onEdit: onProjectDepartmentsEdit,
      onCancel: onProjectDepartmentsCancel,
      onSave: onProjectDepartmentsSave,
      onRemove: onRemoveProjectDepartment,
      projectDepartments,
    },
    currentPhaseProps: {
      changed: currentPhaseChanged,
      currentPhase,
      draftId: currentPhaseDraftId,
      error: currentPhaseError,
      isEditing: isCurrentPhaseEditing,
      isSaving: isSavingCurrentPhase,
      onCancel: onCurrentPhaseCancel,
      onDraftChange: onCurrentPhaseDraftChange,
      onEdit: onCurrentPhaseEdit,
      onSave: onCurrentPhaseSave,
      projectPhases,
    },
    projectStatusProps: {
      bulkApplyEnabled: projectStatusBulkApplyEnabled,
      changed: projectStatusOverrideChanged,
      draft: projectStatusOverrideDraft,
      error: projectStatusOverrideError,
      isEditing: isProjectStatusEditing,
      isSaving: isSavingProjectStatusOverride,
      onBulkApplyChange: onProjectStatusBulkApplyChange,
      onCancel: onProjectStatusCancel,
      onDraftChange: onProjectStatusOverrideDraftChange,
      onEdit: onProjectStatusEdit,
      onSave: onProjectStatusSave,
      project,
    },
    projectNoteProps: {
      changed: projectNoteChanged,
      draft: projectNoteDraft,
      error: projectNoteError,
      isEditing: isProjectNoteEditing,
      isSaving: isSavingProjectNote,
      onCancel: onProjectNoteCancel,
      onDraftChange: onProjectNoteDraftChange,
      onEdit: onProjectNoteEdit,
      onSave: onProjectNoteSave,
      project,
    },
    projectLinksProps: {
      changed: projectLinksChanged,
      draft: projectLinksDraft,
      error: projectLinksError,
      isEditing: isProjectLinksEditing,
      isSaving: isSavingProjectLinks,
      onAdd: onAddProjectLink,
      onCancel: onProjectLinksCancel,
      onDraftChange: onProjectLinkDraftChange,
      onEdit: onProjectLinksEdit,
      onRemove: onRemoveProjectLink,
      onSave: onProjectLinksSave,
      project,
    },
    projectStatusEntriesProps: {
      changed: projectStatusEntriesChanged,
      draft: projectStatusEntriesDraft,
      error: projectStatusEntriesError,
      isEditing: isProjectStatusEntriesEditing,
      isSaving: isSavingProjectStatusEntries,
      onAdd: onAddProjectStatusEntry,
      onCancel: onProjectStatusEntriesCancel,
      onDraftChange: onProjectStatusEntryDraftChange,
      onEdit: onProjectStatusEntriesEdit,
      onMove: onProjectStatusEntryMove,
      onRemove: onRemoveProjectStatusEntry,
      onSave: onProjectStatusEntriesSave,
      project,
    },
    projectReportStatusProps: {
      changed: projectReportStatusChanged,
      draft: projectReportStatusDraft,
      error: projectReportStatusError,
      isEditing: isProjectReportStatusEditing,
      isSaving: isSavingProjectReportStatus,
      onCancel: onProjectReportStatusCancel,
      onDraftChange: onProjectReportStatusDraftChange,
      onEdit: onProjectReportStatusEdit,
      onSave: onProjectReportStatusSave,
      project,
    },
  }

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
        <ProjectDetailMetaGrid {...metaGridProps} />
    </ListPageHero>
  )
}
