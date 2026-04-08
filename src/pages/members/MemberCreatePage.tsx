import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import type { CreateMemberInput } from '../../types/project'
import {
  buildInitialMemberForm,
  formatMemberOptionLabel,
  toNullableManagerId,
  validateMemberInput,
} from './memberFormUtils'
import styles from './MemberCreatePage.module.css'

export function MemberCreatePage() {
  const navigate = useNavigate()
  const { members, isLoading, error, createMember } = useProjectData()
  const memberIdExample = import.meta.env.VITE_MEMBER_ID_EXAMPLE?.trim() || 'm11'
  const memberIdPlaceholder = `例: ${memberIdExample}`
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
        departmentCode: formData.departmentCode.trim(),
        departmentName: formData.departmentName.trim(),
        role: formData.role.trim(),
        managerId: toNullableManagerId(formData.managerId),
      }

      await createMember(input)
      navigate('/members')
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'メンバーの追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>メンバー追加画面を読み込み中です</h1>
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
      <ListPageHero
        action={
          <Button size="small" to="/members" variant="secondary">
            メンバー一覧へ戻る
          </Button>
        }
        className={styles.hero}
        description="ID、部署、ロール、上司を登録してメンバーを追加します。上司候補は `ID / 名前` 形式で表示するので、ID入力で選びやすくしています。"
        eyebrow="Member Setup"
        iconKind="member"
        stats={[
          { label: '必須入力', value: '5項目' },
          { label: '上司設定', value: '任意' },
          { label: 'ID形式', value: memberIdExample },
        ]}
        title="メンバー追加"
      />

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>メンバーID</span>
            <input
              aria-label="メンバーID"
              className={styles.input}
              onChange={(event) => updateField('id', event.target.value)}
              placeholder={memberIdPlaceholder}
              value={formData.id}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>名前</span>
            <input
              aria-label="名前"
              className={styles.input}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 山田 花子"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>部署コード</span>
            <input
              aria-label="部署コード"
              className={styles.input}
              onChange={(event) => updateField('departmentCode', event.target.value)}
              placeholder="例: DEP-QA"
              value={formData.departmentCode}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>部署名</span>
            <input
              aria-label="部署名"
              className={styles.input}
              onChange={(event) => updateField('departmentName', event.target.value)}
              placeholder="例: 品質保証部"
              value={formData.departmentName}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>ロール</span>
            <input
              aria-label="ロール"
              className={styles.input}
              onChange={(event) => updateField('role', event.target.value)}
              placeholder="例: アプリエンジニア"
              value={formData.role}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>上司</span>
            <select
              aria-label="上司"
              className={styles.input}
              onChange={(event) => updateField('managerId', event.target.value)}
              value={formData.managerId}
            >
              <option value="">未設定</option>
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {formatMemberOptionLabel(member)}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>入力ルール</p>
            <p className={styles.noteText}>
              部署コードは将来の部署名変更に備えるために保持します。メンバーIDは一意になる値を入力してください。
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
