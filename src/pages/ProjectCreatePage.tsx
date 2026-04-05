import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import type { CreateProjectInput, ProjectLink, WorkStatus } from '../types/project'
import { createEmptyProjectLink, validateProjectLinks } from '../utils/projectLinkUtils'
import styles from './ProjectCreatePage.module.css'

const statusOptions: WorkStatus[] = ['未着手', '進行中', '完了', '遅延']

function buildInitialFormData(): CreateProjectInput {
  return {
    projectNumber: '',
    name: '',
    startDate: '',
    endDate: '',
    status: '未着手',
    pmMemberId: '',
    relatedSystemIds: [],
    projectLinks: [createEmptyProjectLink()],
  }
}

export function ProjectCreatePage() {
  const navigate = useNavigate()
  const { members, systems, isLoading, error, createProject } = useProjectData()
  const [formData, setFormData] = useState<CreateProjectInput>(buildInitialFormData)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pmMembers = members.filter((member) => /PM|マネージャー|PMO/.test(member.role))

  function updateField<Key extends keyof CreateProjectInput>(
    key: Key,
    value: CreateProjectInput[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateProjectLink(index: number, patch: Partial<ProjectLink>) {
    setFormData((current) => ({
      ...current,
      projectLinks: current.projectLinks.map((link, currentIndex) =>
        currentIndex === index ? { ...link, ...patch } : link,
      ),
    }))
  }

  function addProjectLink() {
    setFormData((current) => ({
      ...current,
      projectLinks: [...current.projectLinks, createEmptyProjectLink()],
    }))
  }

  function removeProjectLink(index: number) {
    setFormData((current) => {
      const nextLinks = current.projectLinks.filter((_, currentIndex) => currentIndex !== index)

      return {
        ...current,
        projectLinks: nextLinks.length > 0 ? nextLinks : [createEmptyProjectLink()],
      }
    })
  }

  function toggleRelatedSystem(systemId: string) {
    setFormData((current) => ({
      ...current,
      relatedSystemIds: (current.relatedSystemIds ?? []).includes(systemId)
        ? (current.relatedSystemIds ?? []).filter((id) => id !== systemId)
        : [...(current.relatedSystemIds ?? []), systemId],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (
      !formData.projectNumber ||
      !formData.name ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.pmMemberId
    ) {
      setSubmitError('必須項目を入力してください。')
      return
    }

    if (formData.startDate > formData.endDate) {
      setSubmitError('終了予定日は開始日以降を指定してください。')
      return
    }

    const validatedLinks = validateProjectLinks(formData.projectLinks)

    if (validatedLinks.error) {
      setSubmitError(validatedLinks.error)
      return
    }

    setIsSubmitting(true)

    try {
      const createdProject = await createProject({
        ...formData,
        relatedSystemIds: [...new Set(formData.relatedSystemIds ?? [])],
        projectLinks: validatedLinks.links,
      })
      navigate(`/projects/${createdProject.projectNumber}`)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '案件登録に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>案件追加画面を準備中です</h1>
        <p className={styles.description}>案件と関連データを読み込んでいます。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>案件追加画面を表示できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <Button className={styles.backButton} size="small" to="/projects" variant="secondary">
          案件一覧へ戻る
        </Button>
        <h1 className={styles.title}>案件追加</h1>
        <p className={styles.description}>
          プロジェクト番号、案件名、期間、PM を設定して案件を追加します。
          関連システムと案件リンクも初期登録できます。
        </p>
      </Panel>

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>プロジェクト番号</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('projectNumber', event.target.value)}
              placeholder="例: PRJ-006"
              value={formData.projectNumber}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>案件名</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 新規基幹刷新"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>PM</span>
            <select
              className={styles.input}
              onChange={(event) => updateField('pmMemberId', event.target.value)}
              value={formData.pmMemberId}
            >
              <option value="">選択してください</option>
              {pmMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>開始日</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('startDate', event.target.value)}
              type="date"
              value={formData.startDate}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>終了予定日</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('endDate', event.target.value)}
              type="date"
              value={formData.endDate}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>状態</span>
            <select
              className={styles.input}
              onChange={(event) => updateField('status', event.target.value as WorkStatus)}
              value={formData.status}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.systemSection}>
            <div>
              <p className={styles.noteTitle}>関連システム</p>
              <p className={styles.noteText}>この案件が影響するシステムを選択してください。</p>
            </div>
            <div className={styles.systemList}>
              {systems.length > 0 ? (
                systems.map((system) => (
                  <label className={styles.systemItem} key={system.id}>
                    <input
                      checked={(formData.relatedSystemIds ?? []).includes(system.id)}
                      data-testid={`create-project-system-${system.id}`}
                      onChange={() => toggleRelatedSystem(system.id)}
                      type="checkbox"
                    />
                    <span className={styles.systemText}>
                      <strong>{system.name}</strong>
                      <span>{system.category}</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className={styles.noteText}>登録済みシステムがありません。</p>
              )}
            </div>
          </div>

          <div className={styles.linkSection}>
            <div className={styles.linkSectionHeader}>
              <div>
                <p className={styles.noteTitle}>案件リンク</p>
                <p className={styles.noteText}>リンク名と URL をセットで登録できます。</p>
              </div>
              <Button onClick={addProjectLink} size="small" type="button" variant="secondary">
                リンク追加
              </Button>
            </div>

            <div className={styles.linkList}>
              {formData.projectLinks.map((link, index) => (
                <div key={`project-link-${index}`} className={styles.linkRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>案件リンク名 {index + 1}</span>
                    <input
                      aria-label={`案件リンク名 ${index + 1}`}
                      className={styles.input}
                      onChange={(event) => updateProjectLink(index, { label: event.target.value })}
                      placeholder="例: Backlog"
                      value={link.label}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>案件リンクURL {index + 1}</span>
                    <input
                      aria-label={`案件リンクURL ${index + 1}`}
                      className={styles.input}
                      onChange={(event) => updateProjectLink(index, { url: event.target.value })}
                      placeholder="https://example.com/projects/PRJ-006"
                      type="url"
                      value={link.url}
                    />
                  </label>

                  <Button
                    onClick={() => removeProjectLink(index)}
                    size="small"
                    type="button"
                    variant="danger"
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>初期設定ルール</p>
            <p className={styles.noteText}>
              登録時に標準フェーズ、PM アサイン、初期体制を自動で作成します。
              詳細画面からあとで編集できます。
            </p>
          </div>

          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={styles.actionRow}>
            <Button to="/projects" variant="secondary">
              キャンセル
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '登録中...' : '案件を登録'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
