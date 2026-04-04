import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import type { CreateProjectInput, WorkStatus } from '../types/project'
import styles from './ProjectCreatePage.module.css'

const statusOptions: WorkStatus[] = ['未着手', '進行中', '完了', '遅延']

export function ProjectCreatePage() {
  const navigate = useNavigate()
  const { members, isLoading, error, createProject } = useProjectData()
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    startDate: '',
    endDate: '',
    status: '未着手',
    pmMemberId: '',
  })
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!formData.name || !formData.startDate || !formData.endDate || !formData.pmMemberId) {
      setSubmitError('必須項目を入力してください。')
      return
    }

    if (formData.startDate > formData.endDate) {
      setSubmitError('終了予定日は開始日以降を指定してください。')
      return
    }

    setIsSubmitting(true)

    try {
      const createdProject = await createProject(formData)
      navigate(`/projects/${createdProject.id}`)
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : '案件追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>案件追加画面を準備中です</h1>
        <p className={styles.description}>担当候補メンバーを取得しています。</p>
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
          案件の基本情報を登録します。登録後は詳細画面でフェーズと体制を確認できます。
        </p>
      </Panel>

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>案件名</span>
            <input
              className={styles.input}
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 物流会計システム刷新"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>PM</span>
            <select
              className={styles.input}
              value={formData.pmMemberId}
              onChange={(event) => updateField('pmMemberId', event.target.value)}
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
              type="date"
              value={formData.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>終了予定日</span>
            <input
              className={styles.input}
              type="date"
              value={formData.endDate}
              onChange={(event) => updateField('endDate', event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>状態</span>
            <select
              className={styles.input}
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value as WorkStatus)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>登録時の初期ルール</p>
            <p className={styles.noteText}>
              登録時は標準 5 フェーズを未着手で自動生成し、PM を初期担当として紐付けます。
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
