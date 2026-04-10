import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useProjectData } from '../../store/useProjectData'
import type { CreateSystemInput } from '../../types/project'
import { buildInitialSystemForm, toNullableValue, validateSystemInput } from './systemFormUtils'
import styles from './SystemCreatePage.module.css'

export function SystemCreatePage() {
  const navigate = useNavigate()
  const { members, isLoading, error, createSystem } = useProjectData()
  const [formData, setFormData] = useState(buildInitialSystemForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const departmentOptions = useMemo(
    () =>
      [...new Set(members.map((member) => member.departmentName))].sort((left, right) =>
        left.localeCompare(right, 'ja'),
      ),
    [members],
  )

  function updateField<Key extends keyof typeof formData>(key: Key, value: (typeof formData)[Key]) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function toggleDepartmentName(departmentName: string) {
    setFormData((current) => ({
      ...current,
      departmentNames: current.departmentNames.includes(departmentName)
        ? current.departmentNames.filter((value) => value !== departmentName)
        : [...current.departmentNames, departmentName],
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
        departmentNames: formData.departmentNames,
        note: toNullableValue(formData.note),
      }
      await createSystem(input)
      navigate('/systems')
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : 'システム追加に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>システム追加画面を読み込み中です</h1>
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
      <ListPageHero
        action={
          <Button size="small" to="/systems" variant="secondary">
            システム一覧へ戻る
          </Button>
        }
        className={styles.hero}
        description="システムID、名称、カテゴリ、オーナー、所管部署、メモを登録します。作成後は案件との紐づけにも使えます。"
        eyebrow="System Setup"
        iconKind="system"
        stats={[
          { label: '必須項目', value: '3項目' },
          { label: '所管部署', value: '複数選択可' },
          { label: '案件連携', value: '作成後に利用' },
        ]}
        title="システム追加"
      />

      <Panel className={styles.section}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>システムID</span>
            <input
              aria-label="システムID"
              className={styles.input}
              onChange={(event) => updateField('id', event.target.value)}
              placeholder="例: sys-customer"
              value={formData.id}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>名称</span>
            <input
              aria-label="名称"
              className={styles.input}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例: 顧客管理基盤"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>カテゴリ</span>
            <input
              aria-label="カテゴリ"
              className={styles.input}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="例: 基幹"
              value={formData.category}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>オーナー</span>
            <SearchSelect
              ariaLabel="オーナー"
              className={styles.input}
              onChange={(ownerMemberId) => updateField('ownerMemberId', ownerMemberId)}
              options={members.map((member) => ({
                value: member.id,
                label: `${member.id} / ${member.name}`,
                keywords: [member.name, member.departmentName, member.role],
              }))}
              placeholder="オーナーを検索"
              value={formData.ownerMemberId}
            />
          </label>

          <div className={`${styles.field} ${styles.departmentField}`}>
            <span className={styles.label}>所管部署</span>
            <div className={styles.checkboxGroup}>
              {departmentOptions.map((departmentName) => (
                <label className={styles.checkboxItem} key={departmentName}>
                  <input
                    checked={formData.departmentNames.includes(departmentName)}
                    onChange={() => toggleDepartmentName(departmentName)}
                    type="checkbox"
                  />
                  <span>{departmentName}</span>
                </label>
              ))}
            </div>
          </div>

          <label className={`${styles.field} ${styles.noteField}`}>
            <span className={styles.label}>メモ</span>
            <textarea
              aria-label="メモ"
              className={styles.textarea}
              onChange={(event) => updateField('note', event.target.value)}
              placeholder="運用範囲や補足情報を入力"
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
