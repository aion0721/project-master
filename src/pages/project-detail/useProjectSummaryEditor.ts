import { useEffect, useState } from 'react'
import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectLink,
  ProjectStatusOverride,
} from '../../types/project'
import { createEmptyProjectLink, validateProjectLinks } from '../../utils/projectLinkUtils'

interface UpdateProjectCurrentPhase {
  (projectId: string, phaseId: string): Promise<unknown>
}

interface UpdateProjectSchedule {
  (projectId: string, input: { startDate: string; endDate: string }): Promise<unknown>
}

interface UpdateProjectLinks {
  (projectId: string, input: { projectLinks: ProjectLink[] }): Promise<unknown>
}

interface UpdateProjectNote {
  (projectId: string, input: { note?: string | null }): Promise<unknown>
}

interface UpdateProjectReportStatus {
  (projectId: string, input: { hasReportItems: boolean }): Promise<unknown>
}

interface UpdateProjectStatusOverride {
  (projectId: string, input: { statusOverride?: ProjectStatusOverride | null }): Promise<unknown>
}

interface UpdateProjectSystems {
  (projectId: string, input: { relatedSystemIds: string[] }): Promise<unknown>
}

export function useProjectSummaryEditor(
  project: Project | undefined,
  currentPhase: Phase | undefined,
  availableSystems: ManagedSystem[],
  updateProjectCurrentPhase: UpdateProjectCurrentPhase,
  updateProjectSchedule: UpdateProjectSchedule,
  updateProjectLinks: UpdateProjectLinks,
  updateProjectNote: UpdateProjectNote,
  updateProjectReportStatus: UpdateProjectReportStatus,
  updateProjectStatusOverride: UpdateProjectStatusOverride,
  updateProjectSystems: UpdateProjectSystems,
) {
  const [isCurrentPhaseEditing, setIsCurrentPhaseEditing] = useState(false)
  const [currentPhaseDraftId, setCurrentPhaseDraftId] = useState('')
  const [currentPhaseError, setCurrentPhaseError] = useState<string | null>(null)
  const [isSavingCurrentPhase, setIsSavingCurrentPhase] = useState(false)

  const [isScheduleEditing, setIsScheduleEditing] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState({ startDate: '', endDate: '' })
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const [isProjectLinksEditing, setIsProjectLinksEditing] = useState(false)
  const [projectLinksDraft, setProjectLinksDraft] = useState<ProjectLink[]>([createEmptyProjectLink()])
  const [projectLinksError, setProjectLinksError] = useState<string | null>(null)
  const [isSavingProjectLinks, setIsSavingProjectLinks] = useState(false)

  const [isProjectNoteEditing, setIsProjectNoteEditing] = useState(false)
  const [projectNoteDraft, setProjectNoteDraft] = useState('')
  const [projectNoteError, setProjectNoteError] = useState<string | null>(null)
  const [isSavingProjectNote, setIsSavingProjectNote] = useState(false)

  const [isProjectReportStatusEditing, setIsProjectReportStatusEditing] = useState(false)
  const [projectReportStatusDraft, setProjectReportStatusDraft] = useState(false)
  const [projectReportStatusError, setProjectReportStatusError] = useState<string | null>(null)
  const [isSavingProjectReportStatus, setIsSavingProjectReportStatus] = useState(false)

  const [isProjectStatusEditing, setIsProjectStatusEditing] = useState(false)
  const [projectStatusOverrideDraft, setProjectStatusOverrideDraft] =
    useState<ProjectStatusOverride | null>(null)
  const [projectStatusOverrideError, setProjectStatusOverrideError] = useState<string | null>(null)
  const [isSavingProjectStatusOverride, setIsSavingProjectStatusOverride] = useState(false)

  const [isProjectSystemsEditing, setIsProjectSystemsEditing] = useState(false)
  const [projectSystemIdsDraft, setProjectSystemIdsDraft] = useState<string[]>([])
  const [projectSystemsError, setProjectSystemsError] = useState<string | null>(null)
  const [isSavingProjectSystems, setIsSavingProjectSystems] = useState(false)

  useEffect(() => {
    if (!project) {
      return
    }

    setScheduleDraft({ startDate: project.startDate, endDate: project.endDate })
    setScheduleError(null)
    setProjectLinksDraft(
      project.projectLinks.length > 0
        ? project.projectLinks.map((link) => ({ ...link }))
        : [createEmptyProjectLink()],
    )
    setProjectLinksError(null)
    setProjectNoteDraft(project.note ?? '')
    setProjectNoteError(null)
    setProjectReportStatusDraft(project.hasReportItems ?? false)
    setProjectReportStatusError(null)
    setProjectStatusOverrideDraft(project.statusOverride ?? null)
    setProjectStatusOverrideError(null)
    setProjectSystemIdsDraft([...(project.relatedSystemIds ?? [])])
    setProjectSystemsError(null)
  }, [project])

  useEffect(() => {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
  }, [currentPhase])

  const scheduleChanged = project
    ? scheduleDraft.startDate !== project.startDate || scheduleDraft.endDate !== project.endDate
    : false
  const projectLinksChanged = project
    ? JSON.stringify(validateProjectLinks(projectLinksDraft).links) !==
      JSON.stringify(project.projectLinks)
    : false
  const projectNoteChanged = (projectNoteDraft.trim() || '') !== (project?.note ?? '')
  const projectReportStatusChanged = projectReportStatusDraft !== (project?.hasReportItems ?? false)
  const projectStatusOverrideChanged =
    (projectStatusOverrideDraft ?? null) !== (project?.statusOverride ?? null)
  const projectSystemsChanged = project
    ? JSON.stringify([...projectSystemIdsDraft].sort()) !==
      JSON.stringify([...(project.relatedSystemIds ?? [])].sort())
    : false
  const currentPhaseChanged = currentPhaseDraftId !== (currentPhase?.id ?? '')

  function openScheduleEditor() {
    if (!project) {
      return
    }

    setScheduleDraft({ startDate: project.startDate, endDate: project.endDate })
    setScheduleError(null)
    setIsScheduleEditing(true)
  }

  function closeScheduleEditor() {
    if (!project) {
      return
    }

    setScheduleDraft({ startDate: project.startDate, endDate: project.endDate })
    setScheduleError(null)
    setIsScheduleEditing(false)
  }

  async function saveSchedule() {
    if (!project) {
      return
    }

    if (!scheduleDraft.startDate || !scheduleDraft.endDate) {
      setScheduleError('開始日と終了日を入力してください。')
      return
    }

    if (scheduleDraft.startDate > scheduleDraft.endDate) {
      setScheduleError('終了日は開始日以降で入力してください。')
      return
    }

    setIsSavingSchedule(true)
    setScheduleError(null)

    try {
      await updateProjectSchedule(project.projectNumber, scheduleDraft)
      setIsScheduleEditing(false)
    } catch (caughtError) {
      setScheduleError(caughtError instanceof Error ? caughtError.message : '期間の更新に失敗しました。')
    } finally {
      setIsSavingSchedule(false)
    }
  }

  function openCurrentPhaseEditor() {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
    setIsCurrentPhaseEditing(true)
  }

  function closeCurrentPhaseEditor() {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
    setIsCurrentPhaseEditing(false)
  }

  async function saveCurrentPhase() {
    if (!project) {
      return
    }

    if (!currentPhaseDraftId) {
      setCurrentPhaseError('現在フェーズを選択してください。')
      return
    }

    setIsSavingCurrentPhase(true)
    setCurrentPhaseError(null)

    try {
      await updateProjectCurrentPhase(project.projectNumber, currentPhaseDraftId)
      setIsCurrentPhaseEditing(false)
    } catch (caughtError) {
      setCurrentPhaseError(
        caughtError instanceof Error ? caughtError.message : '現在フェーズの更新に失敗しました。',
      )
    } finally {
      setIsSavingCurrentPhase(false)
    }
  }

  function openProjectLinksEditor() {
    setProjectLinksDraft(
      project && project.projectLinks.length > 0
        ? project.projectLinks.map((link) => ({ ...link }))
        : [createEmptyProjectLink()],
    )
    setProjectLinksError(null)
    setIsProjectLinksEditing(true)
  }

  function closeProjectLinksEditor() {
    setProjectLinksDraft(
      project && project.projectLinks.length > 0
        ? project.projectLinks.map((link) => ({ ...link }))
        : [createEmptyProjectLink()],
    )
    setProjectLinksError(null)
    setIsProjectLinksEditing(false)
  }

  function updateProjectLinkDraft(index: number, patch: Partial<ProjectLink>) {
    setProjectLinksDraft((current) =>
      current.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link)),
    )
  }

  function addProjectLinkDraft() {
    setProjectLinksDraft((current) => [...current, createEmptyProjectLink()])
  }

  function removeProjectLinkDraft(index: number) {
    setProjectLinksDraft((current) => {
      const nextLinks = current.filter((_, currentIndex) => currentIndex !== index)
      return nextLinks.length > 0 ? nextLinks : [createEmptyProjectLink()]
    })
  }

  async function saveProjectLinks() {
    if (!project) {
      return
    }

    const validatedLinks = validateProjectLinks(projectLinksDraft)

    if (validatedLinks.error) {
      setProjectLinksError(validatedLinks.error)
      return
    }

    setIsSavingProjectLinks(true)
    setProjectLinksError(null)

    try {
      await updateProjectLinks(project.projectNumber, { projectLinks: validatedLinks.links })
      setIsProjectLinksEditing(false)
    } catch (caughtError) {
      setProjectLinksError(
        caughtError instanceof Error ? caughtError.message : '案件リンクの更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectLinks(false)
    }
  }

  function openProjectNoteEditor() {
    setProjectNoteDraft(project?.note ?? '')
    setProjectNoteError(null)
    setIsProjectNoteEditing(true)
  }

  function closeProjectNoteEditor() {
    setProjectNoteDraft(project?.note ?? '')
    setProjectNoteError(null)
    setIsProjectNoteEditing(false)
  }

  async function saveProjectNote() {
    if (!project) {
      return
    }

    setIsSavingProjectNote(true)
    setProjectNoteError(null)

    try {
      await updateProjectNote(project.projectNumber, { note: projectNoteDraft.trim() || null })
      setIsProjectNoteEditing(false)
    } catch (caughtError) {
      setProjectNoteError(
        caughtError instanceof Error ? caughtError.message : '状況メモの保存に失敗しました。',
      )
    } finally {
      setIsSavingProjectNote(false)
    }
  }

  function openProjectReportStatusEditor() {
    setProjectReportStatusDraft(project?.hasReportItems ?? false)
    setProjectReportStatusError(null)
    setIsProjectReportStatusEditing(true)
  }

  function closeProjectReportStatusEditor() {
    setProjectReportStatusDraft(project?.hasReportItems ?? false)
    setProjectReportStatusError(null)
    setIsProjectReportStatusEditing(false)
  }

  async function saveProjectReportStatus() {
    if (!project) {
      return
    }

    setIsSavingProjectReportStatus(true)
    setProjectReportStatusError(null)

    try {
      await updateProjectReportStatus(project.projectNumber, {
        hasReportItems: projectReportStatusDraft,
      })
      setIsProjectReportStatusEditing(false)
    } catch (caughtError) {
      setProjectReportStatusError(
        caughtError instanceof Error ? caughtError.message : '報告事項の更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectReportStatus(false)
    }
  }

  function openProjectStatusEditor() {
    setProjectStatusOverrideDraft(project?.statusOverride ?? null)
    setProjectStatusOverrideError(null)
    setIsProjectStatusEditing(true)
  }

  function closeProjectStatusEditor() {
    setProjectStatusOverrideDraft(project?.statusOverride ?? null)
    setProjectStatusOverrideError(null)
    setIsProjectStatusEditing(false)
  }

  async function saveProjectStatusOverride() {
    if (!project) {
      return false
    }

    setIsSavingProjectStatusOverride(true)
    setProjectStatusOverrideError(null)

    try {
      await updateProjectStatusOverride(project.projectNumber, {
        statusOverride: projectStatusOverrideDraft,
      })
      setIsProjectStatusEditing(false)
      return true
    } catch (caughtError) {
      setProjectStatusOverrideError(
        caughtError instanceof Error ? caughtError.message : '案件状態の更新に失敗しました。',
      )
      return false
    } finally {
      setIsSavingProjectStatusOverride(false)
    }
  }

  function openProjectSystemsEditor() {
    setProjectSystemIdsDraft([...(project?.relatedSystemIds ?? [])])
    setProjectSystemsError(null)
    setIsProjectSystemsEditing(true)
  }

  function closeProjectSystemsEditor() {
    setProjectSystemIdsDraft([...(project?.relatedSystemIds ?? [])])
    setProjectSystemsError(null)
    setIsProjectSystemsEditing(false)
  }

  function setProjectSystemDraft(systemId: string) {
    setProjectSystemIdsDraft(systemId ? [systemId] : [])
    setProjectSystemsError(null)
  }

  async function saveProjectSystems() {
    if (!project) {
      return
    }

    const uniqueSystemIds = projectSystemIdsDraft[0] ? [projectSystemIdsDraft[0]] : []

    if (
      uniqueSystemIds.some((systemId) => !availableSystems.some((system) => system.id === systemId))
    ) {
      setProjectSystemsError('関連システムに正しい選択肢が含まれていません。')
      return
    }

    setIsSavingProjectSystems(true)
    setProjectSystemsError(null)

    try {
      await updateProjectSystems(project.projectNumber, { relatedSystemIds: uniqueSystemIds })
      setIsProjectSystemsEditing(false)
    } catch (caughtError) {
      setProjectSystemsError(
        caughtError instanceof Error ? caughtError.message : '主システムの更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectSystems(false)
    }
  }

  return {
    currentPhaseDraftId,
    currentPhaseChanged,
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
    projectSystemIdsDraft,
    projectSystemsChanged,
    projectSystemsError,
    scheduleChanged,
    scheduleDraft,
    scheduleError,
    addProjectLinkDraft,
    closeCurrentPhaseEditor,
    closeProjectLinksEditor,
    closeProjectNoteEditor,
    closeProjectReportStatusEditor,
    closeProjectStatusEditor,
    closeProjectSystemsEditor,
    closeScheduleEditor,
    openCurrentPhaseEditor,
    openProjectLinksEditor,
    openProjectNoteEditor,
    openProjectReportStatusEditor,
    openProjectStatusEditor,
    openProjectSystemsEditor,
    openScheduleEditor,
    removeProjectLinkDraft,
    saveCurrentPhase,
    saveProjectLinks,
    saveProjectNote,
    saveProjectReportStatus,
    saveProjectStatusOverride,
    saveProjectSystems,
    saveSchedule,
    setCurrentPhaseDraftId,
    setScheduleDraft,
    setProjectNoteDraft,
    setProjectReportStatusDraft,
    setProjectStatusOverrideDraft,
    setProjectSystemDraft,
    updateProjectLinkDraft,
  }
}
