export interface HierarchyConnectionMessages {
  missingConnection: string
  selfReference: string
  unavailableConnection: string
  entityNotFound: string
  cycleDetected: string
  duplicateConnection: (memberLabel: string, managerLabel: string) => string
}

export type HierarchyConnectionValidationResult =
  | {
      kind: 'valid'
      memberId: string
      managerId: string
    }
  | {
      kind: 'noop'
      message: string
    }
  | {
      kind: 'error'
      message: string
    }

interface ValidateHierarchyConnectionParams {
  memberId: string | null | undefined
  managerId: string | null | undefined
  availableIds: ReadonlySet<string>
  entityExists: (id: string) => boolean
  getEntityLabel: (id: string) => string
  getCurrentManagerId: (memberId: string) => string | null | undefined
  createsCycle: (memberId: string, managerId: string) => boolean
  messages: HierarchyConnectionMessages
}

export function validateHierarchyConnection({
  memberId,
  managerId,
  availableIds,
  entityExists,
  getEntityLabel,
  getCurrentManagerId,
  createsCycle,
  messages,
}: ValidateHierarchyConnectionParams): HierarchyConnectionValidationResult {
  if (!managerId || !memberId) {
    return {
      kind: 'error',
      message: messages.missingConnection,
    }
  }

  if (managerId === memberId) {
    return {
      kind: 'error',
      message: messages.selfReference,
    }
  }

  if (!availableIds.has(managerId) || !availableIds.has(memberId)) {
    return {
      kind: 'error',
      message: messages.unavailableConnection,
    }
  }

  if (!entityExists(managerId) || !entityExists(memberId)) {
    return {
      kind: 'error',
      message: messages.entityNotFound,
    }
  }

  if (getCurrentManagerId(memberId) === managerId) {
    return {
      kind: 'noop',
      message: messages.duplicateConnection(
        getEntityLabel(memberId),
        getEntityLabel(managerId),
      ),
    }
  }

  if (createsCycle(memberId, managerId)) {
    return {
      kind: 'error',
      message: messages.cycleDetected,
    }
  }

  return {
    kind: 'valid',
    memberId,
    managerId,
  }
}
