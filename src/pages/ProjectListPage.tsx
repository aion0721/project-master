import { ProjectTable } from '../components/ProjectTable'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useProjectData } from '../store/useProjectData'
import { getProjectCurrentPhase, getProjectPm } from '../utils/projectUtils'
import styles from './ProjectListPage.module.css'

export function ProjectListPage() {
  const { projects, members, getProjectPhases, isLoading, error } = useProjectData()

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.sectionTitle}>案件一覧を読み込み中です</h1>
        <p className={styles.sectionDescription}>バックエンドから案件データを取得しています。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.sectionTitle}>案件一覧を取得できませんでした</h1>
        <p className={styles.sectionDescription}>{error}</p>
      </Panel>
    )
  }

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
      <Panel className={styles.hero} variant="hero">
        <div className={styles.heroHeader}>
          <div>
            <p className={styles.eyebrow}>Project Portfolio</p>
            <h1 className={styles.title}>案件一覧</h1>
            <p className={styles.description}>
              進捗と担当体制を俯瞰するための一覧画面です。進行中の案件や、現在どのフェーズにいるかを高密度に確認できます。
            </p>
          </div>

          <Button to="/projects/new">案件を追加</Button>
        </div>
      </Panel>

      <section className={styles.summaryGrid}>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>総案件数</span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>進行中</span>
          <strong className={styles.summaryValue}>{summary.inProgress}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>遅延</span>
          <strong className={styles.summaryValue}>{summary.delayed}</strong>
        </Panel>
        <Panel as="article" className={styles.summaryCard} variant="compact">
          <span className={styles.summaryLabel}>完了</span>
          <strong className={styles.summaryValue}>{summary.completed}</strong>
        </Panel>
      </section>

      <Panel className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>案件ステータス一覧</h2>
            <p className={styles.sectionDescription}>
              案件ごとの PM、現在フェーズ、状態、開始日、終了予定日を確認できます。
            </p>
          </div>
        </div>

        <ProjectTable rows={rows} />
      </Panel>
    </div>
  )
}
