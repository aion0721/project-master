import { ProjectTable } from '../components/ProjectTable'
import { useProjectData } from '../store/useProjectData'
import { getProjectCurrentPhase, getProjectPm } from '../utils/projectUtils'
import styles from './ProjectListPage.module.css'

export function ProjectListPage() {
  const { projects, members, getProjectPhases } = useProjectData()
  const rows = projects.map((project) => {
    const projectPhases = getProjectPhases(project.id)
    const currentPhase = getProjectCurrentPhase(projectPhases)
    const pm = getProjectPm(project, members)

    return {
      project,
      currentPhaseName: currentPhase?.name ?? '未設定',
      pmName: pm?.name ?? '未設定',
    }
  })

  const summary = {
    total: projects.length,
    inProgress: projects.filter((project) => project.status === '進行中').length,
    delayed: projects.filter((project) => project.status === '遅延').length,
    completed: projects.filter((project) => project.status === '完了').length,
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Project Portfolio</p>
          <h1 className={styles.title}>案件一覧</h1>
          <p className={styles.description}>
            進捗と担当体制を案件単位で把握するための一覧です。遅延中の案件や、現在どのフェーズにいるかを同じ表で確認できます。
          </p>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>総案件数</span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>進行中</span>
          <strong className={styles.summaryValue}>{summary.inProgress}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>遅延</span>
          <strong className={styles.summaryValue}>{summary.delayed}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>完了</span>
          <strong className={styles.summaryValue}>{summary.completed}</strong>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>案件ステータス一覧</h2>
            <p className={styles.sectionDescription}>案件ごとのPM、現在フェーズ、開始/終了予定日を確認できます。</p>
          </div>
        </div>

        <ProjectTable rows={rows} />
      </section>
    </div>
  )
}
