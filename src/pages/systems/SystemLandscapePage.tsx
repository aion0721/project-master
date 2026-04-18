import { useMemo, useState } from "react";
import { SystemFocusFlow } from "../../components/SystemFocusFlow";
import { SystemLandscapeFlow } from "../../components/SystemLandscapeFlow";
import { SystemTransactionFlow } from "../../components/SystemTransactionFlow";
import { ListPageHero } from "../../components/ListPageHero";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { useProjectData } from "../../store/useProjectData";
import pageStyles from "../../styles/page.module.css";
import type {
  CreateSystemTransactionInput,
  UpdateSystemTransactionInput,
} from "../../types/project";
import {
  SystemTransactionFlowEditor,
  type PendingTransactionStepDraft,
  type TransactionDraftFormState,
} from "./SystemTransactionFlowEditor";
import {
  buildFocusedSystemView,
  buildProjectCountBySystemId,
  buildRelationById,
  buildSortedSystems,
  buildSystemById,
  buildSystemGraphSummary,
} from "./systemGraphUtils";
import { formatSystemOptionLabel } from "./systemFormUtils";
import { buildTransactionPathSummary } from "./systemTransactionUtils";
import styles from "./SystemLandscapePage.module.css";

interface HoveredEdgeTooltip {
  id: string;
  sourceName: string;
  targetName: string;
  protocol: string | null;
  note: string | null;
}

type DiagramMode = "relation" | "transaction";

