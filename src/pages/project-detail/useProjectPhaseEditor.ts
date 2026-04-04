import { useEffect, useState } from 'react'
import type { Phase, Project, WorkStatus } from '../../types/project'
import { buildPhaseFormState, type PhaseFormState } from './projectDetailTypes'

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
    const nextIndex = phaseDrafts.length + 1
    const previousEndWeek = phaseDrafts.reduce((max, phase) => Math.max(max, Number(phase.endWeek) || 0), 0)

    setPhaseDrafts((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${nextIndex}`,
        name: `新規フェーズ${nextIndex}`,
        startWeek: String(Math.max(previousEndWeek + 1, 1)),
        endWeek: String(Math.max(previousEndWeek + 1, 1)),
        status: workStatusOptions[0] ?? project?.status ?? '未着手',
        progress: '0',
      },
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

    if (phaseDrafts.length === 0) {
      setPhaseStructureError('フェーズは最低 1 件必要です。')
      return
    }

    const normalizedPhases: Array<{
      id?: string
      name: string
      startWeek: number
      endWeek: number
      status: WorkStatus
      progress: number
    }> = []

    for (const phase of phaseDrafts) {
      const name = phase.name.trim()
      const startWeek = Number(phase.startWeek)
      const endWeek = Number(phase.endWeek)
      const progress = Number(phase.progress)

      if (!name) {
        setPhaseStructureError('フェーズ名を入力してください。')
        return
      }

      if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
        setPhaseStructureError(`「${name}」の開始週・終了週が不正です。`)
        return
      }

      if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
        setPhaseStructureError(`「${name}」の進捗率は 0 から 100 で入力してください。`)
        return
      }

      normalizedPhases.push({
        id: phase.id,
        name,
        startWeek,
        endWeek,
        status: phase.status,
        progress,
      })
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
