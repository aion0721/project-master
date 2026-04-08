import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityIcon } from '../../components/EntityIcon'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import type { CreateSystemInput } from '../../types/project'
import {
  buildInitialSystemForm,
  toNullableValue,
  validateSystemInput,
} from './systemFormUtils'
import styles from './SystemCreatePage.module.css'

export function SystemCreatePage() {
  const navigate = useNavigate()
  const { members, isLoading, error, createSystem } = useProjectData()
  const [formData, setFormData] = useState(buildInitialSystemForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<Key extends keyof typeof formData>(key: Key, value: (typeof formData)[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const validationMessage = validateSystemInput(formData)
    if (validationMessage) {
      setSubmitError(validationMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const input: CreateSystemInput = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        ownerMemberId: toNullableValue(formData.ownerMemberId),
        note: toNullableValue(formData.note),
      }
      await createSystem(input)
      navigate('/systems')
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'システム追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>システム追加画面を準備中です</h1>
        <p className={styles.description}>システム情報を読み込んでいます。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>システム追加画面を表示できませんでした</h1>
        <p className={styles.description}>{error}</p>
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
            <h1 className={styles.title}>システム追加</h1>
            <p className={styles.description}>
              システムID、名称、カテゴリ、オーナー、メモを登録します。登録後は案件との紐付けにも利用できます。
            </p>
          </div>
        </div>
      </Panel>

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>システムID</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('id', event.target.value)}
              placeholder="例: sys-customer"
              value={formData.id}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>名称</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 顧客管理基盤"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>カテゴリ</span>
            <input
              className={styles.input}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="例: 基盤"
              value={formData.category}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>オーナー</span>
            <select
              className={styles.input}
              onChange={(event) => updateField('ownerMemberId', event.target.value)}
              value={formData.ownerMemberId}
            >
              <option value="">未設定</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id} / {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className={`${styles.field} ${styles.noteField}`}>
            <span className={styles.label}>メモ</span>
            <textarea
              className={styles.textarea}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="用途や影響範囲を記載"
              value={formData.note}
            />
          </label>

          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={styles.actionRow}>
            <Button to="/systems" variant="secondary">
              キャンセル
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? '登録中...' : 'システムを登録'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
