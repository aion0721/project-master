import type { Member, SystemAssignment } from '../../types/project'
import type { StructureAssignmentDraft } from './projectDetailTypes'

export function getStructureReportingOptions(
  members: Member[],
  structurePmMemberId: string,
  structureAssignments: StructureAssignmentDraft[],
) {
  return [
    ...members.filter((member) => member.id === structurePmMemberId),
    ...members.filter((member) =>
      structureAssignments.some((assignment) => assignment.memberId === member.id),
    ),
  ].filter(
    (member, index, array) => array.findIndex((candidate) => candidate.id === member.id) === index,
  )
}

export function buildStructureDraftsFromSystemAssignments(systemAssignments: SystemAssignment[]) {
  const ownerAssignment = systemAssignments.find((assignment) => assignment.responsibility === 'オーナー')

  return {
    pmMemberId: ownerAssignment?.memberId ?? '',
    assignments: systemAssignments
      .filter((assignment) => assignment.responsibility !== 'オーナー')
      .map((assignment) => ({
        id: assignment.id,
        memberId: assignment.memberId,
        responsibility: assignment.responsibility,
        reportsToMemberId: assignment.reportsToMemberId ?? '',
      })),
  }
}
