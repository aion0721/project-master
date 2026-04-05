import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import type { UpdateMemberInput } from '../../types/project'
import pageStyles from '../../styles/page.module.css'
import { buildEditForm, toNullableManagerId, validateMemberInput } from './memberFormUtils'
import type { MemberFormState } from './memberFormUtils'
import styles from './MemberManagementPage.module.css'

export function MemberManagementPage() {
  const { members, projects, assignments, isLoading, error, updateMember, deleteMember } =
    useProjectData()
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MemberFormState | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  )

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
      Array.from(projectIdsByMember.entries()).map(([memberId, projectIds]) => [
        memberId,
        projectIds.size,
      ]),
    )
  }, [assignments, projects])

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [members],
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
        role: editForm.role.trim(),
        managerId: toNullableManagerId(editForm.managerId),
      }
      await updateMember(memberId, input)
      setEditingMemberId(null)
      setEditForm(null)
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'メンバー更新に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(memberId: string) {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await deleteMember(memberId)

      if (editingMemberId === memberId) {
        setEditingMemberId(null)
        setEditForm(null)
      }
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'メンバー削除に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー情報を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>バックエンドからメンバー情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー情報を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <Panel variant="hero">
        <p className={pageStyles.eyebrow}>Member Directory</p>
        <h1 className={pageStyles.title}>メンバー管理</h1>
        <p className={pageStyles.description}>
          案件で利用するメンバーの編集、削除を行います。上司設定は体制ツリーにも反映されます。
        </p>
      </Panel>

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>登録済みメンバー</h2>
            <p className={pageStyles.sectionDescription}>
              行ごとに編集できます。案件で利用中のメンバーは削除時に制約チェックを行います。
            </p>
          </div>
          <Button to="/members/new" variant="secondary">
            メンバーを追加
          </Button>
        </div>

        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>メンバーID</th>
                <th>名前</th>
                <th>ロール</th>
                <th>上司</th>
                <th>関与案件数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => {
                const isEditing = editingMemberId === member.id && editForm
                const managerOptions = sortedMembers.filter((option) => option.id !== member.id)

                return (
                  <tr data-testid={`member-row-${member.id}`} key={member.id}>
                    <td className={styles.idCell}>{member.id}</td>
                    <td>
                      {isEditing ? (
                        <input
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
                          className={styles.inlineInput}
                          onChange={(event) => updateEditField('managerId', event.target.value)}
                          value={editForm.managerId}
                        >
                          <option value="">未設定</option>
                          {managerOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      ) : member.managerId ? (
                        memberNameById.get(member.managerId) ?? '未設定'
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
      </Panel>
    </div>
  )
}
