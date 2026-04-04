import type { Phase, Project } from '../types/project'
import { getProjectWeekSlots, isDateInWeekSlot } from '../utils/projectUtils'
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
          {weekSlots.map((slot) => {
            const isCurrentWeek = isDateInWeekSlot(slot.startDate)

            return (
              <div
                key={slot.index}
                className={
                  isCurrentWeek
                    ? `${styles.headerCell} ${styles.currentWeek}`
                    : styles.headerCell
                }
                data-testid={isCurrentWeek ? `project-current-week-${slot.index}` : undefined}
              >
                <span className={styles.weekLabel}>{slot.label}</span>
                <span className={styles.weekDate}>{slot.subLabel}</span>
                {isCurrentWeek ? <span className={styles.currentWeekBadge}>今週</span> : null}
              </div>
            )
          })}
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
