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

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { members, getProjectById, getProjectPhases, getProjectAssignments, isLoading, error } =
    useProjectData()

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

  const project = projectId ? getProjectById(projectId) : undefined

  if (!project) {
    return (
      <section className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>案件が見つかりません</h1>
        <p className={styles.notFoundText}>
          指定された案件IDは存在しません。案件一覧から選び直してください。
        </p>
        <Link className={styles.backLink} to="/projects">
          一覧へ戻る
        </Link>
      </section>
    )
  }

  const projectPhases = getProjectPhases(project.id)
  const projectAssignments = getProjectAssignments(project.id)
  const pm = getProjectPm(project, members)
  const osOwners = getOsOwners(projectAssignments, members)

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
              PM、フェーズ進捗、役割ごとの担当者、上司・部下の関係をひとつの案件単位で確認できます。
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
            <span className={styles.metaLabel}>OSタスク担当</span>
            <strong className={styles.metaValue}>{osOwners.join(' / ') || '未設定'}</strong>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>フェーズ進捗タイムライン</h2>
            <p className={styles.sectionDescription}>
              週単位でどのフェーズが走っているかを確認できます。
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
                各フェーズの責任者、期間、進捗を一覧で確認できます。
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
                </tr>
              </thead>
              <tbody>
                {projectPhases.map((phase) => {
                  const range = getPhaseActualRange(project, phase)

                  return (
                    <tr key={phase.id}>
                      <td>{phase.name}</td>
                      <td>{formatPeriod(range.startDate, range.endDate)}</td>
                      <td>{getMemberName(phase.assigneeMemberId, members)}</td>
                      <td>
                        <StatusBadge status={phase.status} />
                      </td>
                      <td>{phase.progress}%</td>
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
                PM、OS担当、各役割、上司・部下の関係をツリーで表示します。
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
