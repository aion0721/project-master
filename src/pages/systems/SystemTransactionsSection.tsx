import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import pageStyles from '../../styles/page.module.css'
import type {
  CreateSystemTransactionInput,
  ManagedSystem,
  SystemRelation,
  SystemTransaction,
  SystemTransactionStep,
  UpdateSystemTransactionInput,
} from '../../types/project'
import styles from './SystemDetailPage.module.css'

interface TransactionEntry {
  transaction: SystemTransaction
  pathLabel: string
  steps: SystemTransactionStep[]
}

interface RelationTransactionGroup {
  relation: SystemRelation
  system: ManagedSystem | undefined
  transactions: Array<{
    transaction: SystemTransaction
    pathLabel: string
    relationSteps: SystemTransactionStep[]
  }>
}

interface RelationOption {
  value: string
  label: string
  sourceSystemId: string
  targetSystemId: string
}

interface TransactionStepDraft {
  id?: string
  relationId: string
  actionLabel: string
  note: string
}

interface TransactionFormState {
  name: string
  dataLabel: string
  note: string
  steps: TransactionStepDraft[]
}

interface SystemTransactionsSectionProps {
  currentSystemId: string
  groups: RelationTransactionGroup[]
  relationOptions: RelationOption[]
  transactions: TransactionEntry[]
  onCreate: (input: CreateSystemTransactionInput) => Promise<void>
  onDelete: (transactionId: string) => Promise<void>
  onUpdate: (transactionId: string, input: UpdateSystemTransactionInput) => Promise<void>
}

function buildInitialFormState(relationId = ''): TransactionFormState {
  return {
    name: '',
    dataLabel: '',
    note: '',
    steps: [{ relationId, actionLabel: '', note: '' }],
  }
}

function buildEditFormState(entry: TransactionEntry): TransactionFormState {
  return {
    name: entry.transaction.name,
    dataLabel: entry.transaction.dataLabel,
    note: entry.transaction.note ?? '',
    steps: entry.steps.map((step) => ({
      id: step.id,
      relationId: step.relationId,
      actionLabel: step.actionLabel ?? '',
      note: step.note ?? '',
    })),
  }
}

