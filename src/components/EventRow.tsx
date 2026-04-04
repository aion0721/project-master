import type { Member, ProjectEvent } from '../types/project'
import { getMemberName, isDateInWeekSlot, type WeekSlot } from '../utils/projectUtils'
import { StatusBadge } from './StatusBadge'
import styles from './PhaseRow.module.css'

interface EventRowProps {
  event: ProjectEvent
  members: Member[]
  weekSlots: WeekSlot[]
}

export function EventRow({ event, members, weekSlots }: EventRowProps) {
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`
  const ownerName = event.ownerMemberId ? getMemberName(event.ownerMemberId, members) : '未設定'

  return (
    <div className={styles.row} style={{ gridTemplateColumns: columns }}>
      <div className={`${styles.metaCell} ${styles.eventMetaCell}`}>
        <div className={styles.metaHeader}>
          <div className={styles.eventHeading}>
            <span className={styles.eventEyebrow}>EVENT</span>
            <span className={styles.eventName}>{event.name}</span>
          </div>
          <StatusBadge status={event.status} />
        </div>
        <div className={styles.metaList}>
          <span>イベント: W{event.week}</span>
          <span>担当: {ownerName}</span>
          {event.note ? <span>{event.note}</span> : null}
        </div>
      </div>

      {weekSlots.map((slot) => {
        const active = slot.index === event.week
        const isCurrentWeek = isDateInWeekSlot(slot.startDate)
        const cellClassName = active
          ? `${styles.weekCell} ${styles.eventCell} ${styles.eventActive} ${isCurrentWeek ? styles.currentWeek : ''}`
          : `${styles.weekCell} ${styles.inactive} ${isCurrentWeek ? styles.currentWeek : ''}`

        return (
          <div
            key={`${event.id}-${slot.index}`}
            className={cellClassName}
            data-testid={active ? `timeline-event-${event.id}-week-${slot.index}` : undefined}
          >
            {active ? (
              <span className={styles.eventLabel}>
                <span className={styles.eventMarker}>EV</span>
                <span>{event.name}</span>
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
