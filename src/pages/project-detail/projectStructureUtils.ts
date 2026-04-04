import type { Member } from '../../types/project'
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
