import { useEffect, useState } from 'react'
import type { Phase, Project, ProjectLink } from '../../types/project'
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

export function useProjectSummaryEditor(
  project: Project | undefined,
  currentPhase: Phase | undefined,
  updateProjectCurrentPhase: UpdateProjectCurrentPhase,
  updateProjectSchedule: UpdateProjectSchedule,
  updateProjectLinks: UpdateProjectLinks,
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

  return {
    currentPhaseDraftId,
    currentPhaseChanged,
    currentPhaseError,
    isCurrentPhaseEditing,
    isProjectLinksEditing,
    isSavingCurrentPhase,
    isSavingProjectLinks,
    isSavingSchedule,
    isScheduleEditing,
    projectLinksChanged,
    projectLinksDraft,
    projectLinksError,
    scheduleChanged,
    scheduleDraft,
    scheduleError,
    addProjectLinkDraft,
    closeCurrentPhaseEditor,
    closeProjectLinksEditor,
    closeScheduleEditor,
    openCurrentPhaseEditor,
    openProjectLinksEditor,
    openScheduleEditor,
    removeProjectLinkDraft,
    saveCurrentPhase,
    saveProjectLinks,
    saveSchedule,
    setCurrentPhaseDraftId,
    setScheduleDraft,
    updateProjectLinkDraft,
  }
}
