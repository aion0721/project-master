import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MemberTree } from '../components/MemberTree'
import { PhaseTimeline } from '../components/PhaseTimeline'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import type { Phase, WorkStatus } from '../types/project'
import {
  formatPeriod,
  getPhaseActualRange,
  getProjectCurrentPhase,
  getProjectPm,
} from '../utils/projectUtils'
import styles from './ProjectDetailPage.module.css'

interface PhaseFormState {
  id?: string
  key: string
  name: string
  startWeek: string
  endWeek: string
  status: WorkStatus
  progress: string
}

interface StructureAssignmentDraft {
  id?: string
  memberId: string
  responsibility: string
}

function buildPhaseFormState(phase: Phase): PhaseFormState {
  return {
    id: phase.id,
    key: phase.id,
    name: phase.name,
    startWeek: String(phase.startWeek),
    endWeek: String(phase.endWeek),
    status: phase.status,
    progress: String(phase.progress),
  }
}

function normalizeAssignments(assignments: StructureAssignmentDraft[]) {
  return assignments.map((assignment) => ({
    id: assignment.id,
    memberId: assignment.memberId,
    responsibility: assignment.responsibility.trim(),
  }))
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function buildDraftPhaseForRange(projectNumber: string, pmMemberId: string, draft: PhaseFormState): Phase {
  return {
    id: draft.id ?? draft.key,
    projectId: projectNumber,
    name: draft.name.trim() || '未設定フェーズ',
    startWeek: Number(draft.startWeek) || 1,
    endWeek: Number(draft.endWeek) || 1,
    status: draft.status,
    progress: Number(draft.progress) || 0,
    assigneeMemberId: pmMemberId,
  }
}

export function ProjectDetailPage() {
  const { projectNumber } = useParams()
  const {
    projects,
    assignments,
    members,
    getProjectById,
    getProjectPhases,
    getProjectAssignments,
    isLoading,
    error,
    updateProjectCurrentPhase,
    updateProjectLink,
    updateProjectPhases,
    updateProjectSchedule,
    updateProjectStructure,
  } = useProjectData()
  const { currentUser, toggleBookmark, isBookmarked } = useUserSession()

  const [phaseDrafts, setPhaseDrafts] = useState<PhaseFormState[]>([])
  const [phaseStructureError, setPhaseStructureError] = useState<string | null>(null)
  const [isSavingPhaseStructure, setIsSavingPhaseStructure] = useState(false)

  const [isCurrentPhaseEditing, setIsCurrentPhaseEditing] = useState(false)
  const [currentPhaseDraftId, setCurrentPhaseDraftId] = useState('')
  const [currentPhaseError, setCurrentPhaseError] = useState<string | null>(null)
  const [isSavingCurrentPhase, setIsSavingCurrentPhase] = useState(false)

  const [isScheduleEditing, setIsScheduleEditing] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState({ startDate: '', endDate: '' })
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const [isProjectLinkEditing, setIsProjectLinkEditing] = useState(false)
  const [projectLinkDraft, setProjectLinkDraft] = useState('')
  const [projectLinkError, setProjectLinkError] = useState<string | null>(null)
  const [isSavingProjectLink, setIsSavingProjectLink] = useState(false)

  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structurePmMemberId, setStructurePmMemberId] = useState('')
  const [structureAssignments, setStructureAssignments] = useState<StructureAssignmentDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)

  const project = projectNumber ? getProjectById(projectNumber) : undefined
  const projectPhases = useMemo(
    () => (project ? getProjectPhases(project.projectNumber) : []),
    [getProjectPhases, project],
  )
  const projectAssignments = useMemo(
    () => (project ? getProjectAssignments(project.projectNumber) : []),
    [getProjectAssignments, project],
  )
  const editableAssignments = useMemo(
    () =>
      projectAssignments
        .filter((assignment) => assignment.responsibility !== 'PM')
        .map((assignment) => ({
          id: assignment.id,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
        })),
    [projectAssignments],
  )
  const currentPhase = useMemo(() => getProjectCurrentPhase(projectPhases), [projectPhases])

  const workStatusOptions = useMemo(
    () => Array.from(new Set([...projects.map((item) => item.status), ...projectPhases.map((item) => item.status)])),
    [projectPhases, projects],
  )
  const responsibilityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assignments
            .map((assignment) => assignment.responsibility)
            .filter((responsibility) => responsibility !== 'PM'),
        ),
      ),
    [assignments],
  )

  useEffect(() => {
    setPhaseDrafts(projectPhases.map(buildPhaseFormState))
    setPhaseStructureError(null)
  }, [projectPhases])

  useEffect(() => {
    if (!project) {
      return
    }

    setScheduleDraft({ startDate: project.startDate, endDate: project.endDate })
    setScheduleError(null)
    setProjectLinkDraft(project.projectLink ?? '')
    setProjectLinkError(null)
  }, [project])

  useEffect(() => {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
  }, [currentPhase])

  useEffect(() => {
    if (!project) {
      return
    }

    setStructurePmMemberId(project.pmMemberId)
    setStructureAssignments(editableAssignments)
    setStructureError(null)
  }, [editableAssignments, project])

  if (isLoading) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を読み込み中です</h1>
        <p className={styles.notFoundText}>バックエンドから案件情報を取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を取得できませんでした</h1>
        <p className={styles.notFoundText}>{error}</p>
        <Button size="small" to="/projects" variant="secondary">
          一覧へ戻る
        </Button>
      </Panel>
    )
  }

  if (!project) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件が見つかりません</h1>
        <p className={styles.notFoundText}>指定されたプロジェクト番号に該当する案件がありません。</p>
        <Button size="small" to="/projects" variant="secondary">
          一覧へ戻る
        </Button>
      </Panel>
    )
  }

  const currentProject = project
  const pm = getProjectPm(currentProject, members)
  const scheduleChanged =
    scheduleDraft.startDate !== currentProject.startDate || scheduleDraft.endDate !== currentProject.endDate
  const projectLinkChanged = projectLinkDraft !== (currentProject.projectLink ?? '')
  const currentPhaseChanged = currentPhaseDraftId !== (currentPhase?.id ?? '')
  const structureChanged =
    structurePmMemberId !== currentProject.pmMemberId ||
    JSON.stringify(normalizeAssignments(structureAssignments)) !==
      JSON.stringify(normalizeAssignments(editableAssignments))

  function resetStructureEditor() {
    setStructurePmMemberId(currentProject.pmMemberId)
    setStructureAssignments(editableAssignments)
    setStructureError(null)
  }

  function openStructureEditor() {
    resetStructureEditor()
    setIsStructureEditing(true)
  }

  function closeStructureEditor() {
    resetStructureEditor()
    setIsStructureEditing(false)
  }

  function updatePhaseDraft(key: string, patch: Partial<PhaseFormState>) {
    setPhaseDrafts((current) =>
      current.map((phase) => (phase.key === key ? { ...phase, ...patch } : phase)),
    )
  }

  function addPhaseDraft() {
    const nextIndex = phaseDrafts.length + 1
    const previousEndWeek = phaseDrafts.reduce((max, phase) => Math.max(max, Number(phase.endWeek) || 0), 0)

    setPhaseDrafts((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${nextIndex}`,
        name: `新規フェーズ${nextIndex}`,
        startWeek: String(Math.max(previousEndWeek + 1, 1)),
        endWeek: String(Math.max(previousEndWeek + 1, 1)),
        status: workStatusOptions[0] ?? currentProject.status,
        progress: '0',
      },
    ])
    setPhaseStructureError(null)
  }

  function removePhaseDraft(key: string) {
    setPhaseDrafts((current) => current.filter((phase) => phase.key !== key))
    setPhaseStructureError(null)
  }

  async function handleCurrentPhaseSave() {
    if (!currentPhaseDraftId) {
      setCurrentPhaseError('現在フェーズを選択してください。')
      return
    }

    setIsSavingCurrentPhase(true)
    setCurrentPhaseError(null)

    try {
      await updateProjectCurrentPhase(currentProject.projectNumber, currentPhaseDraftId)
      setIsCurrentPhaseEditing(false)
    } catch (caughtError) {
      setCurrentPhaseError(
        caughtError instanceof Error ? caughtError.message : '現在フェーズの更新に失敗しました。',
      )
    } finally {
      setIsSavingCurrentPhase(false)
    }
  }

  async function handleScheduleSave() {
    if (!scheduleDraft.startDate || !scheduleDraft.endDate) {
      setScheduleError('開始日と終了日を入力してください。')
      return
    }

    if (scheduleDraft.startDate > scheduleDraft.endDate) {
      setScheduleError('終了日は開始日以降で入力してください。')
      return
    }

    setIsSavingSchedule(true)
    setScheduleError(null)

    try {
      await updateProjectSchedule(currentProject.projectNumber, scheduleDraft)
      setIsScheduleEditing(false)
    } catch (caughtError) {
      setScheduleError(caughtError instanceof Error ? caughtError.message : '期間の更新に失敗しました。')
    } finally {
      setIsSavingSchedule(false)
    }
  }

  async function handleProjectLinkSave() {
    if (!isValidOptionalUrl(projectLinkDraft)) {
      setProjectLinkError('案件リンクは有効な URL を入力してください。')
      return
    }

    setIsSavingProjectLink(true)
    setProjectLinkError(null)

    try {
      await updateProjectLink(currentProject.projectNumber, { projectLink: projectLinkDraft.trim() })
      setIsProjectLinkEditing(false)
    } catch (caughtError) {
      setProjectLinkError(
        caughtError instanceof Error ? caughtError.message : '案件リンクの更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectLink(false)
    }
  }

  async function handlePhaseStructureSave() {
    if (phaseDrafts.length === 0) {
      setPhaseStructureError('フェーズは最低 1 件必要です。')
      return
    }

    const normalizedPhases: Array<{
      id?: string
      name: string
      startWeek: number
      endWeek: number
      status: WorkStatus
      progress: number
    }> = []

    for (const phase of phaseDrafts) {
      const name = phase.name.trim()
      const startWeek = Number(phase.startWeek)
      const endWeek = Number(phase.endWeek)
      const progress = Number(phase.progress)

      if (!name) {
        setPhaseStructureError('フェーズ名を入力してください。')
        return
      }

      if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < startWeek) {
        setPhaseStructureError(`「${name}」の開始週・終了週が不正です。`)
        return
      }

      if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
        setPhaseStructureError(`「${name}」の進捗率は 0 から 100 で入力してください。`)
        return
      }

      normalizedPhases.push({
        id: phase.id,
        name,
        startWeek,
        endWeek,
        status: phase.status,
        progress,
      })
    }

    setIsSavingPhaseStructure(true)
    setPhaseStructureError(null)

    try {
      await updateProjectPhases(currentProject.projectNumber, { phases: normalizedPhases })
    } catch (caughtError) {
      setPhaseStructureError(
        caughtError instanceof Error ? caughtError.message : 'フェーズ構成の保存に失敗しました。',
      )
    } finally {
      setIsSavingPhaseStructure(false)
    }
  }

  async function handleStructureSave() {
    setStructureError(null)

    if (!structurePmMemberId) {
      setStructureError('PM を選択してください。')
      return
    }

    const normalizedAssignments = normalizeAssignments(structureAssignments)
    const hasInvalidAssignment = normalizedAssignments.some(
      (assignment) => !assignment.memberId || !assignment.responsibility,
    )

    if (hasInvalidAssignment) {
      setStructureError('各役割に担当者と責務を入力してください。')
      return
    }

    setIsSavingStructure(true)

    try {
      await updateProjectStructure(currentProject.projectNumber, {
        pmMemberId: structurePmMemberId,
        assignments: normalizedAssignments,
      })
      setIsStructureEditing(false)
    } catch (caughtError) {
      setStructureError(
        caughtError instanceof Error ? caughtError.message : 'プロジェクト体制の更新に失敗しました。',
      )
    } finally {
      setIsSavingStructure(false)
    }
  }

  function updateStructureAssignment(index: number, patch: Partial<StructureAssignmentDraft>) {
    setStructureAssignments((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    )
  }

  return (
    <div className={styles.page}>
      <Panel className={styles.hero} variant="hero">
        <div className={styles.heroTop}>
          <div>
            <Link className={styles.backTextLink} to="/projects">
              案件一覧へ戻る
            </Link>
            <h1 className={styles.title}>{currentProject.name}</h1>
            <p className={styles.description}>
              プロジェクト番号: {currentProject.projectNumber}
              <br />
              PM・進捗・体制をまとめて確認できる案件詳細です。
            </p>
          </div>

          <div className={styles.heroActions}>
            {currentUser ? (
              <Button
                onClick={() => {
                  void toggleBookmark(currentProject.projectNumber).catch(() => undefined)
                }}
                size="small"
                variant={isBookmarked(currentProject.projectNumber) ? 'primary' : 'secondary'}
              >
                {isBookmarked(currentProject.projectNumber) ? 'ブックマーク解除' : 'ブックマーク'}
              </Button>
            ) : null}
            <StatusBadge status={currentProject.status} />
          </div>
        </div>

        <div className={styles.metaGrid}>
          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>PM</span>
            <strong className={styles.metaValue}>{pm?.name ?? '未設定'}</strong>
          </article>

          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>期間</span>
            {isScheduleEditing ? (
              <div className={styles.phaseMetaEditor}>
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>開始日</span>
                  <input
                    aria-label="開始日"
                    className={styles.selectInput}
                    data-testid="project-schedule-start"
                    onChange={(event) =>
                      setScheduleDraft((current) => ({ ...current, startDate: event.target.value }))
                    }
                    type="date"
                    value={scheduleDraft.startDate}
                  />
                </label>
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>終了日</span>
                  <input
                    aria-label="終了日"
                    className={styles.selectInput}
                    data-testid="project-schedule-end"
                    onChange={(event) =>
                      setScheduleDraft((current) => ({ ...current, endDate: event.target.value }))
                    }
                    type="date"
                    value={scheduleDraft.endDate}
                  />
                </label>
                <div className={styles.phaseMetaActions}>
                  <Button
                    data-testid="project-schedule-save-button"
                    disabled={isSavingSchedule || !scheduleChanged}
                    onClick={() => {
                      void handleScheduleSave()
                    }}
                    size="small"
                  >
                    {isSavingSchedule ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    data-testid="project-schedule-cancel-button"
                    onClick={() => {
                      setScheduleDraft({ startDate: currentProject.startDate, endDate: currentProject.endDate })
                      setScheduleError(null)
                      setIsScheduleEditing(false)
                    }}
                    size="small"
                    variant="secondary"
                  >
                    キャンセル
                  </Button>
                </div>
                {scheduleError ? <p className={styles.metaError}>{scheduleError}</p> : null}
              </div>
            ) : (
              <div className={styles.phaseMetaDisplay}>
                <strong className={styles.metaValue} data-testid="project-schedule-value">
                  {formatPeriod(currentProject.startDate, currentProject.endDate)}
                </strong>
                <Button
                  data-testid="project-schedule-edit-button"
                  onClick={() => {
                    setScheduleDraft({ startDate: currentProject.startDate, endDate: currentProject.endDate })
                    setScheduleError(null)
                    setIsScheduleEditing(true)
                  }}
                  size="small"
                  variant="secondary"
                >
                  変更
                </Button>
              </div>
            )}
          </article>

          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>現在フェーズ</span>
            {isCurrentPhaseEditing ? (
              <div className={styles.phaseMetaEditor}>
                <select
                  aria-label="現在フェーズを選択"
                  className={styles.selectInput}
                  data-testid="current-phase-select"
                  onChange={(event) => setCurrentPhaseDraftId(event.target.value)}
                  value={currentPhaseDraftId}
                >
                  <option value="">選択してください</option>
                  {projectPhases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
                <div className={styles.phaseMetaActions}>
                  <Button
                    data-testid="current-phase-save-button"
                    disabled={isSavingCurrentPhase || !currentPhaseChanged}
                    onClick={() => {
                      void handleCurrentPhaseSave()
                    }}
                    size="small"
                  >
                    {isSavingCurrentPhase ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    data-testid="current-phase-cancel-button"
                    onClick={() => {
                      setCurrentPhaseDraftId(currentPhase?.id ?? '')
                      setCurrentPhaseError(null)
                      setIsCurrentPhaseEditing(false)
                    }}
                    size="small"
                    variant="secondary"
                  >
                    キャンセル
                  </Button>
                </div>
                {currentPhaseError ? <p className={styles.metaError}>{currentPhaseError}</p> : null}
              </div>
            ) : (
              <div className={styles.phaseMetaDisplay}>
                <strong className={styles.metaValue} data-testid="current-phase-value">
                  {currentPhase?.name ?? '未設定'}
                </strong>
                <Button
                  data-testid="current-phase-edit-button"
                  onClick={() => {
                    setCurrentPhaseDraftId(currentPhase?.id ?? '')
                    setCurrentPhaseError(null)
                    setIsCurrentPhaseEditing(true)
                  }}
                  size="small"
                  variant="secondary"
                >
                  変更
                </Button>
              </div>
            )}
          </article>

          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>案件リンク</span>
            {isProjectLinkEditing ? (
              <div className={styles.phaseMetaEditor}>
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>案件リンク</span>
                  <input
                    aria-label="案件リンク"
                    className={styles.selectInput}
                    data-testid="project-link-input"
                    onChange={(event) => setProjectLinkDraft(event.target.value)}
                    placeholder="https://example.com/projects/PRJ-001"
                    type="url"
                    value={projectLinkDraft}
                  />
                </label>
                <div className={styles.phaseMetaActions}>
                  <Button
                    data-testid="project-link-save-button"
                    disabled={isSavingProjectLink || !projectLinkChanged}
                    onClick={() => {
                      void handleProjectLinkSave()
                    }}
                    size="small"
                  >
                    {isSavingProjectLink ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    data-testid="project-link-cancel-button"
                    onClick={() => {
                      setProjectLinkDraft(currentProject.projectLink ?? '')
                      setProjectLinkError(null)
                      setIsProjectLinkEditing(false)
                    }}
                    size="small"
                    variant="secondary"
                  >
                    キャンセル
                  </Button>
                </div>
                {projectLinkError ? <p className={styles.metaError}>{projectLinkError}</p> : null}
              </div>
            ) : (
              <div className={styles.phaseMetaDisplay}>
                {currentProject.projectLink ? (
                  <a
                    className={styles.externalLink}
                    data-testid="project-link-anchor"
                    href={currentProject.projectLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    案件リンクを開く
                  </a>
                ) : (
                  <strong className={styles.metaValue} data-testid="project-link-empty">
                    未設定
                  </strong>
                )}
                <Button
                  data-testid="project-link-edit-button"
                  onClick={() => {
                    setProjectLinkDraft(currentProject.projectLink ?? '')
                    setProjectLinkError(null)
                    setIsProjectLinkEditing(true)
                  }}
                  size="small"
                  variant="secondary"
                >
                  変更
                </Button>
              </div>
            )}
          </article>
        </div>
      </Panel>

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              案件ごとのフェーズ進捗を週単位のガントチャート形式で表示します。
            </p>
          </div>
        </div>
        <PhaseTimeline project={currentProject} phases={projectPhases} />
      </Panel>

      <div className={styles.detailGrid}>
        <Panel className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>フェーズ構成</h2>
              <p className={styles.sectionDescription}>
                案件ごとにフェーズ名、開始週、終了週、状態、進捗率を編集できます。不要なフェーズは削除し、新しいフェーズは追加してください。
              </p>
            </div>
            <div className={styles.phaseHeaderActions}>
              <Button onClick={addPhaseDraft} size="small" variant="secondary">
                フェーズを追加
              </Button>
              <Button
                data-testid="phase-structure-save-button"
                disabled={isSavingPhaseStructure}
                onClick={() => {
                  void handlePhaseStructureSave()
                }}
                size="small"
              >
                {isSavingPhaseStructure ? '保存中...' : 'フェーズ構成を保存'}
              </Button>
            </div>
          </div>
          {phaseStructureError ? <p className={styles.sectionError}>{phaseStructureError}</p> : null}
          <div className={styles.phaseTableWrap}>
            <table className={styles.phaseTable}>
              <thead>
                <tr>
                  <th>フェーズ名</th>
                  <th>期間</th>
                  <th>状態</th>
                  <th>進捗率</th>
                  <th>開始週</th>
                  <th>終了週</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {phaseDrafts.map((phase) => {
                  const draftPhase = buildDraftPhaseForRange(
                    currentProject.projectNumber,
                    currentProject.pmMemberId,
                    phase,
                  )
                  const hasValidRange =
                    Number.isInteger(draftPhase.startWeek) &&
                    Number.isInteger(draftPhase.endWeek) &&
                    draftPhase.startWeek > 0 &&
                    draftPhase.endWeek >= draftPhase.startWeek
                  const phaseRange = hasValidRange ? getPhaseActualRange(currentProject, draftPhase) : null
                  const range = phaseRange ? formatPeriod(phaseRange.startDate, phaseRange.endDate) : '-'

                  return (
                    <tr data-testid={`phase-row-${phase.key}`} key={phase.key}>
                      <td>
                        <input
                          aria-label={`${phase.name || '新規フェーズ'} のフェーズ名`}
                          className={styles.selectInput}
                          data-testid={`phase-name-${phase.key}`}
                          onChange={(event) => {
                            updatePhaseDraft(phase.key, { name: event.target.value })
                          }}
                          value={phase.name}
                        />
                      </td>
                      <td>{range}</td>
                      <td>
                        <label className={styles.formField}>
                          <span className={styles.visuallyHidden}>{phase.name} の状態</span>
                          <select
                            aria-label={`${phase.name || '新規フェーズ'} の状態`}
                            className={styles.selectInput}
                            data-testid={`phase-status-${phase.key}`}
                            onChange={(event) => {
                              updatePhaseDraft(phase.key, { status: event.target.value as WorkStatus })
                            }}
                            value={phase.status}
                          >
                            {workStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </td>
                      <td>
                        <label className={styles.formField}>
                          <span className={styles.visuallyHidden}>{phase.name} の進捗率</span>
                          <input
                            aria-label={`${phase.name || '新規フェーズ'} の進捗率`}
                            className={styles.progressInput}
                            data-testid={`phase-progress-${phase.key}`}
                            inputMode="numeric"
                            max={100}
                            min={0}
                            onChange={(event) => {
                              updatePhaseDraft(phase.key, { progress: event.target.value })
                            }}
                            type="number"
                            value={phase.progress}
                          />
                        </label>
                      </td>
                      <td>
                        <input
                          aria-label={`${phase.name || '新規フェーズ'} の開始週`}
                          className={styles.weekInput}
                          data-testid={`phase-start-${phase.key}`}
                          inputMode="numeric"
                          min={1}
                          onChange={(event) => {
                            updatePhaseDraft(phase.key, { startWeek: event.target.value })
                          }}
                          type="number"
                          value={phase.startWeek}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${phase.name || '新規フェーズ'} の終了週`}
                          className={styles.weekInput}
                          data-testid={`phase-end-${phase.key}`}
                          inputMode="numeric"
                          min={1}
                          onChange={(event) => {
                            updatePhaseDraft(phase.key, { endWeek: event.target.value })
                          }}
                          type="number"
                          value={phase.endWeek}
                        />
                      </td>
                      <td className={styles.actionCell}>
                        <Button
                          data-testid={`phase-remove-${phase.key}`}
                          onClick={() => removePhaseDraft(phase.key)}
                          size="small"
                          variant="danger"
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>プロジェクト体制</h2>
              <p className={styles.sectionDescription}>
                PM と各役割の担当者を確認できます。必要なときだけ編集フォームを開いて更新します。
              </p>
            </div>
            {isStructureEditing ? (
              <Button
                data-testid="structure-edit-toggle"
                onClick={closeStructureEditor}
                size="small"
                variant="secondary"
              >
                編集を閉じる
              </Button>
            ) : (
              <Button
                data-testid="structure-edit-toggle"
                onClick={openStructureEditor}
                size="small"
                variant="secondary"
              >
                編集
              </Button>
            )}
          </div>

          {isStructureEditing ? (
            <div className={styles.structureEditor} data-testid="structure-editor">
              <label className={styles.formField}>
                <span className={styles.formLabel}>PM</span>
                <select
                  aria-label="PMを選択"
                  className={styles.selectInput}
                  data-testid="structure-pm-select"
                  onChange={(event) => setStructurePmMemberId(event.target.value)}
                  value={structurePmMemberId}
                >
                  <option value="">選択してください</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.assignmentEditor}>
                <div className={styles.assignmentHeader}>
                  <h3 className={styles.assignmentTitle}>役割一覧</h3>
                  <Button
                    onClick={() =>
                      setStructureAssignments((current) => [
                        ...current,
                        {
                          memberId: '',
                          responsibility: responsibilityOptions[0] ?? 'OS',
                        },
                      ])
                    }
                    size="small"
                    variant="secondary"
                  >
                    役割を追加
                  </Button>
                </div>

                <div className={styles.assignmentList}>
                  {structureAssignments.length === 0 ? (
                    <p className={styles.emptyText}>役割担当はまだ登録されていません。</p>
                  ) : null}

                  {structureAssignments.map((assignment, index) => (
                    <div key={assignment.id ?? `new-${index}`} className={styles.assignmentRow}>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>責務</span>
                        <select
                          aria-label={`役割${index + 1} の責務`}
                          className={styles.selectInput}
                          onChange={(event) => {
                            updateStructureAssignment(index, { responsibility: event.target.value })
                          }}
                          value={assignment.responsibility}
                        >
                          {responsibilityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.formField}>
                        <span className={styles.formLabel}>担当者</span>
                        <select
                          aria-label={`役割${index + 1} の担当者`}
                          className={styles.selectInput}
                          onChange={(event) => {
                            updateStructureAssignment(index, { memberId: event.target.value })
                          }}
                          value={assignment.memberId}
                        >
                          <option value="">選択してください</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </option>
                          ))}
                        </select>
                      </label>

                      <Button
                        onClick={() =>
                          setStructureAssignments((current) =>
                            current.filter((_, assignmentIndex) => assignmentIndex !== index),
                          )
                        }
                        size="small"
                        variant="danger"
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {structureError ? <p className={styles.sectionError}>{structureError}</p> : null}

              <div className={styles.structureActions}>
                <Button onClick={closeStructureEditor} size="small" variant="secondary">
                  キャンセル
                </Button>
                <Button
                  data-testid="structure-save-button"
                  disabled={isSavingStructure || !structureChanged}
                  onClick={() => {
                    void handleStructureSave()
                  }}
                  size="small"
                >
                  {isSavingStructure ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className={styles.treeSection}>
            <MemberTree
              members={members}
              pmMemberId={currentProject.pmMemberId}
              projectAssignments={projectAssignments}
            />
          </div>
        </Panel>
      </div>
    </div>
  )
}
