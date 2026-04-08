import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MemberTree } from '../../components/MemberTree'
import { EntityIcon } from '../../components/EntityIcon'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import type { ProjectLink, SystemAssignment, UpdateSystemInput } from '../../types/project'
import styles from './SystemDetailPage.module.css'
import { SystemStructureEditor, type SystemStructureDraft } from './SystemStructureEditor'

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
  } = useProjectData()
  const [isLinksEditing, setIsLinksEditing] = useState(false)
  const [linkDrafts, setLinkDrafts] = useState<ProjectLink[]>([])
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isSavingLinks, setIsSavingLinks] = useState(false)
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
      <Panel className={styles.hero} variant="hero">
        <Button className={styles.backButton} size="small" to="/systems" variant="secondary">
          システム一覧へ戻る
        </Button>
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind="system" />
          <div className={pageStyles.heroHeadingBody}>
            <p className={pageStyles.eyebrow}>System Detail</p>
            <h1 className={pageStyles.title}>{system.name}</h1>
            <p className={pageStyles.description}>
              システムID: {system.id}
              <br />
              カテゴリ: {system.category}
            </p>
          </div>
        </div>
      </Panel>

      <div className={styles.metaGrid}>
        <Panel as="article" className={styles.metaCard}>
          <span className={styles.metaLabel}>オーナー</span>
          <strong className={styles.metaValue}>{owner ? `${owner.id} / ${owner.name}` : '未設定'}</strong>
        </Panel>
        <Panel as="article" className={styles.metaCard}>
          <span className={styles.metaLabel}>対象プロジェクト</span>
          <strong className={styles.metaValue}>{relatedProjects.length} 件</strong>
        </Panel>
        <Panel as="article" className={styles.metaCard}>
          <span className={styles.metaLabel}>関連システム</span>
          <strong className={styles.metaValue}>{relatedSystems.length} 件</strong>
        </Panel>
      </div>

      <Panel className={styles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>概要</h2>
            <p className={pageStyles.sectionDescription}>運用背景や補足メモを確認できます。</p>
          </div>
        </div>
        <p className={styles.noteText}>{system.note?.trim() || 'メモは未設定です。'}</p>
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
              <p className={pageStyles.sectionDescription}>連携や依存があるシステムです。</p>
            </div>
          </div>
          {relatedSystems.length > 0 ? (
            <div className={styles.relationList}>
              {relatedSystems.map(({ relation, system: relatedSystem }) => (
                <div className={styles.relationItem} key={relation.id}>
                  <Link className={styles.projectLink} to={`/systems/${relatedSystem?.id ?? ''}`}>
                    {relatedSystem ? `${relatedSystem.id} / ${relatedSystem.name}` : '未設定'}
                  </Link>
                  <p className={styles.relationNote}>{relation.note?.trim() || '補足メモなし'}</p>
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
