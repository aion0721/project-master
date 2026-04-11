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

export function buildStructureAssignmentsForFlow(
  assignments: SystemAssignment[] | SystemStructureDraft[],
  ownerMemberId: string,
  systemId: string,
): SystemAssignment[] {
  const normalizedAssignments = assignments
    .map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId.trim(),
      responsibility: assignment.responsibility.trim(),
      reportsToMemberId: assignment.reportsToMemberId?.trim() ?? '',
    }))
    .filter((assignment) => assignment.memberId)
    .map((assignment, index) => ({
      id: assignment.id ?? `system-flow-${index}`,
      systemId,
      memberId: assignment.memberId,
      responsibility: assignment.responsibility,
      reportsToMemberId: assignment.reportsToMemberId || null,
    }))

  if (!ownerMemberId.trim()) {
    return normalizedAssignments
  }

  const hasOwnerAssignment = normalizedAssignments.some(
    (assignment) => assignment.memberId === ownerMemberId && assignment.responsibility === 'オーナー',
  )

  if (hasOwnerAssignment) {
    return normalizedAssignments
  }

  return [
    {
      id: `system-flow-owner-${ownerMemberId}`,
      systemId,
      memberId: ownerMemberId,
      responsibility: 'オーナー',
      reportsToMemberId: null,
    },
    ...normalizedAssignments,
  ]
}

export function createsStructureCycle(
  assignments: SystemStructureDraft[],
  memberId: string,
  nextReportsToMemberId: string,
  ownerMemberId: string,
) {
  if (!memberId || !nextReportsToMemberId || !ownerMemberId) {
    return false
  }

  if (memberId === ownerMemberId) {
    return true
  }

  const managerByMemberId = new Map<string, string | null>()

  assignments.forEach((assignment) => {
    if (!assignment.memberId.trim()) {
      return
    }

    managerByMemberId.set(
      assignment.memberId,
      assignment.memberId === memberId
        ? nextReportsToMemberId
        : assignment.reportsToMemberId.trim() || ownerMemberId,
    )
  })

  let cursor: string | null | undefined = nextReportsToMemberId

  while (cursor) {
    if (cursor === memberId) {
      return true
    }

    cursor = managerByMemberId.get(cursor) ?? (cursor === ownerMemberId ? null : ownerMemberId)
  }

  return false
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
