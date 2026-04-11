import type { Member } from '../types/project'

export interface MemberHierarchyNode {
  member: Member
  children: MemberHierarchyNode[]
  isSelected: boolean
  isPathNode: boolean
}

export interface MemberHierarchyLevels {
  lineage: Member[]
  descendantGroups: MemberHierarchyNode[]
}

export type MemberRoleTone = 'executive' | 'lead' | 'quality' | 'platform' | 'default'

export function sortMembersByName(members: Member[]) {
  return [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja'))
}

function getRootMembers(members: Member[], memberById: Map<string, Member>) {
  return sortMembersByName(
    members.filter((member) => !member.managerId || !memberById.has(member.managerId)),
  )
}

function buildDescendantNode(
  member: Member,
  childrenByManagerId: Map<string | null, Member[]>,
  selectedMemberId?: string,
): MemberHierarchyNode {
  return {
    member,
    isSelected: member.id === selectedMemberId,
    isPathNode: Boolean(selectedMemberId) && member.id === selectedMemberId,
    children: sortMembersByName(childrenByManagerId.get(member.id) ?? []).map((child) =>
      buildDescendantNode(child, childrenByManagerId, selectedMemberId),
    ),
  }
}

function buildChildrenByManagerId(members: Member[]) {
  const childrenByManagerId = new Map<string | null, Member[]>()

  members.forEach((member) => {
    const bucket = childrenByManagerId.get(member.managerId) ?? []
    bucket.push(member)
    childrenByManagerId.set(member.managerId, bucket)
  })

  return childrenByManagerId
}

function buildLineage(memberById: Map<string, Member>, selectedMember?: Member) {
  const lineage: Member[] = []
  let cursor = selectedMember

  while (cursor) {
    lineage.unshift(cursor)
    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined
  }

  return lineage
}

export function buildMemberHierarchyForest(members: Member[], selectedMemberId?: string) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const selectedMember = selectedMemberId ? memberById.get(selectedMemberId) : undefined
  const childrenByManagerId = buildChildrenByManagerId(members)

  if (!selectedMember) {
    return getRootMembers(members, memberById).map((member) =>
      buildDescendantNode(member, childrenByManagerId),
    )
  }

  const lineage = buildLineage(memberById, selectedMember)

  function buildPathNode(index: number): MemberHierarchyNode {
    const member = lineage[index]
    const isSelected = member.id === selectedMemberId

    return {
      member,
      isSelected,
      isPathNode: true,
      children: isSelected
        ? sortMembersByName(childrenByManagerId.get(member.id) ?? []).map((child) =>
            buildDescendantNode(child, childrenByManagerId, selectedMemberId),
          )
        : lineage[index + 1]
          ? [buildPathNode(index + 1)]
          : [],
    }
  }

  return [buildPathNode(0)]
}

export function buildMemberHierarchyLevels(
  members: Member[],
  selectedMemberId?: string,
): MemberHierarchyLevels {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const selectedMember = selectedMemberId ? memberById.get(selectedMemberId) : undefined
  const childrenByManagerId = buildChildrenByManagerId(members)

  if (!selectedMember) {
    return {
      lineage: [],
      descendantGroups: getRootMembers(members, memberById).map((member) =>
        buildDescendantNode(member, childrenByManagerId),
      ),
    }
  }

  return {
    lineage: buildLineage(memberById, selectedMember),
    descendantGroups: sortMembersByName(childrenByManagerId.get(selectedMember.id) ?? []).map(
      (child) => buildDescendantNode(child, childrenByManagerId),
    ),
  }
}

export function createsMemberHierarchyCycle(
  members: Member[],
  memberId: string,
  nextManagerId: string,
) {
  const memberById = new Map(members.map((member) => [member.id, member]))
  let cursor = memberById.get(nextManagerId)

  while (cursor) {
    if (cursor.id === memberId) {
      return true
    }

    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined
  }

  return false
}

export function getMemberRoleTone(role: string): MemberRoleTone {
  if (role.includes('部長') || role.includes('本部長')) {
    return 'executive'
  }

  if (role.includes('PM') || role.includes('リーダー')) {
    return 'lead'
  }

  if (role.includes('テスト') || role.includes('品質')) {
    return 'quality'
  }

  if (role.includes('インフラ') || role.includes('基盤')) {
    return 'platform'
  }

  return 'default'
}
