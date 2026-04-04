import { useEffect, useState } from 'react'
import type { Phase, Project } from '../../types/project'
import { isValidOptionalUrl } from './projectDetailTypes'

interface UpdateProjectCurrentPhase {
  (projectId: string, phaseId: string): Promise<unknown>
}

interface UpdateProjectSchedule {
  (projectId: string, input: { startDate: string; endDate: string }): Promise<unknown>
}

interface UpdateProjectLink {
  (projectId: string, input: { projectLink: string }): Promise<unknown>
}

export function useProjectSummaryEditor(
  project: Project | undefined,
  currentPhase: Phase | undefined,
  updateProjectCurrentPhase: UpdateProjectCurrentPhase,
  updateProjectSchedule: UpdateProjectSchedule,
  updateProjectLink: UpdateProjectLink,
) {
  const [isCurrentPhaseEditing, setIsCurrentPhaseEditing] = useState(false)
  const [currentPhaseDraftId, setCurrentPhaseDraftId] = useState('')
  const [currentPhaseError, setCurrentPhaseError] = useState<string | null>(null)
  const [isSavingCurrentPhase, setIsSavingCurrentPhase] = useState(false)

  const [isScheduleEditing, setIsScheduleEditing] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState({ startDate: '', endDate: '' })
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const [isProjectLinkEditing, setIsProjectLinkEditing] = useState(false)
  const [projectLinkDraft, setProjectLinkDraft] = useState('')
  const [projectLinkError, setProjectLinkError] = useState<string | null>(null)
  const [isSavingProjectLink, setIsSavingProjectLink] = useState(false)

  useEffect(() => {
    if (!project) {
      return
    }

    setScheduleDraft({ startDate: project.startDate, endDate: project.endDate })
    setScheduleError(null)
    setProjectLinkDraft(project.projectLink ?? '')
    setProjectLinkError(null)
  }, [project])

  useEffect(() => {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
  }, [currentPhase])

  const scheduleChanged = project
    ? scheduleDraft.startDate !== project.startDate || scheduleDraft.endDate !== project.endDate
    : false
  const projectLinkChanged = project ? projectLinkDraft !== (project.projectLink ?? '') : false
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

  function openProjectLinkEditor() {
    setProjectLinkDraft(project?.projectLink ?? '')
    setProjectLinkError(null)
    setIsProjectLinkEditing(true)
  }

  function closeProjectLinkEditor() {
    setProjectLinkDraft(project?.projectLink ?? '')
    setProjectLinkError(null)
    setIsProjectLinkEditing(false)
  }

  async function saveProjectLink() {
    if (!project) {
      return
    }

    if (!isValidOptionalUrl(projectLinkDraft)) {
      setProjectLinkError('案件リンクは有効な URL を入力してください。')
      return
    }

    setIsSavingProjectLink(true)
    setProjectLinkError(null)

    try {
      await updateProjectLink(project.projectNumber, { projectLink: projectLinkDraft.trim() })
      setIsProjectLinkEditing(false)
    } catch (caughtError) {
      setProjectLinkError(
        caughtError instanceof Error ? caughtError.message : '案件リンクの更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectLink(false)
    }
  }

  return {
    currentPhaseDraftId,
    currentPhaseChanged,
    currentPhaseError,
    isCurrentPhaseEditing,
    isProjectLinkEditing,
    isSavingCurrentPhase,
    isSavingProjectLink,
    isSavingSchedule,
    isScheduleEditing,
    projectLinkChanged,
    projectLinkDraft,
    projectLinkError,
    scheduleChanged,
    scheduleDraft,
    scheduleError,
    closeCurrentPhaseEditor,
    closeProjectLinkEditor,
    closeScheduleEditor,
    openCurrentPhaseEditor,
    openProjectLinkEditor,
    openScheduleEditor,
    saveCurrentPhase,
    saveProjectLink,
    saveSchedule,
    setCurrentPhaseDraftId,
    setProjectLinkDraft,
    setScheduleDraft,
  }
}
