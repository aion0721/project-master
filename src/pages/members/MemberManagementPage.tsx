import { useMemo, useState } from 'react'
import { ListPageContentSection } from '../../components/ListPageContentSection'
import { ListPageFilterSection } from '../../components/ListPageFilterSection'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import formStyles from '../../styles/form.module.css'
import pageStyles from '../../styles/page.module.css'
import type { UpdateMemberInput } from '../../types/project'
import {
  buildEditForm,
  formatMemberOptionLabel,
  formatMemberShortLabel,
  toNullableManagerId,
  validateMemberInput,
  type MemberFormState,
} from './memberFormUtils'
import styles from './MemberManagementPage.module.css'

export function MemberManagementPage() {
  const { members, projects, assignments, isLoading, error, updateMember, deleteMember } =
    useProjectData()
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MemberFormState | null>(null)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])

  const projectCountByMemberId = useMemo(() => {
    const projectIdsByMember = new Map<string, Set<string>>()

    projects.forEach((project) => {
      const bucket = projectIdsByMember.get(project.pmMemberId) ?? new Set<string>()
      bucket.add(project.projectNumber)
      projectIdsByMember.set(project.pmMemberId, bucket)
    })

    assignments.forEach((assignment) => {
      const bucket = projectIdsByMember.get(assignment.memberId) ?? new Set<string>()
      bucket.add(assignment.projectId)
      projectIdsByMember.set(assignment.memberId, bucket)
    })

    return new Map(
      [...projectIdsByMember.entries()].map(([memberId, projectIds]) => [memberId, projectIds.size]),
    )
  }, [assignments, projects])

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [members],
  )

  const roleOptions = useMemo(
    () =>
      [...new Set(members.map((member) => member.role.trim()).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, 'ja'),
      ),
    [members],
  )

  const filteredMembers = useMemo(() => {
    const normalizedKeyword = filterKeyword.trim().toLowerCase()

    return sortedMembers.filter((member) => {
      const searchableText = `${member.id} ${member.departmentName}`.toLowerCase()
      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword)
      const matchesRole = !filterRole || member.role === filterRole

      return matchesKeyword && matchesRole
    })
  }, [filterKeyword, filterRole, sortedMembers])

  const memberSummary = useMemo(
    () => ({
      total: members.length,
      assigned: members.filter((member) => (projectCountByMemberId.get(member.id) ?? 0) > 0).length,
      roles: roleOptions.length,
    }),
    [members, projectCountByMemberId, roleOptions.length],
  )

  function updateEditField<Key extends keyof MemberFormState>(key: Key, value: MemberFormState[Key]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleUpdateSubmit(memberId: string) {
    if (!editForm) {
      return
    }

    setSubmitError(null)

    const validationMessage = validateMemberInput(editForm)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: UpdateMemberInput = {
        name: editForm.name.trim(),
        departmentCode: editForm.departmentCode.trim(),
        departmentName: editForm.departmentName.trim(),
        role: editForm.role.trim(),
        managerId: toNullableManagerId(editForm.managerId),
      }
      await updateMember(memberId, input)
      setEditingMemberId(null)
      setEditForm(null)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : 'メンバーの更新に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(memberId: string) {
    const member = memberById.get(memberId)

    if (!window.confirm(`メンバー ${member?.id ?? memberId} / ${member?.name ?? ''} を削除しますか？`)) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await deleteMember(memberId)

      if (editingMemberId === memberId) {
        setEditingMemberId(null)
        setEditForm(null)
      }
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : 'メンバーの削除に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー一覧を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>
          バックエンドからメンバー情報を取得しています。
        </p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー一覧を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  const keywordSummary = filterKeyword.trim() ? ` / "${filterKeyword.trim()}"` : ''
  const roleSummary = filterRole ? ` / ${filterRole}` : ''
  const filterSummaryText = `${filteredMembers.length} 件表示${roleSummary}${keywordSummary}`

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/members/new">新規メンバー</Button>}
        className={styles.hero}
        collapsible
        description="利用中のメンバーを一覧で管理します。検索、ロール確認、上下関係の整理、担当案件数の確認をこの画面から行えます。"
        eyebrow="Member Directory"
        iconKind="member"
        storageKey="project-master:hero-collapsed:members"
        stats={[
          { label: '登録メンバー', value: memberSummary.total },
          { label: '担当案件あり', value: memberSummary.assigned },
          { label: 'ロール種別', value: memberSummary.roles },
        ]}
        title="メンバー一覧"
      />

      {isFilterVisible ? (
        <ListPageFilterSection
          className={styles.controls}
          topRow={
            <div className={styles.headerActions}>
              <label className={`${formStyles.field} ${styles.filterField}`}>
                <span className={formStyles.label}>絞り込み</span>
                <input
                  aria-label="メンバーIDまたは部署名で絞り込み"
                  className={formStyles.control}
                  onChange={(event) => setFilterKeyword(event.target.value)}
                  placeholder="例: m1 / 営業本部"
                  type="search"
                  value={filterKeyword}
                />
              </label>
              <label className={`${formStyles.field} ${styles.filterField}`}>
                <span className={formStyles.label}>ロール</span>
                <select
                  aria-label="ロールで絞り込み"
                  className={formStyles.control}
                  onChange={(event) => setFilterRole(event.target.value)}
                  value={filterRole}
                >
                  <option value="">すべて</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          }
          summary={
            <div className={styles.filterSummary}>
              <span className={styles.filterSummaryLabel}>表示条件</span>
              <span className={styles.filterSummaryValue}>{filterSummaryText}</span>
            </div>
          }
        />
      ) : null}

      <ListPageContentSection
        actions={
          <Button
            aria-expanded={isFilterVisible}
            onClick={() => setIsFilterVisible((current) => !current)}
            size="small"
            variant="secondary"
          >
            {isFilterVisible ? '絞り込みを非表示' : '絞り込みを表示'}
          </Button>
        }
        description="部署コード、ロール、上長、関連案件数を比較しながら確認できます。利用中のメンバーはこの一覧から直接編集できます。"
        emptyState={
          filteredMembers.length === 0
            ? {
                title: '条件に一致するメンバーはありません',
                description:
                  '絞り込み条件やロールを見直して、表示されるメンバーを確認してください。',
              }
            : null
        }
        title="管理対象メンバー"
      >
        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>メンバーID</th>
                <th>氏名</th>
                <th>部署コード</th>
                <th>部署名</th>
                <th>ロール</th>
                <th>上長</th>
                <th>関連案件数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const isEditing = editingMemberId === member.id && editForm
                const managerOptions = sortedMembers.filter((option) => option.id !== member.id)
                const manager = member.managerId ? memberById.get(member.managerId) : null

                return (
                  <tr data-testid={`member-row-${member.id}`} key={member.id}>
                    <td className={styles.idCell}>{member.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label="氏名"
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('name', event.target.value)}
                          value={editForm.name}
                        />
                      ) : (
                        member.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label="部署コード"
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('departmentCode', event.target.value)}
                          value={editForm.departmentCode}
                        />
                      ) : (
                        member.departmentCode
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label="部署名"
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('departmentName', event.target.value)}
                          value={editForm.departmentName}
                        />
                      ) : (
                        member.departmentName
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label="ロール"
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('role', event.target.value)}
                          value={editForm.role}
                        />
                      ) : (
                        member.role
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          aria-label="上司"
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('managerId', event.target.value)}
                          value={editForm.managerId}
                        >
                          <option value="">未設定</option>
                          {managerOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {formatMemberOptionLabel(option)}
                            </option>
                          ))}
                        </select>
                      ) : manager ? (
                        formatMemberShortLabel(manager)
                      ) : (
                        '未設定'
                      )}
                    </td>
                    <td>{projectCountByMemberId.get(member.id) ?? 0}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {isEditing ? (
                          <>
                            <Button
                              disabled={isSubmitting}
                              onClick={() => void handleUpdateSubmit(member.id)}
                              size="small"
                            >
                              保存
                            </Button>
                            <Button
                              disabled={isSubmitting}
                              onClick={() => {
                                setEditingMemberId(null)
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
                              size="small"
                              to={`/members/hierarchy?memberId=${member.id}`}
                              variant="secondary"
                            >
                              体制図
                            </Button>
                            <Button
                              data-testid={`edit-member-${member.id}`}
                              disabled={isSubmitting}
                              onClick={() => {
                                setEditingMemberId(member.id)
                                setEditForm(buildEditForm(member))
                                setSubmitError(null)
                              }}
                              size="small"
                              variant="secondary"
                            >
                              編集
                            </Button>
                            <Button
                              data-testid={`delete-member-${member.id}`}
                              disabled={isSubmitting}
                              onClick={() => void handleDelete(member.id)}
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
      </ListPageContentSection>
    </div>
  )
}
