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

interface PhaseFormState {
  startWeek: string
  endWeek: string
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
  } = useProjectData()
  const [drafts, setDrafts] = useState<Record<string, PhaseFormState>>({})
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  const project = projectId ? getProjectById(projectId) : undefined
  const projectPhases = useMemo(
    () => (project ? getProjectPhases(project.id) : []),
    [getProjectPhases, project],
  )

  useEffect(() => {
    if (projectPhases.length === 0) {
      return
    }

    setDrafts((current) => {
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

  const projectAssignments = getProjectAssignments(project.id)
  const pm = getProjectPm(project, members)
  const osOwners = getOsOwners(projectAssignments, members)

  async function handlePhaseSave(phaseId: string) {
    const draft = drafts[phaseId]

    if (!draft) {
      return
    }

    const startWeek = Number(draft.startWeek)
    const endWeek = Number(draft.endWeek)

    if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek)) {
      setRowErrors((current) => ({
        ...current,
        [phaseId]: '開始週と終了週は整数で入力してください。',
      }))
      return
    }

    if (startWeek < 1) {
      setRowErrors((current) => ({
        ...current,
        [phaseId]: '開始週は 1 以上で入力してください。',
      }))
      return
    }

    if (endWeek < startWeek) {
      setRowErrors((current) => ({
        ...current,
        [phaseId]: '終了週は開始週以上で入力してください。',
      }))
      return
    }

    setSavingPhaseId(phaseId)
    setRowErrors((current) => {
      const next = { ...current }
      delete next[phaseId]
      return next
    })

    try {
      const updatedPhase = await updatePhaseSchedule(phaseId, { startWeek, endWeek })
      setDrafts((current) => ({
        ...current,
        [phaseId]: buildPhaseFormState(updatedPhase.startWeek, updatedPhase.endWeek),
      }))
    } catch (caughtError) {
      setRowErrors((current) => ({
        ...current,
        [phaseId]:
          caughtError instanceof Error ? caughtError.message : 'フェーズ期間の更新に失敗しました。',
      }))
    } finally {
      setSavingPhaseId((current) => (current === phaseId ? null : current))
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
                  const draft = drafts[phase.id] ?? buildPhaseFormState(phase.startWeek, phase.endWeek)
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
                            setDrafts((current) => ({
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
                            setDrafts((current) => ({
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
                          {rowErrors[phase.id] ? (
                            <p className={styles.rowError}>{rowErrors[phase.id]}</p>
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
                PM、OS 担当、各役割担当、上司・部下の関係をツリーで表示します。
              </p>
            </div>
          </div>

          <MemberTree
            members={members}
            projectAssignments={projectAssignments}
            pmMemberId={project.pmMemberId}
          />
        </section>
      </div>
    </div>
  )
}
