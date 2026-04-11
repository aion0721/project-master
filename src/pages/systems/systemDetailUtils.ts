import type {
  ManagedSystem,
  ProjectLink,
  SystemAssignment,
  UpdateSystemInput,
} from '../../types/project'
import type { SystemStructureDraft } from './SystemStructureEditor'

export function buildLinkDrafts(links: ProjectLink[] | undefined) {
  return (links ?? []).map((link) => ({
    label: link.label,
    url: link.url,
  }))
}

export function buildStructureDrafts(assignments: SystemAssignment[]) {
  return assignments
    .filter((assignment) => assignment.responsibility !== 'オーナー')
    .map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId,
      responsibility: assignment.responsibility,
      reportsToMemberId: assignment.reportsToMemberId ?? '',
    }))
}

export function sanitizeStructureDrafts(assignments: SystemStructureDraft[]) {
  return assignments
    .map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId.trim(),
      responsibility: assignment.responsibility.trim(),
      reportsToMemberId: assignment.reportsToMemberId.trim(),
    }))
    .filter(
      (assignment) =>
        assignment.memberId || assignment.responsibility || assignment.reportsToMemberId,
    )
}

export function buildUpdateSystemInput(
  system: ManagedSystem,
  overrides: Partial<UpdateSystemInput> = {},
): UpdateSystemInput {
  return {
    name: system.name,
    category: system.category,
    ownerMemberId: system.ownerMemberId ?? null,
    departmentNames: system.departmentNames ?? [],
    note: system.note ?? null,
    systemLinks: system.systemLinks ?? [],
    ...overrides,
  }
}
