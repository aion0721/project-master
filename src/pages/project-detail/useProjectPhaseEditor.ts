import { useEffect, useState } from 'react'
import type { Phase, Project, UpdatePhaseInput, WorkStatus } from '../../types/project'
import { getProjectTotalWeeks } from '../../utils/projectUtils'
import { buildPhaseFormState, type PhaseFormState } from './projectDetailTypes'
import { createNewPhaseDraft, normalizePhaseDrafts } from './phaseEditorUtils'

interface UpdateProjectPhases {
  (
    projectId: string,
    input: {
      phases: Array<{
        id?: string
        name: string
        startWeek: number
        endWeek: number
        status: WorkStatus
        progress: number
      }>
    },
  ): Promise<unknown>
}

interface UpdatePhase {
  (phaseId: string, input: UpdatePhaseInput): Promise<unknown>
}

type BulkApplicablePhaseStatus = Extract<WorkStatus, '未着手' | '完了'>

const FALLBACK_SAVE_ERROR = 'フェーズ更新の保存に失敗しました。'
const MISSING_PHASE_ERROR = '対象のフェーズが見つかりません。'

export function useProjectPhaseEditor(
  project: Project | undefined,
  projectPhases: Phase[],
  workStatusOptions: WorkStatus[],
  updatePhase: UpdatePhase,
  updateProjectPhases: UpdateProjectPhases,
) {
  const [phaseDrafts, setPhaseDrafts] = useState<PhaseFormState[]>([])
  const [phaseStructureError, setPhaseStructureError] = useState<string | null>(null)
  const [isSavingPhaseStructure, setIsSavingPhaseStructure] = useState(false)

  useEffect(() => {
    setPhaseDrafts(projectPhases.map(buildPhaseFormState))
    setPhaseStructureError(null)
  }, [projectPhases])

  function updatePhaseDraft(key: string, patch: Partial<PhaseFormState>) {
    setPhaseDrafts((current) =>
      current.map((phase) => (phase.key === key ? { ...phase, ...patch } : phase)),
    )
  }

  function replacePhaseDrafts(nextDrafts: PhaseFormState[]) {
    setPhaseDrafts(nextDrafts)
    setPhaseStructureError(null)
  }

  function updatePhaseDraftRange(
    key: string,
    nextRange: {
      startWeek: number
      endWeek: number
    },
  ) {
    setPhaseDrafts((current) =>
      current.map((phase) => {
        if (phase.key !== key) {
          return phase
        }

        return {
          ...phase,
          startWeek: String(nextRange.startWeek),
          endWeek: String(nextRange.endWeek),
        }
      }),
    )
    setPhaseStructureError(null)
  }

  function addPhaseDraft() {
    const nextDraft = createNewPhaseDraft(phaseDrafts, workStatusOptions, project)

    setPhaseDrafts((current) => [...current, nextDraft])
    setPhaseStructureError(null)

    return nextDraft
  }

  function removePhaseDraft(key: string) {
    setPhaseDrafts((current) => current.filter((phase) => phase.key !== key))
    setPhaseStructureError(null)
  }

  function movePhaseDraft(key: string, direction: 'up' | 'down') {
    setPhaseDrafts((current) => {
      const index = current.findIndex((phase) => phase.key === key)

      if (index < 0) {
        return current
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)

      if (!moved) {
        return current
      }

      next.splice(targetIndex, 0, moved)
      return next
    })
    setPhaseStructureError(null)
  }

  async function savePhaseStructure() {
    if (!project) {
      return false
    }

    const { phases: normalizedPhases, error } = normalizePhaseDrafts(phaseDrafts, project)

    if (error) {
      setPhaseStructureError(error)
      return false
    }

    setIsSavingPhaseStructure(true)
    setPhaseStructureError(null)

    try {
      await updateProjectPhases(project.projectNumber, { phases: normalizedPhases })
      return true
    } catch (caughtError) {
      setPhaseStructureError(
        caughtError instanceof Error ? caughtError.message : FALLBACK_SAVE_ERROR,
      )
      return false
    } finally {
      setIsSavingPhaseStructure(false)
    }
  }

  async function savePhaseRange(key: string) {
    if (!project) {
      return false
    }

    const targetPhase = phaseDrafts.find((phase) => phase.key === key)

    if (!targetPhase) {
      setPhaseStructureError(MISSING_PHASE_ERROR)
      return false
    }

    if (!targetPhase.id) {
      return savePhaseStructure()
    }

    const startWeek = Number(targetPhase.startWeek)
    const endWeek = Number(targetPhase.endWeek)
    const progress = Number(targetPhase.progress)
    const maxWeek = getProjectTotalWeeks(project)

    if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
      setPhaseStructureError(`「${targetPhase.name || 'フェーズ'}」の開始週・終了週が不正です。`)
      return false
    }

    if (startWeek > maxWeek || endWeek > maxWeek) {
      setPhaseStructureError(
        `「${targetPhase.name || 'フェーズ'}」の開始週・終了週は案件期間内の W1 - W${maxWeek} で入力してください。`,
      )
      return false
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setPhaseStructureError(`「${targetPhase.name || 'フェーズ'}」の進捗率は 0 から 100 で入力してください。`)
      return false
    }

    setIsSavingPhaseStructure(true)
    setPhaseStructureError(null)

    try {
      await updatePhase(targetPhase.id, {
        startWeek,
        endWeek,
        status: targetPhase.status,
        progress,
      })
      return true
    } catch (caughtError) {
      setPhaseStructureError(
        caughtError instanceof Error ? caughtError.message : FALLBACK_SAVE_ERROR,
      )
      return false
    } finally {
      setIsSavingPhaseStructure(false)
    }
  }

  async function applyStatusToAllPhases(status: BulkApplicablePhaseStatus) {
    if (!project) {
      return false
    }

    const nextProgress = status === '完了' ? '100' : '0'
    const nextPhaseDrafts = phaseDrafts.map((phase) => ({
      ...phase,
      status,
      progress: nextProgress,
    }))
    const { phases: normalizedPhases, error } = normalizePhaseDrafts(nextPhaseDrafts, project)

    if (error) {
      setPhaseStructureError(error)
      return false
    }

    setIsSavingPhaseStructure(true)
    setPhaseStructureError(null)

    try {
      await updateProjectPhases(project.projectNumber, { phases: normalizedPhases })
      setPhaseDrafts(nextPhaseDrafts)
      return true
    } catch (caughtError) {
      setPhaseStructureError(
        caughtError instanceof Error ? caughtError.message : FALLBACK_SAVE_ERROR,
      )
      return false
    } finally {
      setIsSavingPhaseStructure(false)
    }
  }

  return {
    phaseDrafts,
    phaseStructureError,
    isSavingPhaseStructure,
    addPhaseDraft,
    movePhaseDraft,
    removePhaseDraft,
    applyStatusToAllPhases,
    savePhaseRange,
    savePhaseStructure,
    replacePhaseDrafts,
    updatePhaseDraft,
    updatePhaseDraftRange,
  }
}
