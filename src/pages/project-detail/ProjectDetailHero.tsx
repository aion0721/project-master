import { Link } from 'react-router-dom'
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
  isProjectSystemsEditing: boolean
  projectLinksDraft: ProjectLink[]
  projectLinksChanged: boolean
  projectLinksError: string | null
  projectSystemIdsDraft: string[]
  projectSystemsChanged: boolean
  projectSystemsError: string | null
  isSavingProjectLinks: boolean
  isSavingProjectSystems: boolean
  onAddProjectLink: () => void
  onProjectLinkDraftChange: (index: number, patch: Partial<ProjectLink>) => void
  onProjectLinksEdit: () => void
  onProjectLinksCancel: () => void
  onProjectLinksSave: () => void
  onProjectSystemsEdit: () => void
  onProjectSystemsCancel: () => void
  onProjectSystemsSave: () => void
  onProjectSystemToggle: (systemId: string) => void
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
  isProjectSystemsEditing,
  projectLinksDraft,
  projectLinksChanged,
  projectLinksError,
  projectSystemIdsDraft,
  projectSystemsChanged,
  projectSystemsError,
  isSavingProjectLinks,
  isSavingProjectSystems,
  onAddProjectLink,
  onProjectLinkDraftChange,
  onProjectLinksEdit,
  onProjectLinksCancel,
  onProjectLinksSave,
  onProjectSystemsEdit,
  onProjectSystemsCancel,
  onProjectSystemsSave,
  onProjectSystemToggle,
  onRemoveProjectLink,
}: ProjectDetailHeroProps) {
  return (
    <Panel className={styles.hero} variant="hero">
      <div className={styles.heroTop}>
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="project" />
          <div className={pageStyles.heroHeadingBody}>
            <Link className={styles.backTextLink} to="/projects">
              案件一覧へ戻る
            </Link>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.description}>
              プロジェクト番号: {project.projectNumber}
              <br />
              PM、進捗、体制、関連システムをまとめて確認できる案件詳細です。
            </p>
            {relatedSystems.length > 0 ? (
              <div className={styles.systemChipList}>
                {relatedSystems.map((system) => (
                  <span className={styles.systemChip} key={system.id}>
                    {system.name}
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
        isSavingCurrentPhase={isSavingCurrentPhase}
        isSavingProjectLinks={isSavingProjectLinks}
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
        onProjectSystemsCancel={onProjectSystemsCancel}
        onProjectSystemsEdit={onProjectSystemsEdit}
        onProjectSystemsSave={onProjectSystemsSave}
        onProjectSystemToggle={onProjectSystemToggle}
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
