import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PhaseTimeline } from '../../components/PhaseTimeline'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import { useUserSession } from '../../store/useUserSession'
import { ProjectDetailHero } from '../project-detail/ProjectDetailHero'
import { ProjectEventSection } from '../project-detail/ProjectEventSection'
import { ProjectPhaseSection } from '../project-detail/ProjectPhaseSection'
import { buildDraftPhaseForRange } from '../project-detail/projectDetailTypes'
import type { PhaseFormState } from '../project-detail/projectDetailTypes'
import { ProjectStructureSection } from '../project-detail/ProjectStructureSection'
import { useProjectDetailData } from '../project-detail/useProjectDetailData'
import { useProjectEventEditor } from '../project-detail/useProjectEventEditor'
import { useProjectPhaseEditor } from '../project-detail/useProjectPhaseEditor'
import { useProjectStructureEditor } from '../project-detail/useProjectStructureEditor'
import { useProjectSummaryEditor } from '../project-detail/useProjectSummaryEditor'
import styles from './ProjectDetailPage.module.css'

export function ProjectDetailPage() {
  const { projectNumber } = useParams()
  const navigate = useNavigate()
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
    updateProjectSummary,
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
  const [isPhaseEditingEnabled, setIsPhaseEditingEnabled] = useState(false)
  const [timelineEditingRange, setTimelineEditingRange] = useState<{
    phaseId: string
    startWeek: number
    endWeek: number
  } | null>(null)
  const [timelineEditingSnapshot, setTimelineEditingSnapshot] = useState<PhaseFormState[] | null>(
    null,
  )

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
    updateProjectSummary,
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

  function clonePhaseDrafts() {
    return phaseEditor.phaseDrafts.map((phase) => ({ ...phase }))
  }

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
    setTimelineEditingSnapshot(clonePhaseDrafts())
  }

  function clearTimelineEditing() {
    setSelectedTimelinePhaseId(null)
    setTimelineEditingRange(null)
    setTimelineEditingSnapshot(null)
  }

  function handleTogglePhaseEditing() {
    if (isPhaseEditingEnabled) {
      clearTimelineEditing()
      setIsPhaseEditingEnabled(false)
      return
    }

    setIsPhaseEditingEnabled(true)
  }

  function handleTimelinePhaseAdd() {
    const nextDraft = phaseEditor.addPhaseDraft()

    setTimelineEditingSnapshot(clonePhaseDrafts())
    setSelectedTimelinePhaseId(nextDraft.key)
    setTimelineEditingRange({
      phaseId: nextDraft.key,
      startWeek: Number(nextDraft.startWeek) || 1,
      endWeek: Number(nextDraft.endWeek) || 1,
    })
  }

  function handleTimelinePhaseStatusChange(phaseId: string, status: (typeof workStatusOptions)[number]) {
    const targetPhase = phaseEditor.phaseDrafts.find((phase) => (phase.id ?? phase.key) === phaseId)

    if (!targetPhase) {
      return
    }

    phaseEditor.updatePhaseDraft(targetPhase.key, {
      status,
      progress: status === '完了' ? '100' : status === '未着手' ? '0' : targetPhase.progress,
    })
  }

  function handleTimelinePhaseRemove(phaseId: string) {
    const phaseIndex = phaseEditor.phaseDrafts.findIndex((phase) => (phase.id ?? phase.key) === phaseId)

    if (phaseIndex < 0) {
      return
    }

    const targetPhase = phaseEditor.phaseDrafts[phaseIndex]

    if (!targetPhase) {
      return
    }

    const phaseLabel = targetPhase.name || '新規フェーズ'

    if (!window.confirm(`フェーズ「${phaseLabel}」を削除しますか？`)) {
      return
    }

    const nextDrafts = phaseEditor.phaseDrafts.filter((phase) => phase.key !== targetPhase.key)
    const nextSelectedPhase =
      nextDrafts[phaseIndex] ?? nextDrafts[Math.max(phaseIndex - 1, 0)] ?? null

    if (!timelineEditingSnapshot) {
      setTimelineEditingSnapshot(clonePhaseDrafts())
    }

    phaseEditor.removePhaseDraft(targetPhase.key)

    if (!nextSelectedPhase) {
      clearTimelineEditing()
      return
    }

    setSelectedTimelinePhaseId(nextSelectedPhase.id ?? nextSelectedPhase.key)
    setTimelineEditingRange({
      phaseId: nextSelectedPhase.id ?? nextSelectedPhase.key,
      startWeek: Number(nextSelectedPhase.startWeek) || 1,
      endWeek: Number(nextSelectedPhase.endWeek) || 1,
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

    clearTimelineEditing()
  }

  function handleTimelinePhaseCancel(phaseId: string) {
    if (!timelineEditingRange || !timelineEditingSnapshot) {
      clearTimelineEditing()
      return
    }

    if (timelineEditingRange.phaseId !== phaseId && selectedTimelinePhaseId !== phaseId) {
      clearTimelineEditing()
      return
    }

    phaseEditor.replacePhaseDrafts(timelineEditingSnapshot)
    clearTimelineEditing()
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

  async function handleProjectSummarySave() {
    const updatedProject = await summaryEditor.saveProjectSummary()

    if (updatedProject && updatedProject.projectNumber !== project?.projectNumber) {
      navigate(`/projects/${updatedProject.projectNumber}`, { replace: true })
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
        isProjectSummaryEditing={summaryEditor.isProjectSummaryEditing}
        isProjectLinksEditing={summaryEditor.isProjectLinksEditing}
        isSavingCurrentPhase={summaryEditor.isSavingCurrentPhase}
        isSavingProjectSummary={summaryEditor.isSavingProjectSummary}
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
        onProjectSummaryDraftChange={(patch) => {
          summaryEditor.setProjectSummaryDraft((current) => ({ ...current, ...patch }))
        }}
        onProjectSummaryEdit={summaryEditor.openProjectSummaryEditor}
        onProjectSummaryCancel={summaryEditor.closeProjectSummaryEditor}
        onProjectSummarySave={() => {
          void handleProjectSummarySave()
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
        projectSummaryChanged={summaryEditor.projectSummaryChanged}
        projectSummaryDraft={summaryEditor.projectSummaryDraft}
        projectSummaryError={summaryEditor.projectSummaryError}
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
              行を選ぶと状態変更、削除、並び替え、週単位の期間調整ができます。フェーズ追加もここから始められ、詳細な名称編集だけ下の補助テーブルで扱います。
            </p>
          </div>
          <div className={styles.phaseSectionControls}>
            <span
              className={
                isPhaseEditingEnabled ? styles.phaseEditStatusOn : styles.phaseEditStatusOff
              }
            >
              編集: {isPhaseEditingEnabled ? 'ON' : 'OFF'}
            </span>
            <Button
              data-testid="phase-editor-toggle"
              onClick={handleTogglePhaseEditing}
              size="small"
              variant="secondary"
            >
              {isPhaseEditingEnabled ? '編集を閉じる' : '編集を開く'}
            </Button>
            {isPhaseEditingEnabled ? (
              <Button onClick={handleTimelinePhaseAdd} size="small" variant="secondary">
                フェーズを追加
              </Button>
            ) : null}
          </div>
        </div>
        {phaseEditor.phaseStructureError && !isPhaseEditingEnabled ? (
          <p className={styles.sectionError}>{phaseEditor.phaseStructureError}</p>
        ) : null}
        <PhaseTimeline
          editable={isPhaseEditingEnabled}
          events={projectEvents}
          onPhaseCancel={isPhaseEditingEnabled ? handleTimelinePhaseCancel : undefined}
          onPhaseConfirm={(phaseId) => {
            void handleTimelinePhaseConfirm(phaseId)
          }}
          onPhaseMove={isPhaseEditingEnabled ? phaseEditor.movePhaseDraft : undefined}
          onPhaseRemove={isPhaseEditingEnabled ? handleTimelinePhaseRemove : undefined}
          onPhaseResize={(phaseId, nextRange) => {
            phaseEditor.updatePhaseDraftRange(phaseId, nextRange)
          }}
          onPhaseSelect={isPhaseEditingEnabled ? handleTimelinePhaseSelect : undefined}
          onPhaseStatusChange={isPhaseEditingEnabled ? handleTimelinePhaseStatusChange : undefined}
          phases={timelinePhases}
          project={project}
          selectedPhaseId={isPhaseEditingEnabled ? selectedTimelinePhaseId : null}
          workStatusOptions={workStatusOptions}
        />
        {isPhaseEditingEnabled ? (
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
        ) : null}
      </Panel>

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
        project={project}
        workStatusOptions={workStatusOptions}
      />
    </div>
  )
}
