import { EntityIcon } from '../../components/EntityIcon'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import pageStyles from '../../styles/page.module.css'
import type { ManagedSystem, Phase, Project, ProjectLink } from '../../types/project'
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
  projectSystemIdsDraft: string[]
  projectSystemsChanged: boolean
  projectSystemsError: string | null
  isSavingProjectLinks: boolean
  isSavingProjectNote: boolean
  isSavingProjectReportStatus: boolean
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
  projectSystemIdsDraft,
  projectSystemsChanged,
  projectSystemsError,
  isSavingProjectLinks,
  isSavingProjectNote,
  isSavingProjectReportStatus,
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
  onProjectSystemsEdit,
  onProjectSystemsCancel,
  onProjectSystemsSave,
  onProjectSystemChange,
  onRemoveProjectLink,
}: ProjectDetailHeroProps) {
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
          <StatusBadge status={project.status} />
        </div>
      </div>

      <ProjectDetailMetaGrid
        currentPhase={currentPhase}
        currentPhaseChanged={currentPhaseChanged}
        currentPhaseDraftId={currentPhaseDraftId}
        currentPhaseError={currentPhaseError}
        isCurrentPhaseEditing={isCurrentPhaseEditing}
        isProjectLinksEditing={isProjectLinksEditing}
        isProjectNoteEditing={isProjectNoteEditing}
        isProjectReportStatusEditing={isProjectReportStatusEditing}
        isSavingCurrentPhase={isSavingCurrentPhase}
        isSavingProjectLinks={isSavingProjectLinks}
        isSavingProjectNote={isSavingProjectNote}
        isSavingProjectReportStatus={isSavingProjectReportStatus}
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
    </Panel>
  )
}
