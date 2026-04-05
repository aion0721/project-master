import type { Member, WorkStatus } from '../types/project'

export const allWorkStatuses: WorkStatus[] = ['未着手', '進行中', '遅延', '完了']

export function normalizeDefaultProjectStatusFilters(
  filters: WorkStatus[] | null | undefined,
): WorkStatus[] {
  if (!filters) {
    return [...allWorkStatuses]
  }

  return allWorkStatuses.filter((status) => filters.includes(status))
}

export function getMemberDefaultProjectStatusFilters(member: Member | null | undefined) {
  return normalizeDefaultProjectStatusFilters(member?.defaultProjectStatusFilters)
}
