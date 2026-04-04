import type { Project, WorkStatus } from '../../types/project'
import { buildDraftPhaseForRange, type PhaseFormState } from './projectDetailTypes'

export interface NormalizedPhaseDraft {
  id?: string
  name: string
  startWeek: number
  endWeek: number
  status: WorkStatus
  progress: number
}

export function createNewPhaseDraft(
  currentDrafts: PhaseFormState[],
  workStatusOptions: WorkStatus[],
  project: Project | undefined,
) {
  const nextIndex = currentDrafts.length + 1
  const previousEndWeek = currentDrafts.reduce(
    (max, phase) => Math.max(max, Number(phase.endWeek) || 0),
    0,
  )
  const initialWeek = String(Math.max(previousEndWeek + 1, 1))

  return {
    key: `new-${Date.now()}-${nextIndex}`,
    name: `新規フェーズ${nextIndex}`,
    startWeek: initialWeek,
    endWeek: initialWeek,
    status: workStatusOptions[0] ?? project?.status ?? '未着手',
    progress: '0',
  } satisfies PhaseFormState
}

export function normalizePhaseDrafts(
  phaseDrafts: PhaseFormState[],
): { phases: NormalizedPhaseDraft[]; error: string | null } {
  if (phaseDrafts.length === 0) {
    return {
      phases: [],
      error: 'フェーズは最低 1 件必要です。',
    }
  }

  const normalizedPhases: NormalizedPhaseDraft[] = []

  for (const phase of phaseDrafts) {
    const name = phase.name.trim()
    const startWeek = Number(phase.startWeek)
    const endWeek = Number(phase.endWeek)
    const progress = Number(phase.progress)

    if (!name) {
      return {
        phases: [],
        error: 'フェーズ名を入力してください。',
      }
    }

    if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
      return {
        phases: [],
        error: `「${name}」の開始週・終了週が不正です。`,
      }
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return {
        phases: [],
        error: `「${name}」の進捗率は 0 から 100 で入力してください。`,
      }
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

  return {
    phases: normalizedPhases,
    error: null,
  }
}

export function getDraftPhaseRange(project: Project, phase: PhaseFormState) {
  const draftPhase = buildDraftPhaseForRange(project.projectNumber, project.pmMemberId, phase)
  const hasValidRange =
    Number.isInteger(draftPhase.startWeek) &&
    Number.isInteger(draftPhase.endWeek) &&
    draftPhase.startWeek > 0 &&
    draftPhase.endWeek >= draftPhase.startWeek

  return hasValidRange ? draftPhase : null
}
