import { useParams } from 'react-router-dom'
import { PhaseTimeline } from '../components/PhaseTimeline'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import { ProjectDetailHero } from './project-detail/ProjectDetailHero'
import { ProjectPhaseSection } from './project-detail/ProjectPhaseSection'
import { ProjectStructureSection } from './project-detail/ProjectStructureSection'
import { useProjectDetailData } from './project-detail/useProjectDetailData'
import { useProjectPhaseEditor } from './project-detail/useProjectPhaseEditor'
import { useProjectStructureEditor } from './project-detail/useProjectStructureEditor'
import { useProjectSummaryEditor } from './project-detail/useProjectSummaryEditor'
import styles from './ProjectDetailPage.module.css'

export function ProjectDetailPage() {
  const { projectNumber } = useParams()
  const {
    projects,
    assignments,
    members,
    getProjectById,
    getProjectPhases,
    getProjectAssignments,
    isLoading,
    error,
    updateProjectCurrentPhase,
    updateProjectLinks,
    updateProjectPhases,
    updateProjectSchedule,
    updateProjectStructure,
  } = useProjectData()
  const { currentUser, toggleBookmark, isBookmarked } = useUserSession()

  const project = projectNumber ? getProjectById(projectNumber) : undefined
  const {
    currentPhase,
    editableAssignments,
    pm,
    projectAssignments,
    projectPhases,
    responsibilityOptions,
    workStatusOptions,
  } = useProjectDetailData({
    project,
    projects,
    members,
    assignments,
    getProjectPhases,
    getProjectAssignments,
  })

  const summaryEditor = useProjectSummaryEditor(
    project,
    currentPhase,
    updateProjectCurrentPhase,
    updateProjectSchedule,
    updateProjectLinks,
  )
  const phaseEditor = useProjectPhaseEditor(project, projectPhases, workStatusOptions, updateProjectPhases)
  const structureEditor = useProjectStructureEditor(
    project,
    editableAssignments,
    responsibilityOptions,
    updateProjectStructure,
  )

  if (isLoading) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を読み込み中です</h1>
        <p className={styles.notFoundText}>バックエンドから案件情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を取得できませんでした</h1>
        <p className={styles.notFoundText}>{error}</p>
        <Button size="small" to="/projects" variant="secondary">
          一覧へ戻る
        </Button>
      </Panel>
    )
  }

  if (!project) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件が見つかりません</h1>
        <p className={styles.notFoundText}>指定されたプロジェクト番号に該当する案件がありません。</p>
        <Button size="small" to="/projects" variant="secondary">
          一覧へ戻る
        </Button>
      </Panel>
    )
  }

  return (
    <div className={styles.page}>
      <ProjectDetailHero
        currentPhase={currentPhase}
        currentPhaseChanged={summaryEditor.currentPhaseChanged}
        currentPhaseDraftId={summaryEditor.currentPhaseDraftId}
        currentPhaseError={summaryEditor.currentPhaseError}
        currentUser={currentUser}
        isBookmarked={isBookmarked(project.projectNumber)}
        isCurrentPhaseEditing={summaryEditor.isCurrentPhaseEditing}
        isProjectLinksEditing={summaryEditor.isProjectLinksEditing}
        isSavingCurrentPhase={summaryEditor.isSavingCurrentPhase}
        isSavingProjectLinks={summaryEditor.isSavingProjectLinks}
        isSavingSchedule={summaryEditor.isSavingSchedule}
        isScheduleEditing={summaryEditor.isScheduleEditing}
        onAddProjectLink={summaryEditor.addProjectLinkDraft}
        onCurrentPhaseCancel={summaryEditor.closeCurrentPhaseEditor}
        onCurrentPhaseDraftChange={summaryEditor.setCurrentPhaseDraftId}
        onCurrentPhaseEdit={summaryEditor.openCurrentPhaseEditor}
        onCurrentPhaseSave={() => {
          void summaryEditor.saveCurrentPhase()
        }}
        onProjectLinkDraftChange={summaryEditor.updateProjectLinkDraft}
        onProjectLinksCancel={summaryEditor.closeProjectLinksEditor}
        onProjectLinksEdit={summaryEditor.openProjectLinksEditor}
        onProjectLinksSave={() => {
          void summaryEditor.saveProjectLinks()
        }}
        onRemoveProjectLink={summaryEditor.removeProjectLinkDraft}
        onScheduleCancel={summaryEditor.closeScheduleEditor}
        onScheduleDraftChange={(patch) => {
          summaryEditor.setScheduleDraft((current) => ({ ...current, ...patch }))
        }}
        onScheduleEdit={summaryEditor.openScheduleEditor}
        onScheduleSave={() => {
          void summaryEditor.saveSchedule()
        }}
        onToggleBookmark={() => {
          void toggleBookmark(project.projectNumber).catch(() => undefined)
        }}
        pmName={pm?.name}
        project={project}
        projectLinksChanged={summaryEditor.projectLinksChanged}
        projectLinksDraft={summaryEditor.projectLinksDraft}
        projectLinksError={summaryEditor.projectLinksError}
        projectPhases={projectPhases}
        scheduleChanged={summaryEditor.scheduleChanged}
        scheduleDraft={summaryEditor.scheduleDraft}
        scheduleError={summaryEditor.scheduleError}
      />

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              案件ごとのフェーズ進捗を週単位のガントチャート形式で表示します。
            </p>
          </div>
        </div>
        <PhaseTimeline project={project} phases={projectPhases} />
      </Panel>

      <div className={styles.detailGrid}>
        <ProjectPhaseSection
          isSavingPhaseStructure={phaseEditor.isSavingPhaseStructure}
          onAddPhase={phaseEditor.addPhaseDraft}
          onMovePhase={phaseEditor.movePhaseDraft}
          onRemovePhase={phaseEditor.removePhaseDraft}
          onSave={() => {
            void phaseEditor.savePhaseStructure()
          }}
          onUpdatePhase={phaseEditor.updatePhaseDraft}
          phaseDrafts={phaseEditor.phaseDrafts}
          phaseStructureError={phaseEditor.phaseStructureError}
          project={project}
          workStatusOptions={workStatusOptions}
        />

        <ProjectStructureSection
          isEditing={structureEditor.isStructureEditing}
          isSavingStructure={structureEditor.isSavingStructure}
          members={members}
          onAddAssignment={structureEditor.addStructureAssignment}
          onClose={structureEditor.closeStructureEditor}
          onOpen={structureEditor.openStructureEditor}
          onRemoveAssignment={structureEditor.removeStructureAssignment}
          onSave={() => {
            void structureEditor.saveStructure()
          }}
          onStructurePmChange={structureEditor.setStructurePmMemberId}
          onUpdateAssignment={structureEditor.updateStructureAssignment}
          pmMemberId={project.pmMemberId}
          projectAssignments={projectAssignments}
          responsibilityOptions={responsibilityOptions}
          structureAssignments={structureEditor.structureAssignments}
          structureChanged={structureEditor.structureChanged}
          structureError={structureEditor.structureError}
          structurePmMemberId={structureEditor.structurePmMemberId}
        />
      </div>
    </div>
  )
}
