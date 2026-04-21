import { useEffect, useMemo, useRef, useState } from 'react'
import type { Connection } from '@xyflow/react'
import { Link, useParams } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { PageStatePanel } from '../../components/PageStatePanel'
import {
  SystemStructureFlow,
  type SystemStructureFlowHandle,
} from '../../components/SystemStructureFlow'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import type {
  CreateSystemTransactionInput,
  ProjectLink,
  UpdateSystemRelationInput,
  UpdateSystemTransactionInput,
} from '../../types/project'
import { validateHierarchyConnection } from '../../utils/hierarchyConnectionUtils'
import styles from './SystemDetailPage.module.css'
import { SystemDepartmentSection } from './SystemDepartmentSection'
import { SystemLinksSection } from './SystemLinksSection'
import { SystemOverviewSection } from './SystemOverviewSection'
import { SystemRelationsSection } from './SystemRelationsSection'
import { SystemStructureEditor, type SystemStructureDraft } from './SystemStructureEditor'
import { SystemTransactionsSection } from './SystemTransactionsSection'
import {
  buildEditSystemForm,
  buildInitialSystemForm,
  toNullableValue,
  validateSystemInput,
} from './systemFormUtils'
import {
  buildStructureDrafts,
  createsStructureCycle,
  buildUpdateSystemInput,
  buildStructureAssignmentsForFlow,
  sanitizeStructureDrafts,
} from './systemDetailUtils'
import {
  buildRelatedSystems,
  buildRelationOptions,
  buildRelationTargetOptions,
  buildRelationTransactionGroups,
  buildSystemById,
  buildTransactionEntries,
} from './systemGraphUtils'

