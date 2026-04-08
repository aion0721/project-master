import { useMemo, useState } from 'react'
import { EntityIcon } from '../../components/EntityIcon'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import type { CreateSystemRelationInput } from '../../types/project'
import {
  buildInitialSystemRelationForm,
  formatSystemOptionLabel,
  toNullableValue,
  validateRelationInput,
} from './systemFormUtils'
import pageStyles from '../../styles/page.module.css'
import formStyles from '../../styles/form.module.css'
import styles from './SystemRelationManagementPage.module.css'

export function SystemRelationManagementPage() {
  const {
    systems,
    systemRelations,
    isLoading,
    error,
    createSystemRelation,
    deleteSystemRelation,
  } = useProjectData()
  const [formData, setFormData] = useState(buildInitialSystemRelationForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const systemNameById = useMemo(
    () => new Map(systems.map((system) => [system.id, system.name])),
    [systems],
  )

  const sortedSystems = useMemo(
    () => [...systems].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [systems],
  )

  const sortedRelations = useMemo(
    () =>
      [...systemRelations].sort((left, right) => {
        const leftKey = `${systemNameById.get(left.sourceSystemId) ?? left.sourceSystemId}-${systemNameById.get(left.targetSystemId) ?? left.targetSystemId}`
        const rightKey = `${systemNameById.get(right.sourceSystemId) ?? right.sourceSystemId}-${systemNameById.get(right.targetSystemId) ?? right.targetSystemId}`
        return leftKey.localeCompare(rightKey, 'ja')
      }),
    [systemNameById, systemRelations],
  )

  function updateField<Key extends keyof typeof formData>(key: Key, value: (typeof formData)[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleCreateRelationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const validationMessage = validateRelationInput(formData)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateSystemRelationInput = {
        sourceSystemId: formData.sourceSystemId,
        targetSystemId: formData.targetSystemId,
        note: toNullableValue(formData.note),
      }
      await createSystemRelation(input)
      setFormData(buildInitialSystemRelationForm())
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '関連システム登録に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteRelation(relationId: string) {
    const relation = systemRelations.find((item) => item.id === relationId)
    const sourceLabel = relation
      ? `${relation.sourceSystemId} / ${systemNameById.get(relation.sourceSystemId) ?? relation.sourceSystemId}`
      : relationId
    const targetLabel = relation
      ? `${relation.targetSystemId} / ${systemNameById.get(relation.targetSystemId) ?? relation.targetSystemId}`
      : relationId

    if (!window.confirm(`関連システム ${sourceLabel} -> ${targetLabel} を削除します。`)) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await deleteSystemRelation(relationId)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '関連システム削除に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>関係一覧を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム関連を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>関係一覧を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <Panel variant="hero">
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="system" />
          <div className={pageStyles.heroHeadingBody}>
            <p className={pageStyles.eyebrow}>System Relations</p>
            <h1 className={pageStyles.title}>関係一覧</h1>
            <p className={pageStyles.description}>
              システム間の接続元と接続先を管理します。関連図の矢印はここで定義した向きで表示されます。
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>関連システム登録</h2>
            <p className={pageStyles.sectionDescription}>
              接続元から接続先へ向かう流れを登録します。連携内容はメモで補足できます。
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleCreateRelationSubmit}>
          <div className={styles.formGrid}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>接続元システム</span>
              <select
                className={formStyles.control}
                onChange={(event) => updateField('sourceSystemId', event.target.value)}
                value={formData.sourceSystemId}
              >
                <option value="">選択してください</option>
                {sortedSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {formatSystemOptionLabel(system)}
                  </option>
                ))}
              </select>
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>接続先システム</span>
              <select
                className={formStyles.control}
                onChange={(event) => updateField('targetSystemId', event.target.value)}
                value={formData.targetSystemId}
              >
                <option value="">選択してください</option>
                {sortedSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {formatSystemOptionLabel(system)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={formStyles.field}>
            <span className={formStyles.label}>メモ</span>
            <textarea
              className={styles.textarea}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="連携内容や向きの補足を記載"
              value={formData.note}
            />
          </label>

          {submitError ? <p className={formStyles.errorText}>{submitError}</p> : null}

          <div className={styles.actionRow}>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '登録中...' : '関連システムを登録'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>登録済みの関係</h2>
            <p className={pageStyles.sectionDescription}>
              左から右へ向かう矢印でシステム連携を定義しています。
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>接続元</th>
                <th>向き</th>
                <th>接続先</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedRelations.map((relation) => (
                <tr data-testid={`system-relation-row-${relation.id}`} key={relation.id}>
                  <td>{systemNameById.get(relation.sourceSystemId) ?? relation.sourceSystemId}</td>
                  <td className={styles.arrowCell}>仕向け → 被仕向け</td>
                  <td>{systemNameById.get(relation.targetSystemId) ?? relation.targetSystemId}</td>
                  <td className={styles.noteCell}>{relation.note ?? 'なし'}</td>
                  <td>
                    <Button
                      data-testid={`delete-system-relation-${relation.id}`}
                      disabled={isSubmitting}
                      onClick={() => void handleDeleteRelation(relation.id)}
                      size="small"
                      variant="danger"
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              ))}
              {sortedRelations.length === 0 ? (
                <tr>
                  <td className={styles.noteCell} colSpan={5}>
                    関連システムはまだ登録されていません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