export function SystemLandscapePage() {
  const {
    systems,
    systemRelations,
    systemTransactions,
    systemTransactionSteps,
    projects,
    isLoading,
    error,
    createSystemTransaction,
    updateSystemTransaction,
  } = useProjectData();
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [hoveredEdge, setHoveredEdge] = useState<HoveredEdgeTooltip | null>(
    null,
  );
  const [diagramMode, setDiagramMode] = useState<DiagramMode>("relation");
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>("");
  const [isTransactionEditing, setIsTransactionEditing] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionDraft, setTransactionDraft] =
    useState<TransactionDraftFormState>({
      name: "",
      dataLabel: "",
      note: "",
    });
  const [pendingTransactionStep, setPendingTransactionStep] =
    useState<PendingTransactionStepDraft | null>(null);
  const [transactionEditError, setTransactionEditError] = useState<
    string | null
  >(null);
  const [isSavingTransactionStep, setIsSavingTransactionStep] = useState(false);
  const [manualSourceSystemId, setManualSourceSystemId] = useState<string>("");
  const [manualTargetSystemId, setManualTargetSystemId] = useState<string>("");

  const sortedSystems = useMemo(
    () => buildSortedSystems(systems),
    [systems],
  );

  const projectCountBySystemId = useMemo(() => {
    return buildProjectCountBySystemId(projects);
  }, [projects]);

  const systemById = useMemo(
    () => buildSystemById(sortedSystems),
    [sortedSystems],
  );

  const selectedSystem = useMemo(() => {
    const defaultSystemId = selectedSystemId || sortedSystems[0]?.id || "";
    return systemById.get(defaultSystemId) ?? null;
  }, [selectedSystemId, sortedSystems, systemById]);

  const focusedView = useMemo(() => {
    return buildFocusedSystemView(selectedSystem, systemRelations, systemById);
  }, [selectedSystem, systemById, systemRelations]);

  const summary = useMemo(
    () =>
      buildSystemGraphSummary(
        sortedSystems,
        systemRelations,
        systemTransactions,
        projects,
      ),
    [projects, sortedSystems, systemRelations, systemTransactions],
  );

  const relationById = useMemo(
    () => buildRelationById(systemRelations),
    [systemRelations],
  );

  const selectedTransaction = useMemo(() => {
    const defaultTransactionId =
      selectedTransactionId || systemTransactions[0]?.id || "";
    return (
      systemTransactions.find(
        (transaction) => transaction.id === defaultTransactionId,
      ) ?? null
    );
  }, [selectedTransactionId, systemTransactions]);

  const selectedTransactionSteps = useMemo(() => {
    if (!selectedTransaction) {
      return [];
    }

    return systemTransactionSteps
      .filter((step) => step.transactionId === selectedTransaction.id)
      .sort((left, right) => left.stepOrder - right.stepOrder);
  }, [selectedTransaction, systemTransactionSteps]);

  const selectedTransactionSummary = useMemo(() => {
    return buildTransactionPathSummary(
      selectedTransactionSteps,
      systemById,
      relationById,
    );
  }, [relationById, selectedTransactionSteps, systemById]);

  const pendingRelationOptions = useMemo(() => {
    if (!pendingTransactionStep) {
      return [];
    }

    return systemRelations.filter(
      (relation) =>
        relation.sourceSystemId === pendingTransactionStep.sourceSystemId &&
        relation.targetSystemId === pendingTransactionStep.targetSystemId,
    );
  }, [pendingTransactionStep, systemRelations]);

  function resetTransactionStepEditor() {
    setPendingTransactionStep(null);
    setTransactionEditError(null);
    setIsSavingTransactionStep(false);
    setManualSourceSystemId("");
    setManualTargetSystemId("");
  }

  function resetCreateTransactionEditor() {
    setIsCreatingTransaction(false);
    setTransactionDraft({
      name: "",
      dataLabel: "",
      note: "",
    });
    resetTransactionStepEditor();
  }

  function buildUpdatedTransactionInput(
    stepDraft: PendingTransactionStepDraft,
  ): UpdateSystemTransactionInput | null {
    if (!selectedTransaction) {
      return null;
    }

    const relation = relationById.get(stepDraft.relationId);

    if (!relation) {
      throw new Error("通信線を選択してください。");
    }

    return {
      name: selectedTransaction.name,
      dataLabel: selectedTransaction.dataLabel,
      note: selectedTransaction.note ?? null,
      steps: [
        ...selectedTransactionSteps.map((step) => ({
          id: step.id,
          relationId: step.relationId,
          sourceSystemId: step.sourceSystemId,
          targetSystemId: step.targetSystemId,
          stepOrder: step.stepOrder,
          actionLabel: step.actionLabel ?? null,
          note: step.note ?? null,
        })),
        {
          relationId: relation.id,
          sourceSystemId: relation.sourceSystemId,
          targetSystemId: relation.targetSystemId,
          stepOrder: selectedTransactionSteps.length + 1,
          actionLabel: stepDraft.actionLabel.trim() || null,
          note: stepDraft.note.trim() || null,
        },
      ],
    };
  }

  function startPendingTransactionStep(
    sourceSystemId: string,
    targetSystemId: string,
  ) {
    if (sourceSystemId === targetSystemId) {
      setTransactionEditError("同じシステム同士は接続できません。");
      return;
    }

    const matchedRelations = systemRelations.filter(
      (relation) =>
        relation.sourceSystemId === sourceSystemId &&
        relation.targetSystemId === targetSystemId,
    );

    if (matchedRelations.length === 0) {
      setTransactionEditError(
        "該当する通信線がありません。先に通信図で接続を登録してください。",
      );
      return;
    }

    setPendingTransactionStep({
      sourceSystemId,
      targetSystemId,
      relationId: matchedRelations[0]!.id,
      actionLabel: "",
      note: "",
    });
    setTransactionEditError(null);
  }

  function updateTransactionDraft(patch: Partial<TransactionDraftFormState>) {
    setTransactionDraft((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updatePendingTransactionStep(
    patch: Partial<PendingTransactionStepDraft>,
  ) {
    setPendingTransactionStep((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current,
    );
  }

  async function handleSaveTransactionStep() {
    if (!selectedTransaction || !pendingTransactionStep) {
      return;
    }

    setTransactionEditError(null);
    setIsSavingTransactionStep(true);

    try {
      const nextInput = buildUpdatedTransactionInput(pendingTransactionStep);

      if (!nextInput) {
        throw new Error("更新対象のトランザクションが見つかりません。");
      }

      await updateSystemTransaction(selectedTransaction.id, nextInput);
      resetTransactionStepEditor();
    } catch (caughtError) {
      setTransactionEditError(
        caughtError instanceof Error
          ? caughtError.message
          : "データ流れステップの追加に失敗しました。",
      );
    } finally {
      setIsSavingTransactionStep(false);
    }
  }

  async function handleCreateTransactionFromFlow() {
    if (!pendingTransactionStep) {
      setTransactionEditError("最初のステップを1件追加してください。");
      return;
    }

    const name = transactionDraft.name.trim();
    const dataLabel = transactionDraft.dataLabel.trim();

    if (!name || !dataLabel) {
      setTransactionEditError("トランザクション名と対象データは必須です。");
      return;
    }

    const relation = relationById.get(pendingTransactionStep.relationId);

    if (!relation) {
      setTransactionEditError("通信線を選択してください。");
      return;
    }

    const input: CreateSystemTransactionInput = {
      name,
      dataLabel,
      note: transactionDraft.note.trim() || null,
      steps: [
        {
          relationId: relation.id,
          sourceSystemId: relation.sourceSystemId,
          targetSystemId: relation.targetSystemId,
          stepOrder: 1,
          actionLabel: pendingTransactionStep.actionLabel.trim() || null,
          note: pendingTransactionStep.note.trim() || null,
        },
      ],
    };

    setTransactionEditError(null);
    setIsSavingTransactionStep(true);

    try {
      const result = await createSystemTransaction(input);
      setSelectedTransactionId(result.transaction.id);
      setIsTransactionEditing(false);
      resetCreateTransactionEditor();
    } catch (caughtError) {
      setTransactionEditError(
        caughtError instanceof Error
          ? caughtError.message
          : "データ流れの作成に失敗しました。",
      );
    } finally {
      setIsSavingTransactionStep(false);
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>関連図を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>
          システム関連を取得しています。
        </p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>
          関連図を表示できませんでした
        </h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    );
  }

  function handleEdgeHover(edgeId: string) {
    const relation = systemRelations.find((item) => item.id === edgeId);

    if (!relation) {
      return;
    }

    setHoveredEdge({
      id: relation.id,
      sourceName:
        systemById.get(relation.sourceSystemId)?.name ??
        relation.sourceSystemId,
      targetName:
        systemById.get(relation.targetSystemId)?.name ??
        relation.targetSystemId,
      protocol: relation.protocol ?? null,
      note: relation.note ?? null,
    });
  }

  function handleEdgeLeave(edgeId: string) {
    setHoveredEdge((current) => (current?.id === edgeId ? null : current));
  }

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/systems">システム一覧</Button>}
        className={styles.hero}
        collapsible
        description="システム同士のつながりを俯瞰で表示します。上流からの受け取りと下流への連携を、選択ビューと全体図の両方で確認できます。"
        eyebrow="System Diagram"
        iconKind="system"
        storageKey="project-master:hero-collapsed:system-landscape"
        stats={[
          { label: "登録システム", value: summary.systems },
          { label: "関連線", value: summary.relations },
          { label: "データ流れ", value: summary.transactions },
          { label: "関連案件あり", value: summary.projects },
        ]}
        title="システム関連図"
      />

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>
              システム別フォーカスビュー
            </h2>
            <p className={pageStyles.sectionDescription}>
              対象システムを1つ選ぶと、上流に受けるシステムと下流へ渡すシステムを並べて表示します。
            </p>
          </div>
        </div>

        <label className={styles.selectorField}>
          <span className={styles.selectorLabel}>表示対象システム</span>
          <select
            className={styles.selectorInput}
            data-testid="focused-system-select"
            onChange={(event) => setSelectedSystemId(event.target.value)}
            value={selectedSystem?.id ?? ""}
          >
            {sortedSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {formatSystemOptionLabel(system)}
              </option>
            ))}
          </select>
        </label>

        {selectedSystem && focusedView ? (
          <div className={styles.focusSection}>
            <div className={styles.focusHeadingRow}>
              <section
                className={styles.focusColumn}
                data-testid="focused-system-upstream"
              >
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>上流</span>
                  <h3 className={styles.focusTitle}>データをもらう元</h3>
                </header>
                {focusedView.upstream.length > 0 ? (
                  <div className={styles.focusNameList}>
                    {focusedView.upstream.map(({ relation, system }) => (
                      <span className={styles.focusNameChip} key={relation.id}>
                        {system.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.focusListText}>
                    このシステムにデータを送る上流システムはありません。
                  </div>
                )}
              </section>

              <section
                className={`${styles.focusColumn} ${styles.focusColumnPrimary}`}
              >
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>中心</span>
                  <h3 className={styles.focusTitle}>選択中のシステム</h3>
                </header>
                <div
                  className={styles.focusListText}
                  data-testid="focused-system-center"
                >
                  {selectedSystem.name}
                </div>
              </section>

              <section
                className={styles.focusColumn}
                data-testid="focused-system-downstream"
              >
                <header className={styles.focusHeader}>
                  <span className={styles.focusEyebrow}>下流</span>
                  <h3 className={styles.focusTitle}>データを渡す先</h3>
                </header>
                {focusedView.downstream.length > 0 ? (
                  <div className={styles.focusNameList}>
                    {focusedView.downstream.map(({ relation, system }) => (
                      <span className={styles.focusNameChip} key={relation.id}>
                        {system.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.focusListText}>
                    このシステムからデータを渡す下流システムはありません。
                  </div>
                )}
              </section>
            </div>

            <div
              aria-label={`${selectedSystem.name} の上流接続メモ`}
              className={`${styles.focusConnectorAssist} ${focusedView.upstream.length > 0 ? "" : styles.focusConnectorIdle}`}
              data-testid="focused-connector-upstream"
              tabIndex={focusedView.upstream.length > 0 ? 0 : -1}
            >
              {focusedView.upstream.length > 0 ? (
                <div className={styles.focusConnectorTooltip}>
                  <strong className={styles.focusConnectorTooltipTitle}>
                    上流から {selectedSystem.name} への連携
                  </strong>
                  <ul className={styles.focusConnectorTooltipList}>
                    {focusedView.upstream.map(({ relation, system }) => (
                      <li
                        className={styles.focusConnectorTooltipItem}
                        key={relation.id}
                      >
                        <span className={styles.focusConnectorTooltipItemName}>
                          {system.name}
                        </span>
                        <span className={styles.focusConnectorTooltipItemText}>
                          {relation.note ?? "メモは未設定です。"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div
              aria-label={`${selectedSystem.name} の下流接続メモ`}
              className={`${styles.focusConnectorAssist} ${focusedView.downstream.length > 0 ? "" : styles.focusConnectorIdle}`}
              data-testid="focused-connector-downstream"
              tabIndex={focusedView.downstream.length > 0 ? 0 : -1}
            />

            <SystemFocusFlow
              downstream={focusedView.downstream}
              projectCountBySystemId={projectCountBySystemId}
              selectedSystem={selectedSystem}
              upstream={focusedView.upstream}
            />
          </div>
        ) : (
          <p className={styles.emptyText}>表示できるシステムがありません。</p>
        )}
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>可視化ネットワーク</h2>
            <p className={pageStyles.sectionDescription}>
              通信線の全体像と、データ流れ単位の経路を切り替えて表示します。
            </p>
          </div>
        </div>

        <div className={styles.viewToggleRow}>
          <button
            aria-pressed={diagramMode === "relation"}
            className={[
              styles.viewToggleButton,
              diagramMode === "relation" ? styles.viewToggleButtonActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-testid="diagram-mode-relation"
            onClick={() => {
              setDiagramMode("relation");
              resetTransactionStepEditor();
              setIsTransactionEditing(false);
            }}
            type="button"
          >
            通信図
          </button>
          <button
            aria-pressed={diagramMode === "transaction"}
            className={[
              styles.viewToggleButton,
              diagramMode === "transaction"
                ? styles.viewToggleButtonActive
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-testid="diagram-mode-transaction"
            onClick={() => {
              setDiagramMode("transaction");
              resetTransactionStepEditor();
              setIsTransactionEditing(false);
            }}
            type="button"
          >
            データ流れ図
          </button>
        </div>

        {diagramMode === "relation" &&
        sortedSystems.length > 0 &&
        systemRelations.length > 0 ? (
          <div className={styles.diagramWrap}>
            <SystemLandscapeFlow
              activeEdgeId={hoveredEdge?.id ?? null}
              onEdgeHover={handleEdgeHover}
              onEdgeLeave={handleEdgeLeave}
              projectCountBySystemId={projectCountBySystemId}
              systemRelations={systemRelations}
              systems={sortedSystems}
            />
            <div className={styles.edgeAssistList}>
              {systemRelations.map((relation) => {
                const sourceName =
                  systemById.get(relation.sourceSystemId)?.name ??
                  relation.sourceSystemId;
                const targetName =
                  systemById.get(relation.targetSystemId)?.name ??
                  relation.targetSystemId;

                return (
                  <button
                    aria-label={`${sourceName} から ${targetName} への接続`}
                    className={styles.edgeAssistButton}
                    data-testid={`diagram-edge-${relation.id}`}
                    key={relation.id}
                    onBlur={() => handleEdgeLeave(relation.id)}
                    onFocus={() => handleEdgeHover(relation.id)}
                    onMouseEnter={() => handleEdgeHover(relation.id)}
                    onMouseLeave={() => handleEdgeLeave(relation.id)}
                    type="button"
                  >
                    仕向け → 被仕向け
                  </button>
                );
              })}
            </div>
            {hoveredEdge ? (
              <div className={styles.edgeTooltip} role="tooltip">
                <strong className={styles.edgeTooltipTitle}>
                  {hoveredEdge.sourceName} → {hoveredEdge.targetName}
                </strong>
                <p className={styles.edgeTooltipText}>
                  プロトコル: {hoveredEdge.protocol?.trim() || "未設定"}
                </p>
                <p className={styles.edgeTooltipText}>
                  {hoveredEdge.note ?? "メモは未設定です。"}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {diagramMode === "transaction" &&
        systemTransactions.length > 0 &&
        selectedTransaction ? (
          <div className={styles.transactionDiagramSection}>
            <div className={styles.transactionToolbar}>
              <label className={styles.selectorField}>
                <span className={styles.selectorLabel}>表示対象データ流れ</span>
                <select
                  className={styles.selectorInput}
                  data-testid="transaction-select"
                  onChange={(event) => {
                    setSelectedTransactionId(event.target.value);
                    resetTransactionStepEditor();
                    setIsTransactionEditing(false);
                  }}
                  value={selectedTransaction.id}
                >
                  {systemTransactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.name} / {transaction.dataLabel}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.transactionEditActions}>
                <Button
                  data-testid="transaction-flow-create-toggle"
                  onClick={() => {
                    if (isCreatingTransaction) {
                      resetCreateTransactionEditor();
                      return;
                    }

                    setIsCreatingTransaction(true);
                    setIsTransactionEditing(true);
                    setTransactionEditError(null);
                    setPendingTransactionStep(null);
                  }}
                  size="small"
                  variant={isCreatingTransaction ? "secondary" : "primary"}
                >
                  {isCreatingTransaction
                    ? "新規作成を閉じる"
                    : "新しいデータ流れを作成"}
                </Button>
                <Button
                  data-testid="transaction-flow-edit-toggle"
                  disabled={isCreatingTransaction}
                  onClick={() => {
                    setIsTransactionEditing((current) => {
                      const next = !current;
                      if (!next) {
                        resetTransactionStepEditor();
                      }
                      return next;
                    });
                  }}
                  size="small"
                  variant={isTransactionEditing ? "secondary" : "primary"}
                >
                  {isTransactionEditing
                    ? "編集を閉じる"
                    : "React Flow でステップ追加"}
                </Button>
              </div>
            </div>

            {selectedTransactionSummary && !isCreatingTransaction ? (
              <div className={styles.transactionSummaryGrid}>
                <div className={styles.transactionSummaryCard}>
                  <span className={styles.transactionSummaryLabel}>
                    対象データ
                  </span>
                  <strong className={styles.transactionSummaryValue}>
                    {selectedTransaction.dataLabel}
                  </strong>
                </div>
                <div className={styles.transactionSummaryCard}>
                  <span className={styles.transactionSummaryLabel}>
                    起点 → 終点
                  </span>
                  <strong className={styles.transactionSummaryValue}>
                    {selectedTransactionSummary.startName} →{" "}
                    {selectedTransactionSummary.endName}
                  </strong>
                </div>
                <div className={styles.transactionSummaryCard}>
                  <span className={styles.transactionSummaryLabel}>
                    ステップ数
                  </span>
                  <strong className={styles.transactionSummaryValue}>
                    {selectedTransactionSummary.stepCount} 件
                  </strong>
                </div>
                <div className={styles.transactionSummaryCard}>
                  <span className={styles.transactionSummaryLabel}>
                    プロトコル
                  </span>
                  <strong className={styles.transactionSummaryValue}>
                    {selectedTransactionSummary.protocolSummary.join(" / ") ||
                      "未設定"}
                  </strong>
                </div>
              </div>
            ) : null}

            {!isCreatingTransaction ? (
              <div className={styles.transactionMetaCard}>
                <p
                  className={styles.transactionPathText}
                  data-testid="transaction-path-label"
                >
                  {selectedTransactionSummary?.pathLabel ??
                    "経路を表示できません。"}
                </p>
                <p className={styles.transactionNoteText}>
                  {selectedTransaction.note?.trim() ||
                    "トランザクションの説明は未設定です。"}
                </p>
              </div>
            ) : null}

            {isTransactionEditing ? (
              <SystemTransactionFlowEditor
                isCreatingTransaction={isCreatingTransaction}
                isSavingTransactionStep={isSavingTransactionStep}
                manualSourceSystemId={manualSourceSystemId}
                manualTargetSystemId={manualTargetSystemId}
                nextStepOrder={selectedTransactionSteps.length + 1}
                onCancel={
                  isCreatingTransaction
                    ? resetCreateTransactionEditor
                    : resetTransactionStepEditor
                }
                onManualSourceSystemIdChange={setManualSourceSystemId}
                onManualTargetSystemIdChange={setManualTargetSystemId}
                onPendingTransactionStepChange={updatePendingTransactionStep}
                onSave={() => {
                  if (isCreatingTransaction) {
                    void handleCreateTransactionFromFlow();
                    return;
                  }

                  void handleSaveTransactionStep();
                }}
                onStartPendingTransactionStep={startPendingTransactionStep}
                onTransactionDraftChange={updateTransactionDraft}
                pendingRelationOptions={pendingRelationOptions}
                pendingTransactionStep={pendingTransactionStep}
                sortedSystems={sortedSystems}
                systemById={systemById}
                transactionDraft={transactionDraft}
                transactionEditError={transactionEditError}
              />
            ) : null}

            <SystemTransactionFlow
              editable={isTransactionEditing && !isSavingTransactionStep}
              onConnectStep={({ sourceSystemId, targetSystemId }) =>
                startPendingTransactionStep(sourceSystemId, targetSystemId)
              }
              projectCountBySystemId={projectCountBySystemId}
              relationById={relationById}
              steps={selectedTransactionSteps}
              systemById={systemById}
              transaction={selectedTransaction}
            />
          </div>
        ) : null}

        {diagramMode === "relation" &&
        !(sortedSystems.length > 0 && systemRelations.length > 0) ? (
          <p className={styles.emptyText}>
            関連システムを登録すると、ここに全体の関連図を表示します。
          </p>
        ) : null}

        {diagramMode === "transaction" &&
        !(systemTransactions.length > 0 && selectedTransaction) ? (
          <div className={styles.transactionDiagramSection}>
            <div className={styles.transactionToolbar}>
              <p className={styles.emptyText}>
                データ流れがまだありません。最初の1件をここから作成できます。
              </p>
              <div className={styles.transactionEditActions}>
                <Button
                  data-testid="transaction-flow-create-toggle-empty"
                  onClick={() => {
                    setIsCreatingTransaction((current) => {
                      const next = !current;
                      if (!next) {
                        resetCreateTransactionEditor();
                      } else {
                        setIsTransactionEditing(true);
                      }
                      return next;
                    });
                  }}
                  size="small"
                >
                  {isCreatingTransaction
                    ? "新規作成を閉じる"
                    : "新しいデータ流れを作成"}
                </Button>
              </div>
            </div>

            {isCreatingTransaction ? (
              <SystemTransactionFlowEditor
                isCreatingTransaction
                isSavingTransactionStep={isSavingTransactionStep}
                manualSourceSystemId={manualSourceSystemId}
                manualTargetSystemId={manualTargetSystemId}
                nextStepOrder={1}
                onCancel={resetCreateTransactionEditor}
                onManualSourceSystemIdChange={setManualSourceSystemId}
                onManualTargetSystemIdChange={setManualTargetSystemId}
                onPendingTransactionStepChange={updatePendingTransactionStep}
                onSave={() => void handleCreateTransactionFromFlow()}
                onStartPendingTransactionStep={startPendingTransactionStep}
                onTransactionDraftChange={updateTransactionDraft}
                pendingRelationOptions={pendingRelationOptions}
                pendingTransactionStep={pendingTransactionStep}
                sortedSystems={sortedSystems}
                systemById={systemById}
                transactionDraft={transactionDraft}
                transactionEditError={transactionEditError}
              />
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
