import type { Phase, ProjectEvent, WorkStatus } from '../../types/project'

export interface PhaseFormState {
  id?: string
  key: string
  name: string
  startWeek: string
  endWeek: string
  status: WorkStatus
  progress: string
}

export interface StructureAssignmentDraft {
  id?: string
  memberId: string
  responsibility: string
  reportsToMemberId: string
}

export interface EventFormState {
  id?: string
  key: string
  name: string
  week: string
  status: WorkStatus
  ownerMemberId: string
  note: string
}

export function buildPhaseFormState(phase: Phase): PhaseFormState {
  return {
    id: phase.id,
    key: phase.id,
    name: phase.name,
    startWeek: String(phase.startWeek),
    endWeek: String(phase.endWeek),
    status: phase.status,
    progress: String(phase.progress),
  }
}

export function buildEventFormState(event: ProjectEvent): EventFormState {
  return {
    id: event.id,
    key: event.id,
    name: event.name,
    week: String(event.week),
    status: event.status,
    ownerMemberId: event.ownerMemberId ?? '',
    note: event.note ?? '',
  }
}

export function normalizeAssignments(assignments: StructureAssignmentDraft[]) {
  return assignments.map((assignment) => ({
    id: assignment.id,
    memberId: assignment.memberId,
    responsibility: assignment.responsibility.trim(),
    reportsToMemberId: assignment.reportsToMemberId.trim() || null,
  }))
}

export function isValidOptionalUrl(value: string) {
  if (!value.trim()) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function buildDraftPhaseForRange(
  projectNumber: string,
  pmMemberId: string,
  draft: PhaseFormState,
): Phase {
  return {
    id: draft.id ?? draft.key,
    projectId: projectNumber,
    name: draft.name.trim() || '未設定フェーズ',
    startWeek: Number(draft.startWeek) || 1,
    endWeek: Number(draft.endWeek) || 1,
    status: draft.status,
    progress: Number(draft.progress) || 0,
    assigneeMemberId: pmMemberId,
  }
}

export function buildDraftEvent(projectNumber: string, draft: EventFormState): ProjectEvent {
  return {
    id: draft.id ?? draft.key,
    projectId: projectNumber,
    name: draft.name.trim() || '未設定イベント',
    week: Number(draft.week) || 1,
    status: draft.status,
    ownerMemberId: draft.ownerMemberId.trim() || null,
    note: draft.note.trim() || null,
  }
}
