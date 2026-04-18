import { Button } from "../../components/ui/Button";
import type { ManagedSystem, SystemRelation } from "../../types/project";
import { formatSystemOptionLabel } from "./systemFormUtils";
import styles from "./SystemLandscapePage.module.css";

export interface PendingTransactionStepDraft {
  sourceSystemId: string;
  targetSystemId: string;
  relationId: string;
  actionLabel: string;
  note: string;
}

export interface TransactionDraftFormState {
  name: string;
  dataLabel: string;
  note: string;
}

interface SystemTransactionFlowEditorProps {
  isCreatingTransaction: boolean;
  isSavingTransactionStep: boolean;
  manualSourceSystemId: string;
  manualTargetSystemId: string;
  nextStepOrder: number;
  pendingRelationOptions: SystemRelation[];
  pendingTransactionStep: PendingTransactionStepDraft | null;
  sortedSystems: ManagedSystem[];
  systemById: ReadonlyMap<string, ManagedSystem>;
  transactionDraft: TransactionDraftFormState;
  transactionEditError: string | null;
  onCancel: () => void;
  onManualSourceSystemIdChange: (value: string) => void;
  onManualTargetSystemIdChange: (value: string) => void;
  onPendingTransactionStepChange: (
    patch: Partial<PendingTransactionStepDraft>,
  ) => void;
  onSave: () => void;
  onStartPendingTransactionStep: (
    sourceSystemId: string,
    targetSystemId: string,
  ) => void;
  onTransactionDraftChange: (patch: Partial<TransactionDraftFormState>) => void;
}

