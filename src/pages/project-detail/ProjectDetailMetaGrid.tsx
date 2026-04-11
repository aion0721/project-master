import { CurrentPhaseCard } from './CurrentPhaseCard'
import { ProjectLinksCard } from './ProjectLinksCard'
import { ProjectNoteCard } from './ProjectNoteCard'
import { ProjectReportStatusCard } from './ProjectReportStatusCard'
import { ProjectStatusCard } from './ProjectStatusCard'
import { ProjectStatusEntriesCard } from './ProjectStatusEntriesCard'
import { ProjectSummaryCard } from './ProjectSummaryCard'
import { ProjectSystemCard } from './ProjectSystemCard'
import { ScheduleCard } from './ScheduleCard'
import type { ProjectDetailMetaGridProps } from './ProjectDetailMetaGrid.types'
import styles from '../projects/ProjectDetailPage.module.css'

export function ProjectDetailMetaGrid({
  currentPhaseProps,
  projectLinksProps,
  projectNoteProps,
  projectReportStatusProps,
  projectStatusEntriesProps,
  projectStatusProps,
  projectSummaryProps,
  projectSystemProps,
  scheduleProps,
}: ProjectDetailMetaGridProps) {
  return (
    <div className={styles.metaGrid}>
      <ProjectSummaryCard {...projectSummaryProps} />
      <ScheduleCard {...scheduleProps} />
      <ProjectSystemCard {...projectSystemProps} />
      <CurrentPhaseCard {...currentPhaseProps} />
      <ProjectStatusCard {...projectStatusProps} />
      <ProjectNoteCard {...projectNoteProps} />
      <ProjectLinksCard {...projectLinksProps} />
      <ProjectStatusEntriesCard {...projectStatusEntriesProps} />
      <ProjectReportStatusCard {...projectReportStatusProps} />
    </div>
  )
}
