import { useEffect, useState } from 'react'
import type { Phase, Project, WorkStatus } from '../../types/project'
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

export function useProjectPhaseEditor(
  project: Project | undefined,
  projectPhases: Phase[],
  workStatusOptions: WorkStatus[],
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

  function addPhaseDraft() {
    setPhaseDrafts((current) => [
      ...current,
      createNewPhaseDraft(current, workStatusOptions, project),
    ])
    setPhaseStructureError(null)
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
      return
    }

    const { phases: normalizedPhases, error } = normalizePhaseDrafts(phaseDrafts)

    if (error) {
      setPhaseStructureError(error)
      return
    }

    setIsSavingPhaseStructure(true)
    setPhaseStructureError(null)

    try {
      await updateProjectPhases(project.projectNumber, { phases: normalizedPhases })
    } catch (caughtError) {
      setPhaseStructureError(
        caughtError instanceof Error ? caughtError.message : 'フェーズ構成の保存に失敗しました。',
      )
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
    savePhaseStructure,
    updatePhaseDraft,
  }
}
