import type { Phase, Project, ProjectEvent } from '../types/project'
import { getProjectWeekSlots, isDateInWeekSlot } from '../utils/projectUtils'
import { PhaseRow } from './PhaseRow'
import styles from './PhaseTimeline.module.css'

interface PhaseTimelineProps {
  project: Project
  phases: Phase[]
  events?: ProjectEvent[]
}

export function PhaseTimeline({
  project,
  phases,
  events = [],
}: PhaseTimelineProps) {
  const weekSlots = getProjectWeekSlots(project, phases, events)
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`
  const orderedEvents = [...events].sort((left, right) => left.week - right.week)

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

        {orderedEvents.length > 0 ? (
          <div className={styles.eventRow} style={{ gridTemplateColumns: columns }}>
            <div className={styles.eventLead}>イベント</div>
            {weekSlots.map((slot) => {
              const slotEvents = orderedEvents.filter((event) => event.week === slot.index)
              const isCurrentWeek = isDateInWeekSlot(slot.startDate)

              return (
                <div
                  key={`event-slot-${slot.index}`}
                  className={
                    isCurrentWeek
                      ? `${styles.eventCell} ${styles.currentWeek}`
                      : styles.eventCell
                  }
                >
                  {slotEvents.length > 0 ? (
                    <div className={styles.eventChipList}>
                      {slotEvents.map((event) => (
                        <span
                          key={event.id}
                          className={styles.eventChip}
                          data-testid={`timeline-event-${event.id}-week-${slot.index}`}
                        >
                          <span className={styles.eventChipTag}>EV</span>
                          <span className={styles.eventChipText}>{event.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.eventEmpty}>-</span>
                  )}
                </div>
              )
            })}
          </div>
        ) : null}

        <div className={styles.rowGroup}>
          {phases.map((phase) => (
            <PhaseRow key={phase.id} phase={phase} weekSlots={weekSlots} />
          ))}
        </div>
      </div>
    </div>
  )
}
