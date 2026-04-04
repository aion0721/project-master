import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MemberTree } from '../components/MemberTree'
import { PhaseTimeline } from '../components/PhaseTimeline'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { useUserSession } from '../store/useUserSession'
import type { WorkStatus } from '../types/project'
import {
  formatPeriod,
  getMemberName,
  getPhaseActualRange,
  getProjectCurrentPhase,
  getProjectPm,
} from '../utils/projectUtils'
import styles from './ProjectDetailPage.module.css'

const responsibilityOptions = ['OS', '基礎検討', '基本設計', '詳細設計', 'テスト', '移行', 'インフラ統括']
const workStatusOptions: WorkStatus[] = ['未着手', '進行中', '完了', '遅延']

interface PhaseFormState {
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

function buildPhaseFormState(
  startWeek: number,
  endWeek: number,
  status: WorkStatus,
  progress: number,
): PhaseFormState {
  return {
    startWeek: String(startWeek),
    endWeek: String(endWeek),
    status,
    progress: String(progress),
  }
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const {
    members,
    getProjectById,
    getProjectPhases,
    getProjectAssignments,
    isLoading,
    error,
    updatePhase,
    updateProjectCurrentPhase,
    updateProjectStructure,
  } = useProjectData()
  const { currentUser, toggleBookmark, isBookmarked } = useUserSession()
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseFormState>>({})
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null)
  const [phaseRowErrors, setPhaseRowErrors] = useState<Record<string, string>>({})
  const [isCurrentPhaseEditing, setIsCurrentPhaseEditing] = useState(false)
  const [currentPhaseDraftId, setCurrentPhaseDraftId] = useState('')
  const [currentPhaseError, setCurrentPhaseError] = useState<string | null>(null)
  const [isSavingCurrentPhase, setIsSavingCurrentPhase] = useState(false)
  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structurePmMemberId, setStructurePmMemberId] = useState('')
  const [structureAssignments, setStructureAssignments] = useState<StructureAssignmentDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)

  const project = projectId ? getProjectById(projectId) : undefined
  const projectPhases = useMemo(
    () => (project ? getProjectPhases(project.id) : []),
    [getProjectPhases, project],
  )
  const projectAssignments = useMemo(
    () => (project ? getProjectAssignments(project.id) : []),
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

  useEffect(() => {
    if (projectPhases.length === 0) {
      return
    }

    setPhaseDrafts((current) => {
      const next = { ...current }

      projectPhases.forEach((phase) => {
        const existing = current[phase.id]

        if (
          !existing ||
          (existing.startWeek === String(phase.startWeek) &&
            existing.endWeek === String(phase.endWeek) &&
            existing.status === phase.status &&
            existing.progress === String(phase.progress))
        ) {
          next[phase.id] = buildPhaseFormState(
            phase.startWeek,
            phase.endWeek,
            phase.status,
            phase.progress,
          )
        }
      })

      return next
    })
  }, [projectPhases])

  useEffect(() => {
    if (!project) {
      return
    }

    setStructurePmMemberId(project.pmMemberId)
    setStructureAssignments(editableAssignments)
    setStructureError(null)
  }, [editableAssignments, project])

  useEffect(() => {
    setCurrentPhaseDraftId(currentPhase?.id ?? '')
    setCurrentPhaseError(null)
  }, [currentPhase])

  if (isLoading) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を読み込み中です</h1>
        <p className={styles.notFoundText}>バックエンドから案件詳細を取得しています。</p>
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
        <p className={styles.notFoundText}>
          指定された案件 ID は存在しません。案件一覧から選び直してください。
        </p>
        <Button size="small" to="/projects" variant="secondary">
          一覧へ戻る
        </Button>
      </Panel>
    )
  }

  const currentProject = project
  const pm = getProjectPm(currentProject, members)
  const structureChanged =
    structurePmMemberId !== currentProject.pmMemberId ||
    JSON.stringify(structureAssignments) !== JSON.stringify(editableAssignments)
  const currentPhaseChanged = currentPhaseDraftId !== (currentPhase?.id ?? '')

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

  async function handleCurrentPhaseSave() {
    if (!currentPhaseDraftId) {
      setCurrentPhaseError('現在フェーズを選択してください。')
      return
    }

    setIsSavingCurrentPhase(true)
    setCurrentPhaseError(null)

    try {
      await updateProjectCurrentPhase(currentProject.id, currentPhaseDraftId)
      setIsCurrentPhaseEditing(false)
    } catch (caughtError) {
      setCurrentPhaseError(
        caughtError instanceof Error ? caughtError.message : '現在フェーズの更新に失敗しました。',
      )
    } finally {
      setIsSavingCurrentPhase(false)
    }
  }

  async function handlePhaseSave(phaseId: string) {
    const draft = phaseDrafts[phaseId]

    if (!draft) {
      return
    }

    const startWeek = Number(draft.startWeek)
    const endWeek = Number(draft.endWeek)
    const progress = Number(draft.progress)

    if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek)) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]: '開始週と終了週は整数で入力してください。',
      }))
      return
    }

    if (startWeek < 1) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]: '開始週は 1 以上で入力してください。',
      }))
      return
    }

    if (endWeek < startWeek) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]: '終了週は開始週以上で入力してください。',
      }))
      return
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]: '進捗率は 0 から 100 の整数で入力してください。',
      }))
      return
    }

    setSavingPhaseId(phaseId)
    setPhaseRowErrors((current) => {
      const next = { ...current }
      delete next[phaseId]
      return next
    })

    try {
      const updatedPhase = await updatePhase(phaseId, {
        startWeek,
        endWeek,
        status: draft.status,
        progress,
      })
      setPhaseDrafts((current) => ({
        ...current,
        [phaseId]: buildPhaseFormState(
          updatedPhase.startWeek,
          updatedPhase.endWeek,
          updatedPhase.status,
          updatedPhase.progress,
        ),
      }))
    } catch (caughtError) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]:
          caughtError instanceof Error ? caughtError.message : 'フェーズ更新に失敗しました。',
      }))
    } finally {
      setSavingPhaseId((current) => (current === phaseId ? null : current))
    }
  }

  async function handleStructureSave() {
    setStructureError(null)

    if (!structurePmMemberId) {
      setStructureError('PM を選択してください。')
      return
    }

    const normalizedAssignments = structureAssignments.map((assignment) => ({
      id: assignment.id,
      memberId: assignment.memberId,
      responsibility: assignment.responsibility.trim(),
    }))

    const hasInvalidAssignment = normalizedAssignments.some(
      (assignment) => !assignment.memberId || !assignment.responsibility,
    )

    if (hasInvalidAssignment) {
      setStructureError('各担当行に責務と担当者を入力してください。')
      return
    }

    setIsSavingStructure(true)

    try {
      await updateProjectStructure(currentProject.id, {
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
              PM、フェーズ進捗、担当体制をまとめて確認できる案件詳細画面です。
            </p>
          </div>
          <div className={styles.heroActions}>
            {currentUser ? (
              <Button
                onClick={() => {
                  void toggleBookmark(currentProject.id).catch(() => undefined)
                }}
                size="small"
                variant={isBookmarked(currentProject.id) ? 'primary' : 'secondary'}
              >
                {isBookmarked(currentProject.id) ? 'ブックマーク済み' : 'ブックマーク'}
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
            <strong className={styles.metaValue}>
              {formatPeriod(currentProject.startDate, currentProject.endDate)}
            </strong>
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
        </div>
      </Panel>

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              週ごとのフェーズ進行状況をガントチャート形式で表示します。
            </p>
          </div>
        </div>

        <PhaseTimeline project={currentProject} phases={projectPhases} members={members} />
      </Panel>

      <div className={styles.detailGrid}>
        <Panel className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>フェーズ別担当</h2>
              <p className={styles.sectionDescription}>
                各フェーズの担当者、状態、進捗率、開始週と終了週を編集できます。
              </p>
            </div>
          </div>

          <div className={styles.phaseTableWrap}>
            <table className={styles.phaseTable}>
              <thead>
                <tr>
                  <th>フェーズ</th>
                  <th>期間</th>
                  <th>担当者</th>
                  <th>状態</th>
                  <th>進捗</th>
                  <th>開始週</th>
                  <th>終了週</th>
                  <th>保存</th>
                </tr>
              </thead>
              <tbody>
                {projectPhases.map((phase) => {
                  const range = getPhaseActualRange(currentProject, phase)
                  const draft =
                    phaseDrafts[phase.id] ??
                    buildPhaseFormState(phase.startWeek, phase.endWeek, phase.status, phase.progress)
                  const isSaving = savingPhaseId === phase.id
                  const hasChanges =
                    draft.startWeek !== String(phase.startWeek) ||
                    draft.endWeek !== String(phase.endWeek) ||
                    draft.status !== phase.status ||
                    draft.progress !== String(phase.progress)

                  return (
                    <tr data-testid={`phase-row-${phase.id}`} key={phase.id}>
                      <td>{phase.name}</td>
                      <td>{formatPeriod(range.startDate, range.endDate)}</td>
                      <td>{getMemberName(phase.assigneeMemberId, members)}</td>
                      <td>
                        <label className={styles.formField}>
                          <span className={styles.visuallyHidden}>{phase.name} の状態</span>
                          <select
                            aria-label={`${phase.name} の状態`}
                            className={styles.selectInput}
                            data-testid={`phase-status-${phase.id}`}
                            onChange={(event) => {
                              const value = event.target.value as WorkStatus
                              setPhaseDrafts((current) => ({
                                ...current,
                                [phase.id]: {
                                  ...draft,
                                  status: value,
                                },
                              }))
                            }}
                            value={draft.status}
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
                            aria-label={`${phase.name} の進捗率`}
                            className={styles.progressInput}
                            data-testid={`phase-progress-${phase.id}`}
                            inputMode="numeric"
                            max={100}
                            min={0}
                            onChange={(event) => {
                              const value = event.target.value
                              setPhaseDrafts((current) => ({
                                ...current,
                                [phase.id]: {
                                  ...draft,
                                  progress: value,
                                },
                              }))
                            }}
                            type="number"
                            value={draft.progress}
                          />
                        </label>
                      </td>
                      <td>
                        <input
                          aria-label={`${phase.name} の開始週`}
                          className={styles.weekInput}
                          data-testid={`phase-start-${phase.id}`}
                          inputMode="numeric"
                          min={1}
                          onChange={(event) => {
                            const value = event.target.value
                            setPhaseDrafts((current) => ({
                              ...current,
                              [phase.id]: {
                                ...draft,
                                startWeek: value,
                              },
                            }))
                          }}
                          type="number"
                          value={draft.startWeek}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${phase.name} の終了週`}
                          className={styles.weekInput}
                          data-testid={`phase-end-${phase.id}`}
                          inputMode="numeric"
                          min={1}
                          onChange={(event) => {
                            const value = event.target.value
                            setPhaseDrafts((current) => ({
                              ...current,
                              [phase.id]: {
                                ...draft,
                                endWeek: value,
                              },
                            }))
                          }}
                          type="number"
                          value={draft.endWeek}
                        />
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <Button
                            data-testid={`phase-save-${phase.id}`}
                            disabled={isSaving || !hasChanges}
                            onClick={() => {
                              void handlePhaseSave(phase.id)
                            }}
                            size="small"
                          >
                            {isSaving ? '保存中...' : '保存'}
                          </Button>
                          {phaseRowErrors[phase.id] ? (
                            <p className={styles.rowError}>{phaseRowErrors[phase.id]}</p>
                          ) : (
                            <StatusBadge status={phase.status} />
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

        <Panel className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>プロジェクト体制</h2>
              <p className={styles.sectionDescription}>
                PM と役割担当を確認できます。編集ボタンから体制を更新できます。
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
                  <h3 className={styles.assignmentTitle}>役割担当</h3>
                  <Button
                    onClick={() =>
                      setStructureAssignments((current) => [
                        ...current,
                        {
                          memberId: '',
                          responsibility: responsibilityOptions[0]!,
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
                            const value = event.target.value
                            setStructureAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, responsibility: value } : item,
                              ),
                            )
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
                            const value = event.target.value
                            setStructureAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, memberId: value } : item,
                              ),
                            )
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
                            current.filter((_, itemIndex) => itemIndex !== index),
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
                <Button onClick={closeStructureEditor} variant="secondary">
                  キャンセル
                </Button>
                <Button
                  data-testid="structure-save-button"
                  disabled={isSavingStructure || !structureChanged}
                  onClick={() => {
                    void handleStructureSave()
                  }}
                >
                  {isSavingStructure ? '保存中...' : '体制を保存'}
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
