import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import type { CreateMemberInput } from '../../types/project'
import {
  buildInitialMemberForm,
  toNullableManagerId,
  validateMemberInput,
} from './memberFormUtils'
import styles from './MemberCreatePage.module.css'

export function MemberCreatePage() {
  const navigate = useNavigate()
  const { members, isLoading, error, createMember } = useProjectData()
  const [formData, setFormData] = useState(buildInitialMemberForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedMembers = [...members].sort((left, right) => left.name.localeCompare(right.name, 'ja'))

  function updateField<Key extends keyof typeof formData>(key: Key, value: (typeof formData)[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!formData.id.trim()) {
      setSubmitError('メンバーIDを入力してください。')
      return
    }

    const validationMessage = validateMemberInput(formData)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateMemberInput = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        role: formData.role.trim(),
        managerId: toNullableManagerId(formData.managerId),
      }

      await createMember(input)
      navigate('/members')
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'メンバー追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>メンバー追加画面を準備中です</h1>
        <p className={styles.description}>メンバー情報を読み込んでいます。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>メンバー追加画面を表示できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </Panel>
    )
  }

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <Button className={styles.backButton} size="small" to="/members" variant="secondary">
          メンバー一覧へ戻る
        </Button>
        <h1 className={styles.title}>メンバー追加</h1>
        <p className={styles.description}>
          ID、名前、ロール、上司を指定してメンバーを登録します。登録後は一覧と体制図に反映されます。
        </p>
      </Panel>

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>メンバーID</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('id', event.target.value)}
              placeholder="例: m11"
              value={formData.id}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>名前</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 佐々木"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>ロール</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('role', event.target.value)}
              placeholder="例: アプリエンジニア"
              value={formData.role}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>上司</span>
            <select
              className={styles.input}
              onChange={(event) => updateField('managerId', event.target.value)}
              value={formData.managerId}
            >
              <option value="">未設定</option>
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>

          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>登録ルール</p>
            <p className={styles.noteText}>
              上司を指定すると体制図の親子関係にも使われます。メンバーIDは一意である必要があります。
            </p>
          </div>

          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={styles.actionRow}>
            <Button to="/members" variant="secondary">
              キャンセル
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '登録中...' : 'メンバーを登録'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
