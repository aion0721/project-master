import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MemberTree } from '../components/MemberTree'
import { PhaseTimeline } from '../components/PhaseTimeline'
import { StatusBadge } from '../components/StatusBadge'
import { useProjectData } from '../store/useProjectData'
import {
  formatPeriod,
  getMemberName,
  getOsOwners,
  getPhaseActualRange,
  getProjectPm,
} from '../utils/projectUtils'
import styles from './ProjectDetailPage.module.css'

const responsibilityOptions = ['OS', '基礎検討', '基本設計', '詳細設計', 'テスト', '移行', 'インフラ統括']

interface PhaseFormState {
  startWeek: string
  endWeek: string
}

interface StructureAssignmentDraft {
  id?: string
  memberId: string
  responsibility: string
}

function buildPhaseFormState(startWeek: number, endWeek: number): PhaseFormState {
  return {
    startWeek: String(startWeek),
    endWeek: String(endWeek),
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
    updatePhaseSchedule,
    updateProjectStructure,
  } = useProjectData()
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseFormState>>({})
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null)
  const [phaseRowErrors, setPhaseRowErrors] = useState<Record<string, string>>({})
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
            existing.endWeek === String(phase.endWeek))
        ) {
          next[phase.id] = buildPhaseFormState(phase.startWeek, phase.endWeek)
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

  if (isLoading) {
    return (
      <section className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を読み込み中です</h1>
        <p className={styles.notFoundText}>バックエンドから案件詳細を取得しています。</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件詳細を取得できませんでした</h1>
        <p className={styles.notFoundText}>{error}</p>
        <Link className={styles.backLink} to="/projects">
          一覧へ戻る
        </Link>
      </section>
    )
  }

  if (!project) {
    return (
      <section className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件が見つかりません</h1>
        <p className={styles.notFoundText}>
          指定された案件 ID は存在しません。案件一覧から選び直してください。
        </p>
        <Link className={styles.backLink} to="/projects">
          一覧へ戻る
        </Link>
      </section>
    )
  }

  const currentProject = project
  const pm = getProjectPm(currentProject, members)
  const osOwners = getOsOwners(projectAssignments, members)
  const structureChanged =
    structurePmMemberId !== currentProject.pmMemberId ||
    JSON.stringify(structureAssignments) !== JSON.stringify(editableAssignments)

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

  async function handlePhaseSave(phaseId: string) {
    const draft = phaseDrafts[phaseId]

    if (!draft) {
      return
    }

    const startWeek = Number(draft.startWeek)
    const endWeek = Number(draft.endWeek)

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

    setSavingPhaseId(phaseId)
    setPhaseRowErrors((current) => {
      const next = { ...current }
      delete next[phaseId]
      return next
    })

    try {
      const updatedPhase = await updatePhaseSchedule(phaseId, { startWeek, endWeek })
      setPhaseDrafts((current) => ({
        ...current,
        [phaseId]: buildPhaseFormState(updatedPhase.startWeek, updatedPhase.endWeek),
      }))
    } catch (caughtError) {
      setPhaseRowErrors((current) => ({
        ...current,
        [phaseId]:
          caughtError instanceof Error ? caughtError.message : 'フェーズ期間の更新に失敗しました。',
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
      setStructureError('各役割行に担当者と責務を入力してください。')
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
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <Link className={styles.backTextLink} to="/projects">
              案件一覧へ戻る
            </Link>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.description}>
              PM、フェーズ進捗、担当体制をまとめて確認できる案件詳細画面です。
            </p>
          </div>

          <StatusBadge status={project.status} />
        </div>

        <div className={styles.metaGrid}>
          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>PM</span>
            <strong className={styles.metaValue}>{pm?.name ?? '未設定'}</strong>
          </article>
          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>期間</span>
            <strong className={styles.metaValue}>{formatPeriod(project.startDate, project.endDate)}</strong>
          </article>
          <article className={styles.metaCard}>
            <span className={styles.metaLabel}>OS タスク担当</span>
            <strong className={styles.metaValue}>{osOwners.join(' / ') || '未設定'}</strong>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              週ごとのフェーズ実施状況をガントチャート形式で表示します。
            </p>
          </div>
        </div>

        <PhaseTimeline project={project} phases={projectPhases} members={members} />
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>フェーズ別担当者</h2>
              <p className={styles.sectionDescription}>
                各フェーズの担当者、状態、進捗に加えて、開始週と終了週を編集できます。
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
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {projectPhases.map((phase) => {
                  const range = getPhaseActualRange(project, phase)
                  const draft = phaseDrafts[phase.id] ?? buildPhaseFormState(phase.startWeek, phase.endWeek)
                  const isSaving = savingPhaseId === phase.id
                  const hasChanges =
                    draft.startWeek !== String(phase.startWeek) || draft.endWeek !== String(phase.endWeek)

                  return (
                    <tr key={phase.id}>
                      <td>{phase.name}</td>
                      <td>{formatPeriod(range.startDate, range.endDate)}</td>
                      <td>{getMemberName(phase.assigneeMemberId, members)}</td>
                      <td>
                        <StatusBadge status={phase.status} />
                      </td>
                      <td>{phase.progress}%</td>
                      <td>
                        <input
                          className={styles.weekInput}
                          type="number"
                          min={1}
                          inputMode="numeric"
                          aria-label={`${phase.name}の開始週`}
                          value={draft.startWeek}
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
                        />
                      </td>
                      <td>
                        <input
                          className={styles.weekInput}
                          type="number"
                          min={1}
                          inputMode="numeric"
                          aria-label={`${phase.name}の終了週`}
                          value={draft.endWeek}
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
                        />
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            className={styles.saveButton}
                            type="button"
                            onClick={() => {
                              void handlePhaseSave(phase.id)
                            }}
                            disabled={isSaving || !hasChanges}
                          >
                            {isSaving ? '保存中...' : '保存'}
                          </button>
                          {phaseRowErrors[phase.id] ? (
                            <p className={styles.rowError}>{phaseRowErrors[phase.id]}</p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>プロジェクト体制</h2>
              <p className={styles.sectionDescription}>
                PM と役割担当を管理できます。上司・部下の関係はメンバー定義に基づく参照表示です。
              </p>
            </div>

            {isStructureEditing ? (
              <button className={styles.secondaryButton} type="button" onClick={closeStructureEditor}>
                編集を閉じる
              </button>
            ) : (
              <button className={styles.secondaryButton} type="button" onClick={openStructureEditor}>
                編集
              </button>
            )}
          </div>

          {isStructureEditing ? (
            <div className={styles.structureEditor}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>PM</span>
                <select
                  className={styles.selectInput}
                  aria-label="PMを選択"
                  value={structurePmMemberId}
                  onChange={(event) => setStructurePmMemberId(event.target.value)}
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
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() =>
                      setStructureAssignments((current) => [
                        ...current,
                        {
                          memberId: '',
                          responsibility: responsibilityOptions[0]!,
                        },
                      ])
                    }
                  >
                    役割を追加
                  </button>
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
                          className={styles.selectInput}
                          aria-label={`役割${index + 1}の責務`}
                          value={assignment.responsibility}
                          onChange={(event) => {
                            const value = event.target.value
                            setStructureAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, responsibility: value } : item,
                              ),
                            )
                          }}
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
                          className={styles.selectInput}
                          aria-label={`役割${index + 1}の担当者`}
                          value={assignment.memberId}
                          onChange={(event) => {
                            const value = event.target.value
                            setStructureAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, memberId: value } : item,
                              ),
                            )
                          }}
                        >
                          <option value="">選択してください</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className={styles.removeButton}
                        type="button"
                        onClick={() =>
                          setStructureAssignments((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {structureError ? <p className={styles.sectionError}>{structureError}</p> : null}

              <div className={styles.structureActions}>
                <button className={styles.secondaryButton} type="button" onClick={closeStructureEditor}>
                  キャンセル
                </button>
                <button
                  className={styles.saveButton}
                  type="button"
                  onClick={() => {
                    void handleStructureSave()
                  }}
                  disabled={isSavingStructure || !structureChanged}
                >
                  {isSavingStructure ? '保存中...' : '体制を保存'}
                </button>
              </div>
            </div>
          ) : null}

          <div className={styles.treeSection}>
            <MemberTree
              members={members}
              projectAssignments={projectAssignments}
              pmMemberId={project.pmMemberId}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
