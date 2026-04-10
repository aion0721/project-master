import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useProjectData } from '../../store/useProjectData'
import type { CreateProjectInput, ProjectLink, WorkStatus } from '../../types/project'
import {
  defaultStandardProjectPhaseNames,
  getPhaseToneKey,
  standardProjectPhasePresets,
  type StandardProjectPhaseName,
} from '../../utils/projectPhasePresets'
import { createEmptyProjectLink, validateProjectLinks } from '../../utils/projectLinkUtils'
import { formatMemberShortLabel } from '../members/memberFormUtils'
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
    initialPhaseNames: [...defaultStandardProjectPhaseNames],
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

  function updateRelatedSystem(systemId: string) {
    setFormData((current) => ({
      ...current,
      relatedSystemIds: systemId ? [systemId] : [],
    }))
  }

  function toggleInitialPhase(phaseName: StandardProjectPhaseName) {
    setFormData((current) => {
      const currentPhaseNames = current.initialPhaseNames ?? []
      const nextPhaseNames = currentPhaseNames.includes(phaseName)
        ? currentPhaseNames.filter((name) => name !== phaseName)
        : [...currentPhaseNames, phaseName]

      return {
        ...current,
        initialPhaseNames: nextPhaseNames,
      }
    })
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
      setSubmitError('開始日は終了日より前にしてください。')
      return
    }

    if (!(formData.initialPhaseNames?.length ?? 0)) {
      setSubmitError('少なくとも 1 つのフェーズを選択してください。')
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
        relatedSystemIds: formData.relatedSystemIds?.[0] ? [formData.relatedSystemIds[0]] : [],
        projectLinks: validatedLinks.links,
        initialPhaseNames: formData.initialPhaseNames ?? [],
      })
      navigate(`/projects/${createdProject.projectNumber}`)
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '案件追加に失敗しました。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>案件追加画面を読み込み中です</h1>
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
      <ListPageHero
        action={
          <Button size="small" to="/projects" variant="secondary">
            案件一覧へ戻る
          </Button>
        }
        className={styles.hero}
        description="プロジェクト番号、案件名、PM を設定して案件を追加します。主システムと案件リンクも必要に応じて登録できます。"
        eyebrow="Project Setup"
        iconKind="project"
        stats={[
          { label: '必須項目', value: '5項目' },
          { label: '初期フェーズ', value: `${defaultStandardProjectPhaseNames.length}件` },
          { label: '関連情報', value: '主システム・案件リンク' },
        ]}
        title="案件追加"
      />

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
              placeholder="例: 新会計刷新"
              value={formData.name}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>PM</span>
            <SearchSelect
              ariaLabel="PM"
              className={styles.input}
              onChange={(pmMemberId) => updateField('pmMemberId', pmMemberId)}
              options={members.map((member) => ({
                value: member.id,
                label: formatMemberShortLabel(member),
                keywords: [member.name, member.departmentName, member.role],
              }))}
              placeholder="メンバーを検索"
              value={formData.pmMemberId}
            />
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
              <p className={styles.noteTitle}>主システム</p>
              <p className={styles.noteText}>案件の主システムを 1 件選択できます。</p>
            </div>
            {systems.length > 0 ? (
              <label className={styles.field}>
                <span className={styles.label}>主システム</span>
                <SearchSelect
                  ariaLabel="主システム"
                  className={styles.input}
                  dataTestId="create-project-system-select"
                  onChange={updateRelatedSystem}
                  options={systems.map((system) => ({
                    value: system.id,
                    label: `${system.id} / ${system.name}`,
                    keywords: [system.name, system.category],
                  }))}
                  placeholder="システムを検索"
                  value={formData.relatedSystemIds?.[0] ?? ''}
                />
              </label>
            ) : (
              <p className={styles.noteText}>選択可能なシステムがありません。</p>
            )}
          </div>

          <div className={styles.phasePresetSection}>
            <div>
              <p className={styles.noteTitle}>初期フェーズ</p>
              <p className={styles.noteText}>開始時に用意するフェーズを選択してください。</p>
            </div>
            <div className={styles.phasePresetList}>
              {standardProjectPhasePresets.map((phase) => {
                const checked = (formData.initialPhaseNames ?? []).includes(phase.name)

                return (
                  <label className={styles.phasePresetItem} key={phase.name}>
                    <input
                      checked={checked}
                      data-testid={`create-project-phase-${phase.name}`}
                      onChange={() => toggleInitialPhase(phase.name)}
                      type="checkbox"
                    />
                    <span
                      className={`${styles.phasePresetName} ${styles[getPhaseToneKey(phase.name)]}`}
                    >
                      {phase.name}
                    </span>
                  </label>
                )
              })}
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
            <p className={styles.noteTitle}>メモ</p>
            <p className={styles.noteText}>
              追加時には初期フェーズ、PM、主システムをまとめて登録します。詳細画面から後で調整できます。
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
