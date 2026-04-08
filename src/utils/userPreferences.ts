import type { Member, ProjectStatus } from '../types/project'

export const allWorkStatuses: ProjectStatus[] = ['未着手', '進行中', '遅延', '完了', '中止']

export function normalizeDefaultProjectStatusFilters(
  filters: ProjectStatus[] | null | undefined,
): ProjectStatus[] {
  if (!filters) {
    return [...allWorkStatuses]
  }

  return allWorkStatuses.filter((status) => filters.includes(status))
}

export function getMemberDefaultProjectStatusFilters(member: Member | null | undefined) {
  return normalizeDefaultProjectStatusFilters(member?.defaultProjectStatusFilters)
}
