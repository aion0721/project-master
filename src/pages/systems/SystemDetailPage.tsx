import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { MemberTree } from '../../components/MemberTree'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import type {
  CreateSystemRelationInput,
  ProjectLink,
  SystemAssignment,
  UpdateSystemInput,
} from '../../types/project'
import styles from './SystemDetailPage.module.css'
import { SystemStructureEditor, type SystemStructureDraft } from './SystemStructureEditor'
import {
  buildEditSystemForm,
  buildInitialSystemRelationForm,
  formatSystemOptionLabel,
  toNullableValue,
  validateSystemInput,
  validateRelationInput,
} from './systemFormUtils'

function buildLinkDrafts(links: ProjectLink[] | undefined) {
  return (links ?? []).map((link) => ({
    label: link.label,
    url: link.url,
  }))
}

function buildStructureDrafts(assignments: SystemAssignment[]) {
  return assignments
    .filter((assignment) => assignment.responsibility !== 'オーナー')
    .map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId,
      responsibility: assignment.responsibility,
      reportsToMemberId: assignment.reportsToMemberId ?? '',
    }))
}

function sanitizeStructureDrafts(assignments: SystemStructureDraft[]) {
  return assignments
    .map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId.trim(),
      responsibility: assignment.responsibility.trim(),
      reportsToMemberId: assignment.reportsToMemberId.trim(),
    }))
    .filter(
      (assignment) =>
        assignment.memberId || assignment.responsibility || assignment.reportsToMemberId,
    )
}

