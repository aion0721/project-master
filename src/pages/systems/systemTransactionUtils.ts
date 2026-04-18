import type {
  ManagedSystem,
  SystemRelation,
  SystemTransactionStep,
} from "../../types/project";

type TransactionStepLike = Pick<
  SystemTransactionStep,
  "relationId" | "sourceSystemId" | "targetSystemId" | "stepOrder"
>;

interface TransactionPathSummary {
  pathSystemIds: string[];
  pathLabel: string;
  startName: string;
  endName: string;
  stepCount: number;
  protocolSummary: string[];
}

function sortTransactionSteps<T extends Pick<SystemTransactionStep, "stepOrder">>(
  steps: T[],
): T[] {
  return [...steps].sort((left, right) => left.stepOrder - right.stepOrder);
}

export function buildTransactionPathSystemIds(
  steps: Pick<
    SystemTransactionStep,
    "sourceSystemId" | "targetSystemId" | "stepOrder"
  >[],
): string[] {
  return sortTransactionSteps(steps).reduce<string[]>((ids, step) => {
    if (ids.length === 0) {
      return [step.sourceSystemId, step.targetSystemId];
    }

    return ids.at(-1) === step.sourceSystemId
      ? [...ids, step.targetSystemId]
      : [...ids, step.sourceSystemId, step.targetSystemId];
  }, []);
}

export function buildTransactionPathSummary(
  steps: TransactionStepLike[],
  systemById: ReadonlyMap<string, Pick<ManagedSystem, "name">>,
  relationById?: ReadonlyMap<string, Pick<SystemRelation, "protocol">>,
): TransactionPathSummary | null {
  if (steps.length === 0) {
    return null;
  }

  const sortedSteps = sortTransactionSteps(steps);
  const pathSystemIds = buildTransactionPathSystemIds(sortedSteps);
  const systemNames = pathSystemIds.map(
    (systemId) => systemById.get(systemId)?.name ?? systemId,
  );

  return {
    pathSystemIds,
    pathLabel: systemNames.join(" → "),
    startName: systemNames[0] ?? "-",
    endName: systemNames.at(-1) ?? "-",
    stepCount: sortedSteps.length,
    protocolSummary: relationById
      ? [
          ...new Set(
            sortedSteps
              .map((step) => relationById.get(step.relationId)?.protocol?.trim())
              .filter((value): value is string => Boolean(value)),
          ),
        ]
      : [],
  };
}
