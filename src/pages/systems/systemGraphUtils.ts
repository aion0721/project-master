import type {
  ManagedSystem,
  Project,
  SystemRelation,
  SystemTransaction,
  SystemTransactionStep,
} from '../../types/project'
import { buildTransactionPathSummary } from './systemTransactionUtils'

export interface SystemGraphSummary {
  systems: number
  relations: number
  transactions: number
  projects: number
}

export interface FocusedSystemRelationItem {
  relation: SystemRelation
  system: ManagedSystem
}

export interface FocusedSystemView {
  upstream: FocusedSystemRelationItem[]
  downstream: FocusedSystemRelationItem[]
}

export interface RelatedSystemItem {
  relation: SystemRelation
  system: ManagedSystem | undefined
}

export interface TransactionEntry {
  transaction: SystemTransaction
  pathLabel: string
  steps: SystemTransactionStep[]
}

export interface RelationTransactionGroup {
  relation: SystemRelation
  system: ManagedSystem | undefined
  transactions: Array<{
    transaction: SystemTransaction
    pathLabel: string
    relationSteps: SystemTransactionStep[]
  }>
}

export interface RelationOption {
  value: string
  label: string
  sourceSystemId: string
  targetSystemId: string
}

export function buildSortedSystems(systems: ManagedSystem[]) {
  return [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja'))
}

export function buildProjectCountBySystemId(projects: Project[]) {
  const counts = new Map<string, number>()

  projects.forEach((project) => {
    const systemId = project.relatedSystemIds?.[0]

    if (!systemId) {
      return
    }

    counts.set(systemId, (counts.get(systemId) ?? 0) + 1)
  })

  return counts
}

export function buildSystemById(systems: ManagedSystem[]) {
  return new Map(systems.map((system) => [system.id, system] as const))
}

export function buildRelationById(systemRelations: SystemRelation[]) {
  return new Map(systemRelations.map((relation) => [relation.id, relation] as const))
}

export function buildSystemGraphSummary(
  systems: ManagedSystem[],
  systemRelations: SystemRelation[],
  systemTransactions: SystemTransaction[],
  projects: Project[],
): SystemGraphSummary {
  return {
    systems: systems.length,
    relations: systemRelations.length,
    transactions: systemTransactions.length,
    projects: projects.filter((project) => project.relatedSystemIds?.[0]).length,
  }
}

export function buildFocusedSystemView(
  selectedSystem: ManagedSystem | null,
  systemRelations: SystemRelation[],
  systemById: ReadonlyMap<string, ManagedSystem>,
): FocusedSystemView | null {
  if (!selectedSystem) {
    return null
  }

  const upstream = systemRelations
    .filter((relation) => relation.targetSystemId === selectedSystem.id)
    .map((relation) => ({
      relation,
      system: systemById.get(relation.sourceSystemId),
    }))
    .filter((item): item is FocusedSystemRelationItem => Boolean(item.system))

  const downstream = systemRelations
    .filter((relation) => relation.sourceSystemId === selectedSystem.id)
    .map((relation) => ({
      relation,
      system: systemById.get(relation.targetSystemId),
    }))
    .filter((item): item is FocusedSystemRelationItem => Boolean(item.system))

  return {
    upstream,
    downstream,
  }
}

export function buildRelatedSystems(
  systemId: string,
  systemRelations: SystemRelation[],
  systemById: ReadonlyMap<string, ManagedSystem>,
): RelatedSystemItem[] {
  return systemRelations
    .filter(
      (relation) => relation.sourceSystemId === systemId || relation.targetSystemId === systemId,
    )
    .map((relation) => {
      const relatedSystemId =
        relation.sourceSystemId === systemId ? relation.targetSystemId : relation.sourceSystemId

      return {
        relation,
        system: systemById.get(relatedSystemId),
      }
    })
}

export function buildRelationTargetOptions(currentSystemId: string, systems: ManagedSystem[]) {
  return systems
    .filter((system) => system.id !== currentSystemId)
    .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
}

export function buildRelationOptions(
  systemRelations: SystemRelation[],
  systemById: ReadonlyMap<string, ManagedSystem>,
): RelationOption[] {
  return systemRelations
    .map((relation) => ({
      value: relation.id,
      label: `${systemById.get(relation.sourceSystemId)?.name ?? relation.sourceSystemId} → ${
        systemById.get(relation.targetSystemId)?.name ?? relation.targetSystemId
      }`,
      sourceSystemId: relation.sourceSystemId,
      targetSystemId: relation.targetSystemId,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'ja'))
}

function buildStepsByTransactionId(systemTransactionSteps: SystemTransactionStep[]) {
  const stepsByTransactionId = new Map<string, SystemTransactionStep[]>()

  systemTransactionSteps.forEach((step) => {
    const currentSteps = stepsByTransactionId.get(step.transactionId) ?? []
    currentSteps.push(step)
    stepsByTransactionId.set(step.transactionId, currentSteps)
  })

  return stepsByTransactionId
}

export function buildRelationTransactionGroups(
  relatedSystems: RelatedSystemItem[],
  systemTransactions: SystemTransaction[],
  systemTransactionSteps: SystemTransactionStep[],
  systemById: ReadonlyMap<string, ManagedSystem>,
): RelationTransactionGroup[] {
  const transactionById = new Map(
    systemTransactions.map((transaction) => [transaction.id, transaction] as const),
  )
  const stepsByTransactionId = buildStepsByTransactionId(systemTransactionSteps)

  return relatedSystems.map(({ relation, system }) => {
    const relationSteps = systemTransactionSteps
      .filter((step) => step.relationId === relation.id)
      .sort((left, right) => left.stepOrder - right.stepOrder)

    const transactions = [...new Set(relationSteps.map((step) => step.transactionId))]
      .map((transactionId) => {
        const transaction = transactionById.get(transactionId)

        if (!transaction) {
          return null
        }

        const pathSummary = buildTransactionPathSummary(
          stepsByTransactionId.get(transactionId) ?? [],
          systemById,
        )

        return {
          transaction,
          pathLabel: pathSummary?.pathLabel ?? '経路を表示できません。',
          relationSteps: relationSteps.filter((step) => step.transactionId === transactionId),
        }
      })
      .filter(
        (
          item,
        ): item is RelationTransactionGroup['transactions'][number] => Boolean(item),
      )

    return {
      relation,
      system,
      transactions,
    }
  })
}

export function buildTransactionEntries(
  systemId: string,
  systemTransactions: SystemTransaction[],
  systemTransactionSteps: SystemTransactionStep[],
  systemById: ReadonlyMap<string, ManagedSystem>,
): TransactionEntry[] {
  const relevantTransactionIds = [
    ...new Set(
      systemTransactionSteps
        .filter((step) => step.sourceSystemId === systemId || step.targetSystemId === systemId)
        .map((step) => step.transactionId),
    ),
  ]

  return relevantTransactionIds
    .map((transactionId) => {
      const transaction = systemTransactions.find((item) => item.id === transactionId)

      if (!transaction) {
        return null
      }

      const steps = systemTransactionSteps
        .filter((step) => step.transactionId === transactionId)
        .sort((left, right) => left.stepOrder - right.stepOrder)
      const pathSummary = buildTransactionPathSummary(steps, systemById)

      return {
        transaction,
        pathLabel: pathSummary?.pathLabel ?? '経路を表示できません。',
        steps,
      }
    })
    .filter((item): item is TransactionEntry => Boolean(item))
}