export function SystemTransactionsSection({
  currentSystemId,
  groups,
  relationOptions,
  transactions,
  onCreate,
  onDelete,
  onUpdate,
}: SystemTransactionsSectionProps) {
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [formState, setFormState] = useState<TransactionFormState>(() =>
    buildInitialFormState(relationOptions[0]?.value ?? ''),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editingEntry = useMemo(
    () => transactions.find((entry) => entry.transaction.id === editingTransactionId) ?? null,
    [editingTransactionId, transactions],
  )

  useEffect(() => {
    if (editingEntry) {
      setFormState(buildEditFormState(editingEntry))
      return
    }

    setFormState(buildInitialFormState(relationOptions[0]?.value ?? ''))
  }, [editingEntry, relationOptions])

  function updateFormField<Key extends keyof Omit<TransactionFormState, 'steps'>>(
    key: Key,
    value: TransactionFormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateStep(index: number, patch: Partial<TransactionStepDraft>) {
    setFormState((current) => ({
      ...current,
      steps: current.steps.map((step, currentIndex) =>
        currentIndex === index ? { ...step, ...patch } : step,
      ),
    }))
  }

  function addStep() {
    setFormState((current) => ({
      ...current,
      steps: current.steps.concat({
        relationId: relationOptions[0]?.value ?? '',
        actionLabel: '',
        note: '',
      }),
    }))
  }

  function removeStep(index: number) {
    setFormState((current) => ({
      ...current,
      steps: current.steps.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  function resetEditor() {
    setEditingTransactionId(null)
    setError(null)
    setFormState(buildInitialFormState(relationOptions[0]?.value ?? ''))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = formState.name.trim()
    const dataLabel = formState.dataLabel.trim()

    if (!name || !dataLabel) {
      setError('トランザクション名と対象データは必須です。')
      return
    }

    if (formState.steps.length === 0) {
      setError('ステップを1件以上入力してください。')
      return
    }

    const steps = formState.steps.map((step, index) => {
      const relation = relationOptions.find((option) => option.value === step.relationId)

      if (!relation) {
        throw new Error(`Step ${index + 1} の通信線を選択してください。`)
      }

      return {
        id: step.id,
        relationId: relation.value,
        sourceSystemId: relation.sourceSystemId,
        targetSystemId: relation.targetSystemId,
        stepOrder: index + 1,
        actionLabel: step.actionLabel.trim() || null,
        note: step.note.trim() || null,
      }
    })

    setError(null)
    setIsSaving(true)

    try {
      if (editingTransactionId) {
        await onUpdate(editingTransactionId, {
          name,
          dataLabel,
          note: formState.note.trim() || null,
          steps,
        })
      } else {
        await onCreate({
          name,
          dataLabel,
          note: formState.note.trim() || null,
          steps,
        })
      }

      resetEditor()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'データ流れの保存に失敗しました。')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(transactionId: string) {
    if (!window.confirm('このデータ流れを削除します。')) {
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      await onDelete(transactionId)
      if (editingTransactionId === transactionId) {
        resetEditor()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'データ流れの削除に失敗しました。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>データ流れ</h2>
          <p className={pageStyles.sectionDescription}>
            通信線ごとに、このシステムを通るデータ連携を表示し、その場で編集できます。
          </p>
        </div>
        <div className={styles.headerActions}>
          {editingTransactionId ? (
            <Button onClick={resetEditor} size="small" variant="secondary">
              新規入力へ戻す
            </Button>
          ) : null}
        </div>
      </div>

      <form className={styles.transactionEditor} onSubmit={(event) => void handleSubmit(event)}>
        <div className={styles.systemFormGrid}>
          <label className={styles.formField}>
            <span className={styles.formLabel}>トランザクション名</span>
            <input
              className={styles.input}
              data-testid="system-transaction-name-input"
              onChange={(event) => updateFormField('name', event.target.value)}
              value={formState.name}
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.formLabel}>対象データ</span>
            <input
              className={styles.input}
              data-testid="system-transaction-data-label-input"
              onChange={(event) => updateFormField('dataLabel', event.target.value)}
              value={formState.dataLabel}
            />
          </label>
        </div>

        <label className={styles.formField}>
          <span className={styles.formLabel}>説明</span>
          <textarea
            className={`${styles.input} ${styles.relationTextarea}`}
            data-testid="system-transaction-note-input"
            onChange={(event) => updateFormField('note', event.target.value)}
            value={formState.note}
          />
        </label>

        <div className={styles.assignmentHeader}>
          <h3 className={styles.assignmentTitle}>ステップ</h3>
          <Button
            disabled={isSaving || relationOptions.length === 0}
            onClick={addStep}
            size="small"
            type="button"
            variant="secondary"
          >
            追加
          </Button>
        </div>

        <div className={styles.transactionDraftList}>
          {formState.steps.map((step, index) => {
            const relation = relationOptions.find((option) => option.value === step.relationId)

            return (
              <div className={styles.transactionDraftRow} key={step.id ?? `draft-${index}`}>
                <div className={styles.transactionDraftOrder}>Step {index + 1}</div>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>通信線</span>
                  <select
                    className={styles.input}
                    data-testid={`system-transaction-step-relation-${index}`}
                    onChange={(event) => updateStep(index, { relationId: event.target.value })}
                    value={step.relationId}
                  >
                    {relationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>処理ラベル</span>
                  <input
                    className={styles.input}
                    data-testid={`system-transaction-step-action-${index}`}
                    onChange={(event) => updateStep(index, { actionLabel: event.target.value })}
                    value={step.actionLabel}
                  />
                </label>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>ステップメモ</span>
                  <input
                    className={styles.input}
                    data-testid={`system-transaction-step-note-${index}`}
                    onChange={(event) => updateStep(index, { note: event.target.value })}
                    value={step.note}
                  />
                </label>
                <div className={styles.transactionDraftRelation}>
                  {relation
                    ? `${relation.label}`
                    : '通信線未選択'}
                </div>
                <div className={styles.relationActions}>
                  <Button
                    data-testid={`system-transaction-step-remove-${index}`}
                    disabled={isSaving || formState.steps.length === 1}
                    onClick={() => removeStep(index)}
                    size="small"
                    type="button"
                    variant="danger"
                  >
                    削除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {error ? <p className={styles.errorText}>{error}</p> : null}

        <div className={styles.structureActions}>
          <Button
            data-testid="system-transaction-save-button"
            disabled={isSaving || relationOptions.length === 0}
            size="small"
            type="submit"
          >
            {isSaving ? '保存中...' : editingTransactionId ? '更新' : '登録'}
          </Button>
        </div>
      </form>

      <div className={styles.transactionCatalogList}>
        {transactions.length > 0 ? (
          transactions.map((entry) => (
            <article className={styles.transactionCatalogCard} key={entry.transaction.id}>
              <div className={styles.transactionItemHeader}>
                <div>
                  <h3 className={styles.transactionTitle}>{entry.transaction.name}</h3>
                  <p className={styles.transactionDataLabel}>対象データ: {entry.transaction.dataLabel}</p>
                </div>
                <span className={styles.transactionPathChip}>{entry.pathLabel}</span>
              </div>
              {entry.transaction.note?.trim() ? (
                <p className={styles.transactionDescription}>{entry.transaction.note}</p>
              ) : null}
              <div className={styles.relationActions}>
                <Button
                  data-testid={`system-transaction-edit-${entry.transaction.id}`}
                  disabled={isSaving}
                  onClick={() => {
                    setEditingTransactionId(entry.transaction.id)
                    setError(null)
                  }}
                  size="small"
                  type="button"
                  variant="secondary"
                >
                  編集
                </Button>
                <Button
                  data-testid={`system-transaction-delete-${entry.transaction.id}`}
                  disabled={isSaving}
                  onClick={() => void handleDelete(entry.transaction.id)}
                  size="small"
                  type="button"
                  variant="danger"
                >
                  削除
                </Button>
              </div>
            </article>
          ))
        ) : (
          <p className={styles.emptyText}>このシステムに関係するデータ流れはまだ登録されていません。</p>
        )}
      </div>

      {groups.length > 0 ? (
        <div className={styles.transactionGroupList}>
          {groups.map(({ relation, system, transactions: groupedTransactions }) => {
            const isOutgoing = relation.sourceSystemId === currentSystemId

            return (
              <section className={styles.transactionGroupCard} key={relation.id}>
                <div className={styles.transactionGroupHeader}>
                  <div className={styles.transactionGroupHeading}>
                    <p className={styles.transactionGroupDirection}>
                      {isOutgoing ? 'このシステム → 相手' : '相手 → このシステム'}
                    </p>
                    {system ? (
                      <Link className={styles.projectLink} to={`/systems/${system.id}`}>
                        {system.id} / {system.name}
                      </Link>
                    ) : (
                      <span className={styles.emptyText}>接続先システムが見つかりません。</span>
                    )}
                  </div>
                  <p className={styles.transactionGroupMeta}>
                    プロトコル: {relation.protocol?.trim() || '未設定'}
                  </p>
                </div>

                <p className={styles.transactionGroupNote}>{relation.note?.trim() || '補足メモなし'}</p>

                {groupedTransactions.length > 0 ? (
                  <div className={styles.transactionList}>
                    {groupedTransactions.map(({ transaction, pathLabel, relationSteps }) => (
                      <article className={styles.transactionItem} key={`${relation.id}-${transaction.id}`}>
                        <div className={styles.transactionItemHeader}>
                          <div>
                            <h3 className={styles.transactionTitle}>{transaction.name}</h3>
                            <p className={styles.transactionDataLabel}>対象データ: {transaction.dataLabel}</p>
                          </div>
                          <span className={styles.transactionPathChip}>{pathLabel}</span>
                        </div>
                        {transaction.note?.trim() ? (
                          <p className={styles.transactionDescription}>{transaction.note}</p>
                        ) : null}
                        <div className={styles.transactionStepList}>
                          {relationSteps.map((step) => (
                            <div className={styles.transactionStepItem} key={step.id}>
                              <span className={styles.transactionStepOrder}>Step {step.stepOrder}</span>
                              <span className={styles.transactionStepAction}>
                                {step.actionLabel?.trim() || '処理ラベル未設定'}
                              </span>
                              <span className={styles.transactionStepNote}>
                                {step.note?.trim() || 'ステップメモなし'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyText}>
                    この通信線に紐づくデータ流れはまだ登録されていません。
                  </p>
                )}
              </section>
            )
          })}
        </div>
      ) : null}
    </Panel>
  )
}