export function SystemDetailPage() {
  const { systemId } = useParams()
  const {
    systems,
    systemRelations,
    systemTransactions,
    systemTransactionSteps,
    projects,
    members,
    isLoading,
    error,
    getSystemById,
    getSystemAssignments,
    updateSystem,
    updateSystemStructure,
    createSystemRelation,
    createSystemTransaction,
    deleteSystemRelation,
    updateSystemRelation,
    updateSystemTransaction,
    deleteSystemTransaction,
  } = useProjectData()
  const [systemForm, setSystemForm] = useState(buildInitialSystemForm)
  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structureOwnerMemberId, setStructureOwnerMemberId] = useState('')
  const [structureDrafts, setStructureDrafts] = useState<SystemStructureDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [structureMessage, setStructureMessage] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)
  const [isExportingStructurePdf, setIsExportingStructurePdf] = useState(false)
  const [structureExportError, setStructureExportError] = useState<string | null>(null)
  const structureFlowRef = useRef<SystemStructureFlowHandle | null>(null)

  const system = systemId ? getSystemById(systemId) : undefined
  const structureAssignments = useMemo(
    () => (system ? getSystemAssignments(system.id) : []),
    [getSystemAssignments, system],
  )

  useEffect(() => {
    setSystemForm(system ? buildEditSystemForm(system) : buildInitialSystemForm())
  }, [system])

  useEffect(() => {
    setStructureOwnerMemberId(system?.ownerMemberId ?? '')
    setStructureDrafts(buildStructureDrafts(structureAssignments))
    setIsStructureEditing(false)
    setStructureError(null)
    setStructureMessage(null)
  }, [structureAssignments, system?.id, system?.ownerMemberId])

  const owner = useMemo(
    () => members.find((member) => member.id === system?.ownerMemberId),
    [members, system?.ownerMemberId],
  )
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
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

  const systemById = useMemo(() => buildSystemById(systems), [systems])

  const relatedSystems = useMemo(() => {
    if (!system) {
      return []
    }

    return buildRelatedSystems(system.id, systemRelations, systemById)
  }, [system, systemById, systemRelations])

  const relationTargetOptions = useMemo(() => {
    if (!system) {
      return []
    }

    return buildRelationTargetOptions(system.id, systems)
  }, [system, systems])

  const transactionGroups = useMemo(() => {
    if (!system) {
      return []
    }

    return buildRelationTransactionGroups(
      relatedSystems,
      systemTransactions,
      systemTransactionSteps,
      systemById,
    )
  }, [relatedSystems, system, systemById, systemTransactionSteps, systemTransactions])

  const transactionEntries = useMemo(() => {
    if (!system) {
      return []
    }

    return buildTransactionEntries(
      system.id,
      systemTransactions,
      systemTransactionSteps,
      systemById,
    )
  }, [system, systemById, systemTransactionSteps, systemTransactions])

  const relationOptions = useMemo(
    () => buildRelationOptions(systemRelations, systemById),
    [systemById, systemRelations],
  )

  const structureRootId =
    system?.ownerMemberId ??
    structureAssignments.find((assignment) => !assignment.reportsToMemberId)?.memberId ??
    ''

  const visibleStructureAssignments = useMemo(
    () =>
      buildStructureAssignmentsForFlow(
        isStructureEditing ? structureDrafts : structureAssignments,
        isStructureEditing ? structureOwnerMemberId : structureRootId,
        system?.id ?? '',
      ),
    [isStructureEditing, structureAssignments, structureDrafts, structureOwnerMemberId, structureRootId, system?.id],
  )

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
      throw new Error(validationMessage)
    }

    const nextOwnerMemberId = toNullableValue(systemForm.ownerMemberId)
    const input = buildUpdateSystemInput(system, {
      name: systemForm.name.trim(),
      category: systemForm.category.trim(),
      ownerMemberId: nextOwnerMemberId,
      departmentNames: systemForm.departmentNames,
      note: toNullableValue(systemForm.note),
    })

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
  }

  async function handleSaveDepartments() {
    if (!system) {
      return
    }

    await updateSystem(
      system.id,
      buildUpdateSystemInput(system, {
        departmentNames: systemForm.departmentNames,
      }),
    )
  }

  async function handleSaveLinks(links: ProjectLink[]) {
    if (!system) {
      return
    }

    await updateSystem(
      system.id,
      buildUpdateSystemInput(system, {
        systemLinks: links,
      }),
    )
  }

  function updateStructureDraft(index: number, patch: Partial<SystemStructureDraft>) {
    setStructureError(null)
    setStructureMessage(null)
    setStructureDrafts((current) =>
      current.map((assignment, currentIndex) =>
        currentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    )
  }

  function addStructureDraft() {
    setStructureError(null)
    setStructureMessage(null)
    setStructureDrafts((current) =>
      current.concat({ memberId: '', responsibility: '', reportsToMemberId: '' }),
    )
  }

  function removeStructureDraft(index: number) {
    setStructureError(null)
    setStructureMessage(null)
    setStructureDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function handleStructureConnect(connection: Connection) {
    setStructureError(null)
    setStructureMessage(null)

    if (!system) {
      setStructureError('システム情報を取得できませんでした。')
      return
    }

    if (connection.target === structureOwnerMemberId) {
      setStructureError('オーナーの報告先は変更できません。')
      return
    }

    const availableIds = new Set([
      structureOwnerMemberId,
      ...structureDrafts.map((assignment) => assignment.memberId),
    ])
    const validation = validateHierarchyConnection({
      memberId: connection.target,
      managerId: connection.source,
      availableIds,
      entityExists: (id) => memberById.has(id),
      getEntityLabel: (id) => memberById.get(id)?.name ?? id,
      getCurrentManagerId: (memberId) =>
        structureDrafts.find((assignment) => assignment.memberId === memberId)?.reportsToMemberId,
      createsCycle: (memberId, managerId) =>
        createsStructureCycle(structureDrafts, memberId, managerId, structureOwnerMemberId),
      messages: {
        missingConnection: '接続元と接続先を正しく指定してください。',
        selfReference: '自分自身を報告先には設定できません。',
        unavailableConnection: 'システム体制に含まれるメンバー同士だけ接続できます。',
        entityNotFound: '接続対象のメンバーが見つかりません。',
        cycleDetected: '循環する報告ラインになるため、この接続はできません。',
        duplicateConnection: (memberLabel, managerLabel) =>
          `${memberLabel} はすでに ${managerLabel} 配下です。`,
      },
    })

    if (validation.kind === 'error') {
      setStructureError(validation.message)
      return
    }

    if (validation.kind === 'noop') {
      setStructureMessage(validation.message)
      return
    }

    setStructureDrafts((current) =>
      current.map((assignment) =>
        assignment.memberId === validation.memberId
          ? { ...assignment, reportsToMemberId: validation.managerId }
          : assignment,
      ),
    )

    const member = memberById.get(validation.memberId)
    const manager = memberById.get(validation.managerId)
    setStructureMessage(
      `${member?.name ?? validation.memberId} の報告先を ${
        manager?.name ?? validation.managerId
      } に変更しました。`,
    )
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
    setStructureMessage(null)
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
      setStructureMessage('システム体制を更新しました。')
    } catch (caughtError) {
      setStructureError(caughtError instanceof Error ? caughtError.message : 'システム体制の保存に失敗しました。')
    } finally {
      setIsSavingStructure(false)
    }
  }

  async function handleExportStructurePdf() {
    if (!structureFlowRef.current || isExportingStructurePdf) {
      return
    }

    setStructureExportError(null)
    setIsExportingStructurePdf(true)

    try {
      await structureFlowRef.current.exportPdf()
    } catch (caughtError) {
      setStructureExportError(
        caughtError instanceof Error ? caughtError.message : 'PDF の出力に失敗しました。',
      )
    } finally {
      setIsExportingStructurePdf(false)
    }
  }

  async function handleCreateRelation(input: {
    sourceSystemId: string
    targetSystemId: string
    protocol?: string | null
    note?: string | null
  }) {
    if (!system) {
      return
    }

    await createSystemRelation(input)
  }

  async function handleDeleteRelation(relationId: string) {
    await deleteSystemRelation(relationId)
  }

  async function handleUpdateRelation(relationId: string, input: UpdateSystemRelationInput) {
    await updateSystemRelation(relationId, input)
  }

  async function handleCreateTransaction(input: CreateSystemTransactionInput) {
    await createSystemTransaction(input)
  }

  async function handleUpdateTransaction(transactionId: string, input: UpdateSystemTransactionInput) {
    await updateSystemTransaction(transactionId, input)
  }

  async function handleDeleteTransaction(transactionId: string) {
    await deleteSystemTransaction(transactionId)
  }

  if (isLoading) {
    return (
      <PageStatePanel description="システム情報を取得しています。" title="システム詳細を読み込み中です" />
    )
  }

  if (error) {
    return (
      <PageStatePanel
        action={
          <Button size="small" to="/systems" variant="secondary">
            システム一覧へ戻る
          </Button>
        }
        description={error}
        title="システム詳細を表示できませんでした"
      />
    )
  }

  if (!system) {
    return (
      <PageStatePanel
        action={
          <Button size="small" to="/systems" variant="secondary">
            システム一覧へ戻る
          </Button>
        }
        description="指定したシステムは存在しないか、削除されています。"
        title="システムが見つかりません"
      />
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

      <SystemDepartmentSection
        departmentOptions={departmentOptions}
        onSave={handleSaveDepartments}
        system={system}
        systemForm={systemForm}
        toggleSystemDepartmentName={toggleSystemDepartmentName}
        updateSystemForm={setSystemForm}
      />

      <SystemOverviewSection
        members={members}
        onSave={handleSaveSystem}
        structureAssignmentsCount={structureAssignments.length}
        system={system}
        systemForm={systemForm}
        updateSystemField={updateSystemField}
        updateSystemForm={setSystemForm}
      />

      <SystemLinksSection onSave={handleSaveLinks} system={system} />

      <SystemTransactionsSection
        currentSystemId={system.id}
        groups={transactionGroups}
        onCreate={handleCreateTransaction}
        onDelete={handleDeleteTransaction}
        onUpdate={handleUpdateTransaction}
        relationOptions={relationOptions}
        transactions={transactionEntries}
      />

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
                setStructureMessage(null)
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
            <div className={styles.structureFlowAssist}>
              <div className={styles.structureFlowAssistHeader}>
                <p className={styles.structureFlowAssistText}>
                  {isStructureEditing
                    ? 'ノード下部から別ノード上部へドラッグすると、体制メンバーの報告先を変更できます。保存するまでは下書き状態です。'
                    : 'システムのオーナー配下の報告ラインをフローで表示しています。編集モードではドラッグ接続で報告先も変更できます。'}
                </p>
                <Button
                  data-testid="system-structure-export-pdf"
                  disabled={isSavingStructure || isExportingStructurePdf}
                  onClick={() => void handleExportStructurePdf()}
                  size="small"
                  variant="secondary"
                >
                  {isExportingStructurePdf ? 'PDF 出力中...' : 'PDF 出力'}
                </Button>
              </div>
              {isSavingStructure ? (
                <p className={styles.structureFlowPending}>システム体制を保存中です...</p>
              ) : null}
              {isExportingStructurePdf ? (
                <p className={styles.structureFlowPending}>
                  表示中の体制図を PDF に変換しています...
                </p>
              ) : null}
              {structureMessage ? (
                <p className={styles.structureFlowSuccess}>{structureMessage}</p>
              ) : null}
              {structureError ? (
                <p className={styles.structureFlowError}>{structureError}</p>
              ) : null}
              {structureExportError ? (
                <p className={styles.structureFlowError}>{structureExportError}</p>
              ) : null}
            </div>
            <SystemStructureFlow
              assignments={visibleStructureAssignments}
              isEditable={isStructureEditing && !isSavingStructure}
              members={members}
              onConnect={handleStructureConnect}
              ref={structureFlowRef}
              rootMemberId={isStructureEditing ? structureOwnerMemberId || structureRootId : structureRootId}
            />
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

        <SystemRelationsSection
          onCreateRelation={handleCreateRelation}
          onDeleteRelation={handleDeleteRelation}
          onUpdateRelation={handleUpdateRelation}
          relatedSystems={relatedSystems}
          relationTargetOptions={relationTargetOptions}
          system={system}
        />
      </div>
    </div>
  )
}
