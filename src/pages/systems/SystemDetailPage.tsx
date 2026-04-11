import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { MemberTree } from '../../components/MemberTree'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import type { ProjectLink } from '../../types/project'
import styles from './SystemDetailPage.module.css'
import { SystemDepartmentSection } from './SystemDepartmentSection'
import { SystemLinksSection } from './SystemLinksSection'
import { SystemOverviewSection } from './SystemOverviewSection'
import { SystemRelationsSection } from './SystemRelationsSection'
import { SystemStructureEditor, type SystemStructureDraft } from './SystemStructureEditor'
import {
  buildEditSystemForm,
  buildInitialSystemForm,
  toNullableValue,
  validateSystemInput,
} from './systemFormUtils'
import {
  buildStructureDrafts,
  buildUpdateSystemInput,
  sanitizeStructureDrafts,
} from './systemDetailUtils'

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
  const [systemForm, setSystemForm] = useState(buildInitialSystemForm)
  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structureOwnerMemberId, setStructureOwnerMemberId] = useState('')
  const [structureDrafts, setStructureDrafts] = useState<SystemStructureDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)

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

        <SystemRelationsSection
          onCreateRelation={handleCreateRelation}
          onDeleteRelation={handleDeleteRelation}
          relatedSystems={relatedSystems}
          relationTargetOptions={relationTargetOptions}
          system={system}
        />
      </div>
    </div>
  )
}
