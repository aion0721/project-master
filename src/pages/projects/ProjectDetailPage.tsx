import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PhaseTimeline } from '../../components/PhaseTimeline'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import { useUserSession } from '../../store/useUserSession'
import { ProjectDetailHero } from '../project-detail/ProjectDetailHero'
import { ProjectEventSection } from '../project-detail/ProjectEventSection'
import { ProjectPhaseSection } from '../project-detail/ProjectPhaseSection'
import { buildDraftPhaseForRange } from '../project-detail/projectDetailTypes'
import { ProjectStructureSection } from '../project-detail/ProjectStructureSection'
import { useProjectDetailData } from '../project-detail/useProjectDetailData'
import { useProjectEventEditor } from '../project-detail/useProjectEventEditor'
import { useProjectPhaseEditor } from '../project-detail/useProjectPhaseEditor'
import { useProjectStructureEditor } from '../project-detail/useProjectStructureEditor'
import { useProjectSummaryEditor } from '../project-detail/useProjectSummaryEditor'
import styles from './ProjectDetailPage.module.css'

export function ProjectDetailPage() {
  const { projectNumber } = useParams()
  const {
    assignments,
    members,
    systems,
    getProjectById,
    getProjectPhases,
    getProjectAssignments,
    getProjectEvents,
    isLoading,
    error,
    updateProjectCurrentPhase,
    updateProjectEvents,
    updateProjectLinks,
    updateProjectNote,
    updateProjectStatusEntries,
    updateProjectReportStatus,
    updateProjectStatusOverride,
    updatePhase,
    updateProjectSystems,
    updateProjectPhases,
    updateProjectSchedule,
    updateProjectStructure,
  } = useProjectData()
  const { currentUser, toggleBookmark, isBookmarked } = useUserSession()
  const [selectedTimelinePhaseId, setSelectedTimelinePhaseId] = useState<string | null>(null)
  const [projectStatusBulkApplyEnabled, setProjectStatusBulkApplyEnabled] = useState(false)
  const [timelineEditingRange, setTimelineEditingRange] = useState<{
    phaseId: string
    startWeek: number
    endWeek: number
  } | null>(null)

  const project = projectNumber ? getProjectById(projectNumber) : undefined
  const {
    currentPhase,
    editableAssignments,
    pm,
    projectEvents,
    projectAssignments,
    projectPhases,
    responsibilityOptions,
    workStatusOptions,
  } = useProjectDetailData({
    project,
    members,
    assignments,
    getProjectPhases,
    getProjectAssignments,
    getProjectEvents,
  })

  const summaryEditor = useProjectSummaryEditor(
    project,
    currentPhase,
    systems,
    updateProjectCurrentPhase,
    updateProjectSchedule,
    updateProjectLinks,
    updateProjectNote,
    updateProjectStatusEntries,
    updateProjectReportStatus,
    updateProjectStatusOverride,
    updateProjectSystems,
  )
  const phaseEditor = useProjectPhaseEditor(
    project,
    projectPhases,
    workStatusOptions,
    updatePhase,
    updateProjectPhases,
  )
  const eventEditor = useProjectEventEditor(
    project,
    projectEvents,
    workStatusOptions,
    members,
    updateProjectEvents,
  )
  const structureEditor = useProjectStructureEditor(
    project,
    editableAssignments,
    responsibilityOptions,
    updateProjectStructure,
  )

  const timelinePhases = useMemo(() => {
    if (!project) {
      return []
    }

    return phaseEditor.phaseDrafts.map((draft) =>
      buildDraftPhaseForRange(project.projectNumber, project.pmMemberId, draft),
    )
  }, [phaseEditor.phaseDrafts, project])

  const relatedSystems = useMemo(() => {
    if (!project) {
      return []
    }

    const primarySystemId = project.relatedSystemIds?.[0]
    return primarySystemId ? systems.filter((system) => system.id === primarySystemId) : []
  }, [project, systems])

  function handleTimelinePhaseSelect(phaseId: string) {
    if (selectedTimelinePhaseId === phaseId) {
      return
    }

    const phase = timelinePhases.find((item) => item.id === phaseId)

    if (!phase) {
      return
    }

    setSelectedTimelinePhaseId(phaseId)
    setTimelineEditingRange({
      phaseId,
      startWeek: phase.startWeek,
      endWeek: phase.endWeek,
    })
  }

  async function handleTimelinePhaseConfirm(phaseId: string) {
    if (selectedTimelinePhaseId !== phaseId) {
      return
    }

    const currentDraftOrder = phaseEditor.phaseDrafts.map((phase) => phase.id ?? phase.key)
    const savedPhaseOrder = projectPhases.map((phase) => phase.id)
    const hasOrderChanges =
      currentDraftOrder.length !== savedPhaseOrder.length ||
      currentDraftOrder.some((phaseKey, index) => phaseKey !== savedPhaseOrder[index])

    const saved = hasOrderChanges
      ? await phaseEditor.savePhaseStructure()
      : await phaseEditor.savePhaseRange(phaseId)

    if (!saved) {
      return
    }

    setSelectedTimelinePhaseId(null)
    setTimelineEditingRange(null)
  }

  function handleTimelinePhaseCancel(phaseId: string) {
    if (!timelineEditingRange || timelineEditingRange.phaseId !== phaseId) {
      setSelectedTimelinePhaseId(null)
      setTimelineEditingRange(null)
      return
    }

    phaseEditor.updatePhaseDraftRange(phaseId, {
      startWeek: timelineEditingRange.startWeek,
      endWeek: timelineEditingRange.endWeek,
    })
    setSelectedTimelinePhaseId(null)
    setTimelineEditingRange(null)
  }

  async function handleProjectStatusSave() {
    const nextStatus = summaryEditor.projectStatusOverrideDraft
    const shouldApplyToAllPhases =
      projectStatusBulkApplyEnabled && (nextStatus === '未着手' || nextStatus === '完了')

    if (shouldApplyToAllPhases) {
      const phasesSaved = await phaseEditor.applyStatusToAllPhases(nextStatus)

      if (!phasesSaved) {
        return
      }
    }

    const statusSaved = await summaryEditor.saveProjectStatusOverride()

    if (statusSaved) {
      setProjectStatusBulkApplyEnabled(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を読み込み中です</h1>
        <p className={styles.notFoundText}>
          バックエンドから案件情報を取得しています。
        </p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を表示できませんでした</h1>
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
        <p className={styles.notFoundText}>
          指定されたプロジェクト番号に該当する案件がありません。
        </p>
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
        onProjectNoteDraftChange={summaryEditor.setProjectNoteDraft}
        onProjectNoteEdit={summaryEditor.openProjectNoteEditor}
        onProjectNoteCancel={summaryEditor.closeProjectNoteEditor}
        onProjectNoteSave={() => {
          void summaryEditor.saveProjectNote()
        }}
        onAddProjectStatusEntry={summaryEditor.addProjectStatusEntryDraft}
        onProjectReportStatusDraftChange={summaryEditor.setProjectReportStatusDraft}
        onProjectReportStatusEdit={summaryEditor.openProjectReportStatusEditor}
        onProjectReportStatusCancel={summaryEditor.closeProjectReportStatusEditor}
        onProjectReportStatusSave={() => {
          void summaryEditor.saveProjectReportStatus()
        }}
        onProjectStatusOverrideDraftChange={summaryEditor.setProjectStatusOverrideDraft}
        onProjectStatusEdit={() => {
          setProjectStatusBulkApplyEnabled(false)
          summaryEditor.openProjectStatusEditor()
        }}
        onProjectStatusCancel={() => {
          setProjectStatusBulkApplyEnabled(false)
          summaryEditor.closeProjectStatusEditor()
        }}
        onProjectStatusSave={() => {
          void handleProjectStatusSave()
        }}
        onProjectStatusEntriesCancel={summaryEditor.closeProjectStatusEntriesEditor}
        onProjectStatusEntryDraftChange={summaryEditor.updateProjectStatusEntryDraft}
        onProjectStatusEntriesEdit={summaryEditor.openProjectStatusEntriesEditor}
        onProjectStatusEntryMove={summaryEditor.moveProjectStatusEntryDraft}
        onProjectStatusEntriesSave={() => {
          void summaryEditor.saveProjectStatusEntries()
        }}
        onProjectStatusBulkApplyChange={setProjectStatusBulkApplyEnabled}
        onProjectSystemsCancel={summaryEditor.closeProjectSystemsEditor}
        onProjectSystemsEdit={summaryEditor.openProjectSystemsEditor}
        onProjectSystemsSave={() => {
          void summaryEditor.saveProjectSystems()
        }}
        onProjectSystemChange={summaryEditor.setProjectSystemDraft}
        onRemoveProjectLink={summaryEditor.removeProjectLinkDraft}
        onRemoveProjectStatusEntry={summaryEditor.removeProjectStatusEntryDraft}
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
        projectNoteChanged={summaryEditor.projectNoteChanged}
        projectNoteDraft={summaryEditor.projectNoteDraft}
        projectNoteError={summaryEditor.projectNoteError}
        projectStatusEntriesChanged={summaryEditor.projectStatusEntriesChanged}
        projectStatusEntriesDraft={summaryEditor.projectStatusEntriesDraft}
        projectStatusEntriesError={summaryEditor.projectStatusEntriesError}
        projectReportStatusChanged={summaryEditor.projectReportStatusChanged}
        projectReportStatusDraft={summaryEditor.projectReportStatusDraft}
        projectReportStatusError={summaryEditor.projectReportStatusError}
        projectStatusOverrideChanged={summaryEditor.projectStatusOverrideChanged}
        projectStatusBulkApplyEnabled={projectStatusBulkApplyEnabled}
        projectStatusOverrideDraft={summaryEditor.projectStatusOverrideDraft}
        projectStatusOverrideError={summaryEditor.projectStatusOverrideError}
        projectPhases={projectPhases}
        projectSystemIdsDraft={summaryEditor.projectSystemIdsDraft}
        projectSystemsChanged={summaryEditor.projectSystemsChanged}
        projectSystemsError={summaryEditor.projectSystemsError}
        availableSystems={systems}
        isProjectSystemsEditing={summaryEditor.isProjectSystemsEditing}
        isProjectNoteEditing={summaryEditor.isProjectNoteEditing}
        isProjectStatusEntriesEditing={summaryEditor.isProjectStatusEntriesEditing}
        isProjectReportStatusEditing={summaryEditor.isProjectReportStatusEditing}
        isProjectStatusEditing={summaryEditor.isProjectStatusEditing}
        isSavingProjectSystems={summaryEditor.isSavingProjectSystems}
        isSavingProjectNote={summaryEditor.isSavingProjectNote}
        isSavingProjectStatusEntries={summaryEditor.isSavingProjectStatusEntries}
        isSavingProjectReportStatus={summaryEditor.isSavingProjectReportStatus}
        isSavingProjectStatusOverride={summaryEditor.isSavingProjectStatusOverride}
        relatedSystems={relatedSystems}
        scheduleChanged={summaryEditor.scheduleChanged}
        scheduleDraft={summaryEditor.scheduleDraft}
        scheduleError={summaryEditor.scheduleError}
      />

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              行を選ぶと左右端のハンドルで週単位の期間調整ができます。変更内容は下のフェーズ編集と共通で、「フェーズ構成を保存」で反映します。
            </p>
          </div>
        </div>
        <PhaseTimeline
          editable
          events={projectEvents}
          onPhaseCancel={handleTimelinePhaseCancel}
          onPhaseConfirm={(phaseId) => {
            void handleTimelinePhaseConfirm(phaseId)
          }}
          onPhaseMove={phaseEditor.movePhaseDraft}
          onPhaseResize={(phaseId, nextRange) => {
            phaseEditor.updatePhaseDraftRange(phaseId, nextRange)
          }}
          onPhaseSelect={handleTimelinePhaseSelect}
          phases={timelinePhases}
          project={project}
          selectedPhaseId={selectedTimelinePhaseId}
        />
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

      <ProjectEventSection
        eventDrafts={eventEditor.eventDrafts}
        eventError={eventEditor.eventError}
        isSavingEvents={eventEditor.isSavingEvents}
        members={members}
        onAddEvent={eventEditor.addEventDraft}
        onRemoveEvent={eventEditor.removeEventDraft}
        onSave={() => {
          void eventEditor.saveEvents()
        }}
        onUpdateEvent={eventEditor.updateEventDraft}
        projectPhases={projectPhases}
        workStatusOptions={workStatusOptions}
      />
    </div>
  )
}
