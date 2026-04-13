import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import pageStyles from '../../styles/page.module.css'
import type {
  CreateSystemRelationInput,
  ManagedSystem,
  SystemRelation,
  UpdateSystemRelationInput,
} from '../../types/project'
import {
  buildEditSystemRelationForm,
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
  onUpdateRelation: (relationId: string, input: UpdateSystemRelationInput) => Promise<void>
  relatedSystems: RelatedSystemItem[]
  relationTargetOptions: ManagedSystem[]
  system: ManagedSystem
}

export function SystemRelationsSection({
  onCreateRelation,
  onDeleteRelation,
  onUpdateRelation,
  relatedSystems,
  relationTargetOptions,
  system,
}: SystemRelationsSectionProps) {
  const [relationForm, setRelationForm] = useState(buildInitialSystemRelationForm)
  const [relationDirection, setRelationDirection] = useState<'incoming' | 'outgoing'>('outgoing')
  const [relationError, setRelationError] = useState<string | null>(null)
  const [isSavingRelation, setIsSavingRelation] = useState(false)
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null)
  const [editRelationForm, setEditRelationForm] = useState(buildInitialSystemRelationForm)
  const [editRelationDirection, setEditRelationDirection] = useState<'incoming' | 'outgoing'>('outgoing')
  const [editRelationError, setEditRelationError] = useState<string | null>(null)

  useEffect(() => {
    setRelationForm(buildInitialSystemRelationForm())
    setRelationDirection('outgoing')
    setRelationError(null)
    setEditingRelationId(null)
    setEditRelationForm(buildInitialSystemRelationForm())
    setEditRelationDirection('outgoing')
    setEditRelationError(null)
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

  function updateEditRelationField<Key extends keyof SystemRelationFormState>(
    key: Key,
    value: SystemRelationFormState[Key],
  ) {
    setEditRelationForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function buildRelationInput(
    form: SystemRelationFormState,
    direction: 'incoming' | 'outgoing',
  ): SystemRelationFormState {
    return direction === 'outgoing'
      ? {
          ...form,
          sourceSystemId: system.id,
          targetSystemId: form.targetSystemId,
        }
      : {
          ...form,
          sourceSystemId: form.targetSystemId,
          targetSystemId: system.id,
        }
  }

  async function handleCreateRelation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextForm = buildRelationInput(relationForm, relationDirection)

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

  function handleStartEdit(relation: SystemRelation) {
    const isOutgoing = relation.sourceSystemId === system.id
    setEditingRelationId(relation.id)
    setEditRelationDirection(isOutgoing ? 'outgoing' : 'incoming')
    setEditRelationForm(buildEditSystemRelationForm(relation, system.id))
    setEditRelationError(null)
    setRelationError(null)
  }

  function handleCancelEdit() {
    setEditingRelationId(null)
    setEditRelationForm(buildInitialSystemRelationForm())
    setEditRelationDirection('outgoing')
    setEditRelationError(null)
  }

  async function handleUpdateRelation(event: FormEvent<HTMLFormElement>, relationId: string) {
    event.preventDefault()

    const nextForm = buildRelationInput(editRelationForm, editRelationDirection)
    const validationMessage = validateRelationInput(nextForm)

    if (validationMessage) {
      setEditRelationError(validationMessage)
      return
    }

    setEditRelationError(null)
    setIsSavingRelation(true)

    try {
      await onUpdateRelation(relationId, {
        sourceSystemId: nextForm.sourceSystemId,
        targetSystemId: nextForm.targetSystemId,
        protocol: toNullableValue(nextForm.protocol),
        note: toNullableValue(nextForm.note),
      })
      handleCancelEdit()
    } catch (caughtError) {
      setEditRelationError(caughtError instanceof Error ? caughtError.message : '関連システム更新に失敗しました。')
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
              {editingRelationId === relation.id ? (
                <form
                  className={styles.relationForm}
                  onSubmit={(event) => void handleUpdateRelation(event, relation.id)}
                >
                  <div className={styles.relationFormGrid}>
                    <label className={styles.formField}>
                      <span className={styles.formLabel}>向き</span>
                      <select
                        className={styles.input}
                        data-testid={`system-detail-relation-direction-${relation.id}`}
                        onChange={(event) =>
                          setEditRelationDirection(
                            event.target.value === 'incoming' ? 'incoming' : 'outgoing',
                          )
                        }
                        value={editRelationDirection}
                      >
                        <option value="outgoing">このシステム → 相手</option>
                        <option value="incoming">相手 → このシステム</option>
                      </select>
                    </label>

                    <label className={styles.formField}>
                      <span className={styles.formLabel}>
                        {editRelationDirection === 'outgoing' ? '接続先システム' : '接続元システム'}
                      </span>
                      <SearchSelect
                        ariaLabel={
                          editRelationDirection === 'outgoing' ? '編集対象の連携先システム' : '編集対象の連携元システム'
                        }
                        className={styles.input}
                        onChange={(targetSystemId) => updateEditRelationField('targetSystemId', targetSystemId)}
                        options={relationTargetOptions.map((option) => ({
                          value: option.id,
                          label: formatSystemOptionLabel(option),
                          keywords: [option.name, option.category],
                        }))}
                        placeholder="システムを検索"
                        value={editRelationForm.targetSystemId}
                      />
                    </label>

                    <label className={styles.formField}>
                      <span className={styles.formLabel}>プロトコル</span>
                      <input
                        className={styles.input}
                        data-testid={`system-detail-relation-protocol-${relation.id}`}
                        list="system-detail-protocol-options"
                        onChange={(event) => updateEditRelationField('protocol', event.target.value)}
                        placeholder="例: SSH / HTTPS / SFTP"
                        value={editRelationForm.protocol}
                      />
                    </label>
                  </div>

                  <label className={styles.formField}>
                    <span className={styles.formLabel}>メモ</span>
                    <textarea
                      className={`${styles.input} ${styles.relationTextarea}`}
                      data-testid={`system-detail-relation-note-${relation.id}`}
                      onChange={(event) => updateEditRelationField('note', event.target.value)}
                      placeholder="接続用途や補足を記載"
                      value={editRelationForm.note}
                    />
                  </label>

                  {editRelationError ? <p className={styles.errorText}>{editRelationError}</p> : null}

                  <div className={styles.relationActions}>
                    <Button
                      data-testid={`system-detail-save-relation-${relation.id}`}
                      disabled={isSavingRelation}
                      size="small"
                      type="submit"
                    >
                      {isSavingRelation ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      disabled={isSavingRelation}
                      onClick={handleCancelEdit}
                      size="small"
                      type="button"
                      variant="secondary"
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              ) : (
                <>
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
                      data-testid={`system-detail-edit-relation-${relation.id}`}
                      disabled={isSavingRelation}
                      onClick={() => handleStartEdit(relation)}
                      size="small"
                      variant="secondary"
                    >
                      編集
                    </Button>
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
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyText}>関連システムはありません。</p>
      )}
    </Panel>
  )
}
