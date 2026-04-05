import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import type {
  CreateSystemInput,
  CreateSystemRelationInput,
  ManagedSystem,
  UpdateSystemInput,
} from '../types/project'
import formStyles from '../styles/form.module.css'
import pageStyles from '../styles/page.module.css'
import styles from './SystemManagementPage.module.css'

interface SystemFormState {
  id: string
  name: string
  category: string
  ownerMemberId: string
  note: string
}

interface SystemRelationFormState {
  sourceSystemId: string
  targetSystemId: string
  note: string
}

const initialCreateForm: SystemFormState = {
  id: '',
  name: '',
  category: '',
  ownerMemberId: '',
  note: '',
}

const initialRelationForm: SystemRelationFormState = {
  sourceSystemId: '',
  targetSystemId: '',
  note: '',
}

function buildEditForm(system: ManagedSystem): SystemFormState {
  return {
    id: system.id,
    name: system.name,
    category: system.category,
    ownerMemberId: system.ownerMemberId ?? '',
    note: system.note ?? '',
  }
}

function toNullableValue(value: string) {
  return value.trim() ? value.trim() : null
}

export function SystemManagementPage() {
  const {
    systems,
    systemRelations,
    members,
    projects,
    isLoading,
    error,
    createSystem,
    createSystemRelation,
    updateSystem,
    deleteSystem,
    deleteSystemRelation,
  } = useProjectData()
  const [createForm, setCreateForm] = useState<SystemFormState>(initialCreateForm)
  const [relationForm, setRelationForm] = useState<SystemRelationFormState>(initialRelationForm)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<SystemFormState | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  )
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

  const projectNamesBySystemId = useMemo(() => {
    const map = new Map<string, string[]>()

    projects.forEach((project) => {
      for (const systemId of project.relatedSystemIds ?? []) {
        const current = map.get(systemId) ?? []
        current.push(project.name)
        map.set(systemId, current)
      }
    })

    return map
  }, [projects])

  function updateCreateField<Key extends keyof SystemFormState>(key: Key, value: SystemFormState[Key]) {
    setCreateForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateRelationField<Key extends keyof SystemRelationFormState>(
    key: Key,
    value: SystemRelationFormState[Key],
  ) {
    setRelationForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateEditField<Key extends keyof SystemFormState>(key: Key, value: SystemFormState[Key]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  function validateSystemInput(input: Pick<SystemFormState, 'id' | 'name' | 'category'>) {
    if (!input.id.trim() || !input.name.trim() || !input.category.trim()) {
      return 'システムID、名称、カテゴリを入力してください。'
    }

    return null
  }

  function validateRelationInput(input: SystemRelationFormState) {
    if (!input.sourceSystemId || !input.targetSystemId) {
      return '接続元システムと接続先システムを選択してください。'
    }

    if (input.sourceSystemId === input.targetSystemId) {
      return '同じシステム同士は関連付けできません。'
    }

    return null
  }

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const validationMessage = validateSystemInput(createForm)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateSystemInput = {
        id: createForm.id.trim(),
        name: createForm.name.trim(),
        category: createForm.category.trim(),
        ownerMemberId: toNullableValue(createForm.ownerMemberId),
        note: toNullableValue(createForm.note),
      }
      await createSystem(input)
      setCreateForm(initialCreateForm)
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'システム追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateRelationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const validationMessage = validateRelationInput(relationForm)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateSystemRelationInput = {
        sourceSystemId: relationForm.sourceSystemId,
        targetSystemId: relationForm.targetSystemId,
        note: toNullableValue(relationForm.note),
      }
      await createSystemRelation(input)
      setRelationForm(initialRelationForm)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '関連システム登録に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateSubmit(systemId: string) {
    if (!editForm) {
      return
    }

    setSubmitError(null)

    const validationMessage = validateSystemInput(editForm)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: UpdateSystemInput = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        ownerMemberId: toNullableValue(editForm.ownerMemberId),
        note: toNullableValue(editForm.note),
      }
      await updateSystem(systemId, input)
      setEditingSystemId(null)
      setEditForm(null)
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'システム更新に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(systemId: string) {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await deleteSystem(systemId)

      if (editingSystemId === systemId) {
        setEditingSystemId(null)
        setEditForm(null)
      }
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'システム削除に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteRelation(relationId: string) {
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
        <h1 className={pageStyles.emptyStateTitle}>システム一覧を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム一覧を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <Panel variant="hero">
        <p className={pageStyles.eyebrow}>System Directory</p>
        <h1 className={pageStyles.title}>システム管理</h1>
        <p className={pageStyles.description}>
          案件が関係するシステムを一覧で管理します。システム間のつながりも登録して、
          関連図で仕向け・被仕向けの向きを確認できます。
        </p>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>システム追加</h2>
            <p className={pageStyles.sectionDescription}>
              システムID、名称、カテゴリ、オーナー、メモを登録します。
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleCreateSubmit}>
          <div className={styles.formGrid}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>システムID</span>
              <input
                className={formStyles.control}
                onChange={(event) => updateCreateField('id', event.target.value)}
                placeholder="例: sys-customer"
                value={createForm.id}
              />
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>名称</span>
              <input
                className={formStyles.control}
                onChange={(event) => updateCreateField('name', event.target.value)}
                placeholder="例: 顧客管理基盤"
                value={createForm.name}
              />
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>カテゴリ</span>
              <input
                className={formStyles.control}
                onChange={(event) => updateCreateField('category', event.target.value)}
                placeholder="例: 基盤"
                value={createForm.category}
              />
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>オーナー</span>
              <select
                className={formStyles.control}
                onChange={(event) => updateCreateField('ownerMemberId', event.target.value)}
                value={createForm.ownerMemberId}
              >
                <option value="">未設定</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={formStyles.field}>
            <span className={formStyles.label}>メモ</span>
            <textarea
              className={styles.textarea}
              onChange={(event) => updateCreateField('note', event.target.value)}
              placeholder="用途や影響範囲を記載"
              value={createForm.note}
            />
          </label>

          {submitError ? <p className={formStyles.errorText}>{submitError}</p> : null}

          <div className={styles.actionRow}>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '追加中...' : 'システムを追加'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>関連システム登録</h2>
            <p className={pageStyles.sectionDescription}>
              接続元から接続先へ向かう流れを登録します。関連図では矢印で表示します。
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleCreateRelationSubmit}>
          <div className={styles.formGrid}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>接続元システム</span>
              <select
                className={formStyles.control}
                onChange={(event) => updateRelationField('sourceSystemId', event.target.value)}
                value={relationForm.sourceSystemId}
              >
                <option value="">選択してください</option>
                {sortedSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>接続先システム</span>
              <select
                className={formStyles.control}
                onChange={(event) => updateRelationField('targetSystemId', event.target.value)}
                value={relationForm.targetSystemId}
              >
                <option value="">選択してください</option>
                {sortedSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={formStyles.field}>
            <span className={formStyles.label}>メモ</span>
            <textarea
              className={styles.textarea}
              onChange={(event) => updateRelationField('note', event.target.value)}
              placeholder="連携内容や向きの補足を記載"
              value={relationForm.note}
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
            <h2 className={pageStyles.sectionTitle}>登録済みシステム</h2>
            <p className={pageStyles.sectionDescription}>
              オーナーと関連案件を確認できます。案件に紐づいているシステムや関連図で利用中のシステムは削除できません。
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>システムID</th>
                <th>名称</th>
                <th>カテゴリ</th>
                <th>オーナー</th>
                <th>関連案件</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedSystems.map((system) => {
                const isEditing = editingSystemId === system.id && editForm
                const relatedProjectNames = projectNamesBySystemId.get(system.id) ?? []

                return (
                  <tr data-testid={`system-row-${system.id}`} key={system.id}>
                    <td className={styles.idCell}>{system.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('name', event.target.value)}
                          value={editForm.name}
                        />
                      ) : (
                        system.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('category', event.target.value)}
                          value={editForm.category}
                        />
                      ) : (
                        system.category
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('ownerMemberId', event.target.value)}
                          value={editForm.ownerMemberId}
                        >
                          <option value="">未設定</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      ) : system.ownerMemberId ? (
                        memberNameById.get(system.ownerMemberId) ?? '未設定'
                      ) : (
                        '未設定'
                      )}
                    </td>
                    <td>
                      <div className={styles.projectSummary}>
                        <span className={styles.projectCount}>{relatedProjectNames.length} 件</span>
                        <div className={styles.projectList}>
                          {relatedProjectNames.length > 0 ? (
                            relatedProjectNames.map((projectName) => (
                              <span className={styles.projectChip} key={`${system.id}-${projectName}`}>
                                {projectName}
                              </span>
                            ))
                          ) : (
                            <span className={styles.noteCell}>未関連</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <textarea
                          className={styles.textarea}
                          onChange={(event) => updateEditField('note', event.target.value)}
                          value={editForm.note}
                        />
                      ) : (
                        <div className={styles.noteCell}>{system.note ?? 'なし'}</div>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {isEditing ? (
                          <>
                            <Button
                              disabled={isSubmitting}
                              onClick={() => void handleUpdateSubmit(system.id)}
                              size="small"
                            >
                              保存
                            </Button>
                            <Button
                              disabled={isSubmitting}
                              onClick={() => {
                                setEditingSystemId(null)
                                setEditForm(null)
                                setSubmitError(null)
                              }}
                              size="small"
                              variant="secondary"
                            >
                              キャンセル
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              data-testid={`edit-system-${system.id}`}
                              disabled={isSubmitting}
                              onClick={() => {
                                setEditingSystemId(system.id)
                                setEditForm(buildEditForm(system))
                                setSubmitError(null)
                              }}
                              size="small"
                              variant="secondary"
                            >
                              編集
                            </Button>
                            <Button
                              data-testid={`delete-system-${system.id}`}
                              disabled={isSubmitting}
                              onClick={() => void handleDelete(system.id)}
                              size="small"
                              variant="danger"
                            >
                              削除
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>登録済みの関連システム</h2>
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
