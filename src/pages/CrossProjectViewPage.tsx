import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useProjectData } from '../store/useProjectData'
import { getActivePhasesForWeek, getGlobalWeekSlots, getProjectPm } from '../utils/projectUtils'
import styles from './CrossProjectViewPage.module.css'

function getToneClassName(phaseName: string) {
  switch (phaseName) {
    case '基礎検討':
      return styles.discovery
    case '基本設計':
      return styles.basicDesign
    case '詳細設計':
      return styles.detailDesign
    case 'テスト':
      return styles.testing
    case '移行':
      return styles.migration
    default:
      return styles.defaultTone
  }
}

export function CrossProjectViewPage() {
  const { projects, members, getProjectPhases, isLoading, error } = useProjectData()

  if (isLoading) {
    return (
      <section className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを読み込み中です</h1>
        <p className={styles.description}>バックエンドから横断データを取得しています。</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section}>
        <h1 className={styles.title}>複数案件横断ビューを取得できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </section>
    )
  }

  const globalWeekSlots = getGlobalWeekSlots(projects)
  const peakBusy = Math.max(
    ...projects.flatMap((project) =>
      globalWeekSlots.map(
        (slot) => getActivePhasesForWeek(project, getProjectPhases(project.id), slot.startDate).length,
      ),
    ),
    0,
  )

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Cross Project Timeline</p>
          <h1 className={styles.title}>複数案件横断ビュー</h1>
          <p className={styles.description}>
            各案件がどの週にどのフェーズへ入っているかを横断で確認できます。設計フェーズやテストが集中する時期を見つけやすくしています。
          </p>
        </div>

        <div className={styles.heroStats}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>対象案件</span>
            <strong className={styles.statValue}>{projects.length}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>最大同時進行</span>
            <strong className={styles.statValue}>{peakBusy} Phase / Week</strong>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.stickyColumn}>案件名</th>
                {globalWeekSlots.map((slot) => (
                  <th key={slot.index}>
                    <span className={styles.weekLabel}>{slot.label}</span>
                    <span className={styles.weekDate}>{slot.subLabel}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const projectPhases = getProjectPhases(project.id)
                const pm = getProjectPm(project, members)

                return (
                  <tr key={project.id}>
                    <td className={styles.stickyColumn}>
                      <div className={styles.projectInfo}>
                        <Link className={styles.projectLink} to={`/projects/${project.id}`}>
                          {project.name}
                        </Link>
                        <div className={styles.metaLine}>PM: {pm?.name ?? '未設定'}</div>
                        <StatusBadge status={project.status} />
                      </div>
                    </td>

                    {globalWeekSlots.map((slot) => {
                      const activePhases = getActivePhasesForWeek(project, projectPhases, slot.startDate)
                      const busy = activePhases.length > 1

                      return (
                        <td
                          key={`${project.id}-${slot.index}`}
                          className={busy ? `${styles.cell} ${styles.busy}` : styles.cell}
                        >
                          {activePhases.length > 0 ? (
                            <div className={styles.phaseChipList}>
                              {activePhases.map((phase) => (
                                <span
                                  key={phase.id}
                                  className={`${styles.phaseChip} ${getToneClassName(phase.name)}`}
                                >
                                  {phase.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.emptyCell}>-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