export function SystemTransactionFlowEditor({
  isCreatingTransaction,
  isSavingTransactionStep,
  manualSourceSystemId,
  manualTargetSystemId,
  nextStepOrder,
  pendingRelationOptions,
  pendingTransactionStep,
  sortedSystems,
  systemById,
  transactionDraft,
  transactionEditError,
  onCancel,
  onManualSourceSystemIdChange,
  onManualTargetSystemIdChange,
  onPendingTransactionStepChange,
  onSave,
  onStartPendingTransactionStep,
  onTransactionDraftChange,
}: SystemTransactionFlowEditorProps) {
  return (
    <>
      {isCreatingTransaction ? (
        <div
          className={styles.transactionEditPanel}
          data-testid="transaction-flow-create-panel"
        >
          <div className={styles.transactionManualGrid}>
            <label className={styles.formFieldInline}>
              <span className={styles.selectorLabel}>トランザクション名</span>
              <input
                className={styles.selectorInput}
                data-testid="transaction-flow-create-name"
                onChange={(event) =>
                  onTransactionDraftChange({ name: event.target.value })
                }
                value={transactionDraft.name}
              />
            </label>
            <label className={styles.formFieldInline}>
              <span className={styles.selectorLabel}>対象データ</span>
              <input
                className={styles.selectorInput}
                data-testid="transaction-flow-create-data-label"
                onChange={(event) =>
                  onTransactionDraftChange({ dataLabel: event.target.value })
                }
                value={transactionDraft.dataLabel}
              />
            </label>
            <label className={styles.formFieldInline}>
              <span className={styles.selectorLabel}>説明</span>
              <input
                className={styles.selectorInput}
                data-testid="transaction-flow-create-note"
                onChange={(event) =>
                  onTransactionDraftChange({ note: event.target.value })
                }
                value={transactionDraft.note}
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className={styles.transactionEditPanel}>
        <p className={styles.transactionEditLead}>
          ノードの右側から左側へドラッグして、追加するステップ候補を作成します。
        </p>
        <p className={styles.transactionEditSubtle}>
          既存の通信線がある組み合わせだけ追加できます。ドラッグしづらい場合は下の選択欄からも指定できます。
        </p>

        <div className={styles.transactionManualGrid}>
          <label className={styles.formFieldInline}>
            <span className={styles.selectorLabel}>接続元</span>
            <select
              className={styles.selectorInput}
              data-testid="transaction-flow-source-select"
              onChange={(event) =>
                onManualSourceSystemIdChange(event.target.value)
              }
              value={manualSourceSystemId}
            >
              <option value="">選択してください</option>
              {sortedSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {formatSystemOptionLabel(system)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.formFieldInline}>
            <span className={styles.selectorLabel}>接続先</span>
            <select
              className={styles.selectorInput}
              data-testid="transaction-flow-target-select"
              onChange={(event) =>
                onManualTargetSystemIdChange(event.target.value)
              }
              value={manualTargetSystemId}
            >
              <option value="">選択してください</option>
              {sortedSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {formatSystemOptionLabel(system)}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.transactionManualAction}>
            <Button
              data-testid="transaction-flow-start-step"
              disabled={
                !manualSourceSystemId ||
                !manualTargetSystemId ||
                isSavingTransactionStep
              }
              onClick={() =>
                onStartPendingTransactionStep(
                  manualSourceSystemId,
                  manualTargetSystemId,
                )
              }
              size="small"
              type="button"
              variant="secondary"
            >
              ステップ候補を作成
            </Button>
          </div>
        </div>

        {pendingTransactionStep ? (
          <div
            className={styles.transactionPendingCard}
            data-testid="transaction-flow-pending-step"
          >
            <div className={styles.transactionPendingHeader}>
              <strong className={styles.transactionPendingTitle}>
                {systemById.get(pendingTransactionStep.sourceSystemId)?.name ??
                  pendingTransactionStep.sourceSystemId}
                {" → "}
                {systemById.get(pendingTransactionStep.targetSystemId)?.name ??
                  pendingTransactionStep.targetSystemId}
              </strong>
              <span className={styles.transactionPendingOrder}>
                Step {nextStepOrder}
              </span>
            </div>

            <div className={styles.transactionManualGrid}>
              <label className={styles.formFieldInline}>
                <span className={styles.selectorLabel}>通信線</span>
                <select
                  className={styles.selectorInput}
                  data-testid="transaction-flow-relation-select"
                  onChange={(event) =>
                    onPendingTransactionStepChange({
                      relationId: event.target.value,
                    })
                  }
                  value={pendingTransactionStep.relationId}
                >
                  {pendingRelationOptions.map((relation) => (
                    <option key={relation.id} value={relation.id}>
                      {relation.id} / {relation.protocol?.trim() || "未設定"}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formFieldInline}>
                <span className={styles.selectorLabel}>処理ラベル</span>
                <input
                  className={styles.selectorInput}
                  data-testid="transaction-flow-action-input"
                  onChange={(event) =>
                    onPendingTransactionStepChange({
                      actionLabel: event.target.value,
                    })
                  }
                  value={pendingTransactionStep.actionLabel}
                />
              </label>

              <label className={styles.formFieldInline}>
                <span className={styles.selectorLabel}>メモ</span>
                <input
                  className={styles.selectorInput}
                  data-testid="transaction-flow-note-input"
                  onChange={(event) =>
                    onPendingTransactionStepChange({ note: event.target.value })
                  }
                  value={pendingTransactionStep.note}
                />
              </label>
            </div>

            <div className={styles.transactionEditActions}>
              <Button
                data-testid={
                  isCreatingTransaction
                    ? "transaction-flow-create-save"
                    : "transaction-flow-save-step"
                }
                disabled={isSavingTransactionStep}
                onClick={onSave}
                size="small"
                type="button"
              >
                {isSavingTransactionStep
                  ? "保存中..."
                  : isCreatingTransaction
                    ? "この流れを作成"
                    : "このステップを追加"}
              </Button>
              <Button
                disabled={isSavingTransactionStep}
                onClick={onCancel}
                size="small"
                type="button"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
          </div>
        ) : null}

        {transactionEditError ? (
          <p className={styles.transactionEditError}>{transactionEditError}</p>
        ) : null}
      </div>
    </>
  );
}