export function SystemDetailPage() {
  const { systemId } = useParams()
  const {
    systems,
    systemRelations,
    projects,
    members,
    isLoading,
    error,
    getSystemById,
    getSystemAssignments,
    updateSystem,
    updateSystemStructure,
    createSystemRelation,
    deleteSystemRelation,
  } = useProjectData()
  const [isLinksEditing, setIsLinksEditing] = useState(false)
  const [isSystemEditing, setIsSystemEditing] = useState(false)
  const [isDepartmentEditing, setIsDepartmentEditing] = useState(false)
  const [systemForm, setSystemForm] = useState({
    id: '',
    name: '',
    category: '',
    ownerMemberId: '',
    departmentNames: [] as string[],
    note: '',
  })
  const [systemError, setSystemError] = useState<string | null>(null)
  const [isSavingSystem, setIsSavingSystem] = useState(false)
  const [departmentError, setDepartmentError] = useState<string | null>(null)
  const [isSavingDepartment, setIsSavingDepartment] = useState(false)
  const [linkDrafts, setLinkDrafts] = useState<ProjectLink[]>([])
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isSavingLinks, setIsSavingLinks] = useState(false)
  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structureOwnerMemberId, setStructureOwnerMemberId] = useState('')
  const [structureDrafts, setStructureDrafts] = useState<SystemStructureDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)
  const [relationForm, setRelationForm] = useState(buildInitialSystemRelationForm)
  const [relationDirection, setRelationDirection] = useState<'incoming' | 'outgoing'>('outgoing')
  const [relationError, setRelationError] = useState<string | null>(null)
  const [isSavingRelation, setIsSavingRelation] = useState(false)

  const system = systemId ? getSystemById(systemId) : undefined
  const structureAssignments = useMemo(
    () => (system ? getSystemAssignments(system.id) : []),
    [getSystemAssignments, system],
  )

  useEffect(() => {
    setSystemForm(
      system
        ? buildEditSystemForm(system)
        : { id: '', name: '', category: '', ownerMemberId: '', departmentNames: [], note: '' },
    )
    setIsSystemEditing(false)
    setIsDepartmentEditing(false)
    setSystemError(null)
    setDepartmentError(null)
  }, [system])

  useEffect(() => {
    setLinkDrafts(buildLinkDrafts(system?.systemLinks))
    setIsLinksEditing(false)
    setLinkError(null)
  }, [system?.id, system?.systemLinks])

  useEffect(() => {
    setStructureOwnerMemberId(system?.ownerMemberId ?? '')
    setStructureDrafts(buildStructureDrafts(structureAssignments))
    setIsStructureEditing(false)
    setStructureError(null)
  }, [structureAssignments, system?.id, system?.ownerMemberId])

  const owner = useMemo(
    () => members.find((member) => member.id === system?.ownerMemberId),
    [members, system?.ownerMemberId],
  )

  const departmentOptions = useMemo(
    () =>
      [...new Set(members.map((member) => member.departmentName))].sort((left, right) =>
        left.localeCompare(right, 'ja'),
      ),
    [members],
  )

  const relatedProjects = useMemo(() => {
    if (!system) {
      return []
    }

    return projects.filter((project) => project.relatedSystemIds?.[0] === system.id)
  }, [projects, system])

  const relatedSystems = useMemo(() => {
    if (!system) {
      return []
    }

    return systemRelations
      .filter(
        (relation) => relation.sourceSystemId === system.id || relation.targetSystemId === system.id,
      )
      .map((relation) => {
        const targetId =
          relation.sourceSystemId === system.id ? relation.targetSystemId : relation.sourceSystemId

        return {
          relation,
          system: systems.find((item) => item.id === targetId),
        }
      })
  }, [system, systemRelations, systems])

  const relationTargetOptions = useMemo(() => {
    if (!system) {
      return []
    }

    return systems
      .filter((item) => item.id !== system.id)
      .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
  }, [system, systems])

  const structureRootId =
    system?.ownerMemberId ??
    structureAssignments.find((assignment) => !assignment.reportsToMemberId)?.memberId ??
    ''

  const structureChanged = useMemo(() => {
    if (!system) {
      return false
    }

    if ((system.ownerMemberId ?? '') !== structureOwnerMemberId) {
      return true
    }

    const current = buildStructureDrafts(structureAssignments)
    return JSON.stringify(current) !== JSON.stringify(structureDrafts)
  }, [structureAssignments, structureDrafts, structureOwnerMemberId, system])

  function updateSystemField<Key extends keyof typeof systemForm>(key: Key, value: (typeof systemForm)[Key]) {
    setSystemForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function toggleSystemDepartmentName(departmentName: string) {
    setSystemForm((current) => ({
      ...current,
      departmentNames: current.departmentNames.includes(departmentName)
        ? current.departmentNames.filter((value) => value !== departmentName)
        : [...current.departmentNames, departmentName],
    }))
  }

  async function handleSaveSystem() {
    if (!system) {
      return
    }

    const validationMessage = validateSystemInput(systemForm)
    if (validationMessage) {
      setSystemError(validationMessage)
      return
    }

    if (!systemForm.ownerMemberId.trim() && structureAssignments.length > 0) {
      setSystemError('システム体制があるため、オーナーを未設定にはできません。')
      return
    }

    setSystemError(null)
    setIsSavingSystem(true)

    try {
      const nextOwnerMemberId = toNullableValue(systemForm.ownerMemberId)
      const input: UpdateSystemInput = {
        name: systemForm.name.trim(),
        category: systemForm.category.trim(),
        ownerMemberId: nextOwnerMemberId,
        departmentNames: systemForm.departmentNames,
        note: toNullableValue(systemForm.note),
        systemLinks: system.systemLinks ?? [],
      }

      await updateSystem(system.id, input)

      if (nextOwnerMemberId && nextOwnerMemberId !== (system.ownerMemberId ?? null)) {
        await updateSystemStructure(system.id, {
          ownerMemberId: nextOwnerMemberId,
          assignments: buildStructureDrafts(structureAssignments).map((assignment) => ({
            id: assignment.id,
            memberId: assignment.memberId,
            responsibility: assignment.responsibility,
            reportsToMemberId: assignment.reportsToMemberId || null,
          })),
        })
      }

      setIsSystemEditing(false)
    } catch (caughtError) {
      setSystemError(caughtError instanceof Error ? caughtError.message : 'システム基本情報の保存に失敗しました。')
    } finally {
      setIsSavingSystem(false)
    }
  }

  async function handleSaveDepartments() {
    if (!system) {
      return
    }

    setDepartmentError(null)
    setIsSavingDepartment(true)

    try {
      const input: UpdateSystemInput = {
        name: system.name,
        category: system.category,
        ownerMemberId: system.ownerMemberId ?? null,
        departmentNames: systemForm.departmentNames,
        note: system.note ?? null,
        systemLinks: system.systemLinks ?? [],
      }

      await updateSystem(system.id, input)
      setIsDepartmentEditing(false)
    } catch (caughtError) {
      setDepartmentError(caughtError instanceof Error ? caughtError.message : '所管部署の保存に失敗しました。')
    } finally {
      setIsSavingDepartment(false)
    }
  }

  function updateLinkDraft(index: number, patch: Partial<ProjectLink>) {
    setLinkDrafts((current) =>
      current.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link)),
    )
  }

  function addLinkDraft() {
    setLinkDrafts((current) => current.concat({ label: '', url: '' }))
  }

  function removeLinkDraft(index: number) {
    setLinkDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function handleSaveLinks() {
    if (!system) {
      return
    }

    const sanitizedLinks = linkDrafts
      .map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }))
      .filter((link) => link.label || link.url)

    if (sanitizedLinks.some((link) => !link.label || !link.url)) {
      setLinkError('関連リンクは名称とURLを両方入力してください。')
      return
    }

    setLinkError(null)
    setIsSavingLinks(true)

    try {
      const input: UpdateSystemInput = {
        name: system.name,
        category: system.category,
        ownerMemberId: system.ownerMemberId ?? null,
        departmentNames: system.departmentNames ?? [],
        note: system.note ?? null,
        systemLinks: sanitizedLinks,
      }
      await updateSystem(system.id, input)
      setIsLinksEditing(false)
    } catch (caughtError) {
      setLinkError(caughtError instanceof Error ? caughtError.message : '関連リンクの保存に失敗しました。')
    } finally {
      setIsSavingLinks(false)
    }
  }

  function updateStructureDraft(index: number, patch: Partial<SystemStructureDraft>) {
    setStructureDrafts((current) =>
      current.map((assignment, currentIndex) =>
        currentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    )
  }

  function addStructureDraft() {
    setStructureDrafts((current) =>
      current.concat({ memberId: '', responsibility: '', reportsToMemberId: '' }),
    )
  }

  function removeStructureDraft(index: number) {
    setStructureDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function handleSaveStructure() {
    if (!system) {
      return
    }

    const sanitizedAssignments = sanitizeStructureDrafts(structureDrafts)

    if (!structureOwnerMemberId.trim()) {
      setStructureError('オーナーを選択してください。')
      return
    }

    if (sanitizedAssignments.some((assignment) => !assignment.memberId || !assignment.responsibility)) {
      setStructureError('体制メンバーは役割とメンバーを両方入力してください。')
      return
    }

    setStructureError(null)
    setIsSavingStructure(true)

    try {
      await updateSystemStructure(system.id, {
        ownerMemberId: structureOwnerMemberId,
        assignments: sanitizedAssignments.map((assignment) => ({
          id: assignment.id,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
          reportsToMemberId: assignment.reportsToMemberId || null,
        })),
      })
      setIsStructureEditing(false)
    } catch (caughtError) {
      setStructureError(caughtError instanceof Error ? caughtError.message : 'システム体制の保存に失敗しました。')
    } finally {
      setIsSavingStructure(false)
    }
  }

  function updateRelationField<Key extends keyof typeof relationForm>(
    key: Key,
    value: (typeof relationForm)[Key],
  ) {
    setRelationForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleCreateRelation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!system) {
      return
    }

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
      const input: CreateSystemRelationInput = {
        sourceSystemId: nextForm.sourceSystemId,
        targetSystemId: nextForm.targetSystemId,
        protocol: toNullableValue(nextForm.protocol),
        note: toNullableValue(nextForm.note),
      }
      await createSystemRelation(input)
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

    if (!window.confirm(`関連システム ${relation?.sourceSystemId ?? relationId} -> ${relation?.targetSystemId ?? relationId} を削除します。`)) {
      return
    }

    setRelationError(null)
    setIsSavingRelation(true)

    try {
      await deleteSystemRelation(relationId)
    } catch (caughtError) {
      setRelationError(caughtError instanceof Error ? caughtError.message : '関連システム削除に失敗しました。')
    } finally {
      setIsSavingRelation(false)
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム詳細を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>システム情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システム詳細を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
        <Button size="small" to="/systems" variant="secondary">
          システム一覧へ戻る
        </Button>
      </Panel>
    )
  }

  if (!system) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>システムが見つかりません</h1>
        <p className={pageStyles.emptyStateText}>
          指定したシステムは存在しないか、削除されています。
        </p>
        <Button size="small" to="/systems" variant="secondary">
          システム一覧へ戻る
        </Button>
      </Panel>
    )
  }

  return (
    <div className={styles.page}>
      <ListPageHero
        className={styles.hero}
        collapsible
        description={`システムID: ${system.id}。カテゴリ: ${system.category}。関連案件、所管部署、周辺システムとの接続をまとめて確認できます。`}
        eyebrow="System Detail"
        iconKind="system"
        leadingContent={
          <div className={styles.backLinks}>
            <Button size="small" to="/systems" variant="secondary">
              システム一覧へ戻る
            </Button>
            <Button size="small" to="/systems/diagram" variant="secondary">
              関連図を開く
            </Button>
          </div>
        }
        stats={[
          { label: 'オーナー', value: owner ? `${owner.id} / ${owner.name}` : '未設定' },
          { label: '対象プロジェクト', value: `${relatedProjects.length} 件` },
          { label: '関連システム', value: `${relatedSystems.length} 件` },
          {
            label: '所管部署',
            value:
              system.departmentNames && system.departmentNames.length > 0
                ? system.departmentNames.join(' / ')
                : '未設定',
          },
        ]}
        storageKey="project-master:hero-collapsed:system-detail"
        title={system.name}
      />

      <Panel className={styles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>所管部署</h2>
            <p className={pageStyles.sectionDescription}>このシステムの所管部署をここから直接変更できます。</p>
          </div>
          {isDepartmentEditing ? (
            <div className={styles.headerActions}>
              <Button
                disabled={isSavingDepartment}
                onClick={() => void handleSaveDepartments()}
                size="small"
              >
                {isSavingDepartment ? '保存中...' : '保存'}
              </Button>
              <Button
                onClick={() => {
                  setSystemForm(buildEditSystemForm(system))
                  setIsDepartmentEditing(false)
                  setDepartmentError(null)
                }}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsDepartmentEditing(true)} size="small" variant="secondary">
              編集
            </Button>
          )}
        </div>
        {isDepartmentEditing ? (
          <div className={styles.systemEditor}>
            <div className={styles.checkboxGroup} data-testid="system-department-editor">
              {departmentOptions.map((departmentName) => (
                <label className={styles.checkboxItem} key={departmentName}>
                  <input
                    checked={systemForm.departmentNames.includes(departmentName)}
                    data-testid={`system-detail-department-${departmentName}`}
                    onChange={() => toggleSystemDepartmentName(departmentName)}
                    type="checkbox"
                  />
                  <span>{departmentName}</span>
                </label>
              ))}
            </div>
            {departmentError ? <p className={styles.errorText}>{departmentError}</p> : null}
          </div>
        ) : (
          <div className={styles.departmentSummary}>
            {system.departmentNames && system.departmentNames.length > 0 ? (
              system.departmentNames.map((departmentName) => (
                <span className={styles.checkboxItem} key={`summary-${departmentName}`}>
                  {departmentName}
                </span>
              ))
            ) : (
              <p className={styles.emptyText}>所管部署は未設定です。</p>
            )}
          </div>
        )}
      </Panel>

      <Panel className={styles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>概要</h2>
            <p className={pageStyles.sectionDescription}>運用背景や補足メモを確認できます。</p>
          </div>
          {isSystemEditing ? (
            <div className={styles.headerActions}>
              <Button disabled={isSavingSystem} onClick={() => void handleSaveSystem()} size="small">
                {isSavingSystem ? '保存中...' : '保存'}
              </Button>
              <Button
                onClick={() => {
                  setSystemForm(buildEditSystemForm(system))
                  setIsSystemEditing(false)
                  setSystemError(null)
                }}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsSystemEditing(true)} size="small" variant="secondary">
              編集
            </Button>
          )}
        </div>
        {isSystemEditing ? (
          <div className={styles.systemEditor}>
            <div className={styles.systemFormGrid}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>システムID</span>
                <input className={styles.input} disabled value={system.id} />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>名称</span>
                <input
                  className={styles.input}
                  data-testid="system-detail-name-input"
                  onChange={(event) => updateSystemField('name', event.target.value)}
                  value={systemForm.name}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>カテゴリ</span>
                <input
                  className={styles.input}
                  data-testid="system-detail-category-input"
                  onChange={(event) => updateSystemField('category', event.target.value)}
                  value={systemForm.category}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>オーナー</span>
                <select
                  className={styles.input}
                  data-testid="system-detail-owner-select"
                  onChange={(event) => updateSystemField('ownerMemberId', event.target.value)}
                  value={systemForm.ownerMemberId}
                >
                  <option value="">未設定</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.id} / {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={styles.formField}>
              <span className={styles.formLabel}>概要</span>
              <textarea
                className={`${styles.input} ${styles.systemTextarea}`}
                data-testid="system-detail-note-input"
                onChange={(event) => updateSystemField('note', event.target.value)}
                placeholder="用途や影響範囲を記載"
                value={systemForm.note}
              />
            </label>
            {systemError ? <p className={styles.errorText}>{systemError}</p> : null}
          </div>
        ) : (
          <p className={styles.noteText}>{system.note?.trim() || 'メモは未設定です。'}</p>
        )}
      </Panel>

      <Panel className={styles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>関連リンク</h2>
            <p className={pageStyles.sectionDescription}>運用Wikiや設計資料への導線です。</p>
          </div>
          {isLinksEditing ? (
            <div className={styles.headerActions}>
              <Button onClick={addLinkDraft} size="small" variant="secondary">
                追加
              </Button>
              <Button disabled={isSavingLinks} onClick={() => void handleSaveLinks()} size="small">
                {isSavingLinks ? '保存中...' : '保存'}
              </Button>
              <Button
                onClick={() => {
                  setLinkDrafts(buildLinkDrafts(system.systemLinks))
                  setIsLinksEditing(false)
                  setLinkError(null)
                }}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsLinksEditing(true)} size="small" variant="secondary">
              編集
            </Button>
          )}
        </div>
        
        {isLinksEditing ? (
          <div className={styles.linkEditorList}>
            {linkDrafts.map((link, index) => (
              <div className={styles.linkEditorRow} key={`system-link-${index}`}>
                <input
                  aria-label={`関連リンク名 ${index + 1}`}
                  className={styles.input}
                  data-testid={`system-link-label-${index}`}
                  onChange={(event) => updateLinkDraft(index, { label: event.target.value })}
                  placeholder="リンク名"
                  value={link.label}
                />
                <input
                  aria-label={`関連リンクURL ${index + 1}`}
                  className={styles.input}
                  data-testid={`system-link-url-${index}`}
                  onChange={(event) => updateLinkDraft(index, { url: event.target.value })}
                  placeholder="https://example.com"
                  type="url"
                  value={link.url}
                />
                <Button
                  data-testid={`system-link-remove-${index}`}
                  onClick={() => removeLinkDraft(index)}
                  size="small"
                  variant="danger"
                >
                  削除
                </Button>
              </div>
            ))}
            {linkDrafts.length === 0 ? <p className={styles.emptyText}>関連リンクは未設定です。</p> : null}
            {linkError ? <p className={styles.errorText}>{linkError}</p> : null}
          </div>
        ) : system.systemLinks && system.systemLinks.length > 0 ? (
          <div className={styles.linkList}>
            {system.systemLinks.map((link, index) => (
              <a
                className={styles.externalLink}
                data-testid={`system-link-anchor-${index}`}
                href={link.url}
                key={`${link.label}-${link.url}`}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>関連リンクは未設定です。</p>
        )}
      </Panel>

      <Panel className={styles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>システム体制</h2>
            <p className={pageStyles.sectionDescription}>
              オーナー配下の役割分担と報告ラインを管理します。
            </p>
          </div>
          {isStructureEditing ? (
            <Button
              data-testid="system-structure-edit-toggle"
              onClick={() => {
                setStructureOwnerMemberId(system.ownerMemberId ?? '')
                setStructureDrafts(buildStructureDrafts(structureAssignments))
                setIsStructureEditing(false)
                setStructureError(null)
              }}
              size="small"
              variant="secondary"
            >
              編集を閉じる
            </Button>
          ) : (
            <Button
              data-testid="system-structure-edit-toggle"
              onClick={() => setIsStructureEditing(true)}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          )}
        </div>

        {isStructureEditing ? (
          <SystemStructureEditor
            assignments={structureDrafts}
            changed={structureChanged}
            error={structureError}
            isSaving={isSavingStructure}
            members={members}
            onAddAssignment={addStructureDraft}
            onClose={() => {
              setStructureOwnerMemberId(system.ownerMemberId ?? '')
              setStructureDrafts(buildStructureDrafts(structureAssignments))
              setIsStructureEditing(false)
              setStructureError(null)
            }}
            onOwnerChange={setStructureOwnerMemberId}
            onRemoveAssignment={removeStructureDraft}
            onSave={() => void handleSaveStructure()}
            onUpdateAssignment={updateStructureDraft}
            ownerMemberId={structureOwnerMemberId}
          />
        ) : null}

        {structureRootId ? (
          <div className={styles.treeSection}>
            <MemberTree assignments={structureAssignments} members={members} rootMemberId={structureRootId} />
          </div>
        ) : (
          <p className={styles.emptyText}>システム体制は未設定です。</p>
        )}
      </Panel>

      <div className={styles.contentGrid}>
        <Panel className={styles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <h2 className={pageStyles.sectionTitle}>対象プロジェクト</h2>
              <p className={pageStyles.sectionDescription}>
                このシステムを主システムとして持つ案件です。
              </p>
            </div>
          </div>
          {relatedProjects.length > 0 ? (
            <div className={styles.projectList}>
              {relatedProjects.map((project) => (
                <Link className={styles.projectLink} key={project.projectNumber} to={`/projects/${project.projectNumber}`}>
                  {project.projectNumber} / {project.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>対象プロジェクトはありません。</p>
          )}
        </Panel>

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
                <select
                  className={styles.input}
                  onChange={(event) => updateRelationField('targetSystemId', event.target.value)}
                  value={relationForm.targetSystemId}
                >
                  <option value="">選択してください</option>
                  {relationTargetOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {formatSystemOptionLabel(option)}
                    </option>
                  ))}
                </select>
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
      </div>
    </div>
  )
}
