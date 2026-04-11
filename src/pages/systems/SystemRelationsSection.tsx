import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import pageStyles from '../../styles/page.module.css'
import type { CreateSystemRelationInput, ManagedSystem, SystemRelation } from '../../types/project'
import {
  buildInitialSystemRelationForm,
  formatSystemOptionLabel,
  toNullableValue,
  validateRelationInput,
  type SystemRelationFormState,
} from './systemFormUtils'
import styles from './SystemDetailPage.module.css'

interface RelatedSystemItem {
  relation: SystemRelation
  system: ManagedSystem | undefined
}

interface SystemRelationsSectionProps {
  onCreateRelation: (input: CreateSystemRelationInput) => Promise<void>
  onDeleteRelation: (relationId: string) => Promise<void>
  relatedSystems: RelatedSystemItem[]
  relationTargetOptions: ManagedSystem[]
  system: ManagedSystem
}

export function SystemRelationsSection({
  onCreateRelation,
  onDeleteRelation,
  relatedSystems,
  relationTargetOptions,
  system,
}: SystemRelationsSectionProps) {
  const [relationForm, setRelationForm] = useState(buildInitialSystemRelationForm)
  const [relationDirection, setRelationDirection] = useState<'incoming' | 'outgoing'>('outgoing')
  const [relationError, setRelationError] = useState<string | null>(null)
  const [isSavingRelation, setIsSavingRelation] = useState(false)

  useEffect(() => {
    setRelationForm(buildInitialSystemRelationForm())
    setRelationDirection('outgoing')
    setRelationError(null)
  }, [system.id])

  function updateRelationField<Key extends keyof SystemRelationFormState>(
    key: Key,
    value: SystemRelationFormState[Key],
  ) {
    setRelationForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleCreateRelation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextForm =
      relationDirection === 'outgoing'
        ? {
            ...relationForm,
            sourceSystemId: system.id,
            targetSystemId: relationForm.targetSystemId,
          }
        : {
            ...relationForm,
            sourceSystemId: relationForm.targetSystemId,
            targetSystemId: system.id,
          }

    const validationMessage = validateRelationInput(nextForm)
    if (validationMessage) {
      setRelationError(validationMessage)
      return
    }

    setRelationError(null)
    setIsSavingRelation(true)

    try {
      await onCreateRelation({
        sourceSystemId: nextForm.sourceSystemId,
        targetSystemId: nextForm.targetSystemId,
        protocol: toNullableValue(nextForm.protocol),
        note: toNullableValue(nextForm.note),
      })
      setRelationForm(buildInitialSystemRelationForm())
      setRelationDirection('outgoing')
    } catch (caughtError) {
      setRelationError(caughtError instanceof Error ? caughtError.message : '関連システム登録に失敗しました。')
    } finally {
      setIsSavingRelation(false)
    }
  }

  async function handleDeleteRelation(relationId: string) {
    const relation = relatedSystems.find((item) => item.relation.id === relationId)?.relation

    if (
      !window.confirm(
        `関連システム ${relation?.sourceSystemId ?? relationId} -> ${relation?.targetSystemId ?? relationId} を削除します。`,
      )
    ) {
      return
    }

    setRelationError(null)
    setIsSavingRelation(true)

    try {
      await onDeleteRelation(relationId)
    } catch (caughtError) {
      setRelationError(caughtError instanceof Error ? caughtError.message : '関連システム削除に失敗しました。')
    } finally {
      setIsSavingRelation(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>関連システム</h2>
          <p className={pageStyles.sectionDescription}>連携や依存があるシステムを、この画面で管理します。</p>
        </div>
      </div>
      <form className={styles.relationForm} onSubmit={(event) => void handleCreateRelation(event)}>
        <div className={styles.relationFormGrid}>
          <label className={styles.formField}>
            <span className={styles.formLabel}>向き</span>
            <select
              className={styles.input}
              onChange={(event) =>
                setRelationDirection(event.target.value === 'incoming' ? 'incoming' : 'outgoing')
              }
              value={relationDirection}
            >
              <option value="outgoing">このシステム → 相手</option>
              <option value="incoming">相手 → このシステム</option>
            </select>
          </label>

          <label className={styles.formField}>
            <span className={styles.formLabel}>
              {relationDirection === 'outgoing' ? '接続先システム' : '接続元システム'}
            </span>
            <SearchSelect
              ariaLabel={relationDirection === 'outgoing' ? '連携先システム' : '連携元システム'}
              className={styles.input}
              onChange={(targetSystemId) => updateRelationField('targetSystemId', targetSystemId)}
              options={relationTargetOptions.map((option) => ({
                value: option.id,
                label: formatSystemOptionLabel(option),
                keywords: [option.name, option.category],
              }))}
              placeholder="システムを検索"
              value={relationForm.targetSystemId}
            />
          </label>

          <label className={styles.formField}>
            <span className={styles.formLabel}>プロトコル</span>
            <input
              className={styles.input}
              list="system-detail-protocol-options"
              onChange={(event) => updateRelationField('protocol', event.target.value)}
              placeholder="例: SSH / HTTPS / SFTP"
              value={relationForm.protocol}
            />
          </label>
        </div>

        <label className={styles.formField}>
          <span className={styles.formLabel}>メモ</span>
          <textarea
            className={`${styles.input} ${styles.relationTextarea}`}
            onChange={(event) => updateRelationField('note', event.target.value)}
            placeholder="接続用途や補足を記載"
            value={relationForm.note}
          />
        </label>

        {relationError ? <p className={styles.errorText}>{relationError}</p> : null}

        <div className={styles.relationActions}>
          <Button disabled={isSavingRelation} size="small" type="submit">
            {isSavingRelation ? '登録中...' : '関連システムを追加'}
          </Button>
        </div>
      </form>

      <datalist id="system-detail-protocol-options">
        <option value="SSH" />
        <option value="HTTPS" />
        <option value="HTTP" />
        <option value="SFTP" />
        <option value="FTP" />
        <option value="JDBC" />
      </datalist>

      {relatedSystems.length > 0 ? (
        <div className={styles.relationList}>
          {relatedSystems.map(({ relation, system: relatedSystem }) => (
            <div className={styles.relationItem} key={relation.id}>
              <Link className={styles.projectLink} to={`/systems/${relatedSystem?.id ?? ''}`}>
                {relatedSystem ? `${relatedSystem.id} / ${relatedSystem.name}` : '未設定'}
              </Link>
              <p className={styles.relationDirection}>
                {relation.sourceSystemId === system.id ? 'このシステム → 相手' : '相手 → このシステム'}
              </p>
              <p className={styles.relationNote}>
                {relation.protocol?.trim() ? `プロトコル: ${relation.protocol}` : 'プロトコル: 未設定'}
                <br />
                {relation.note?.trim() || '補足メモなし'}
              </p>
              <div className={styles.relationActions}>
                <Button
                  data-testid={`system-detail-delete-relation-${relation.id}`}
                  disabled={isSavingRelation}
                  onClick={() => void handleDeleteRelation(relation.id)}
                  size="small"
                  variant="danger"
                >
                  削除
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyText}>関連システムはありません。</p>
      )}
    </Panel>
  )
}
