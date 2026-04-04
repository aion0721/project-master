import type { Phase, Project } from '../types/project'
import { getProjectWeekSlots } from '../utils/projectUtils'
import { PhaseRow } from './PhaseRow'
import styles from './PhaseTimeline.module.css'

interface PhaseTimelineProps {
  project: Project
  phases: Phase[]
}

export function PhaseTimeline({ project, phases }: PhaseTimelineProps) {
  const weekSlots = getProjectWeekSlots(project, phases)
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        <div className={styles.headerRow} style={{ gridTemplateColumns: columns }}>
          <div className={styles.headerLead}>フェーズ / 進捗 / 期間</div>
          {weekSlots.map((slot) => (
            <div key={slot.index} className={styles.headerCell}>
              <span className={styles.weekLabel}>{slot.label}</span>
              <span className={styles.weekDate}>{slot.subLabel}</span>
            </div>
          ))}
        </div>

        <div className={styles.rowGroup}>
          {phases.map((phase) => (
            <PhaseRow key={phase.id} phase={phase} weekSlots={weekSlots} />
          ))}
        </div>
      </div>
    </div>
  )
}
