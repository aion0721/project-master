import { useEffect, useState } from 'react'
import type { Phase, Project, ProjectEvent } from '../types/project'
import { getProjectWeekSlots, isDateInWeekSlot } from '../utils/projectUtils'
import { PhaseRow } from './PhaseRow'
import styles from './PhaseTimeline.module.css'

type ResizeEdge = 'start' | 'end'

interface PhaseTimelineProps {
  project: Project
  phases: Phase[]
  events?: ProjectEvent[]
  editable?: boolean
  selectedPhaseId?: string | null
  onPhaseSelect?: (phaseId: string) => void
  onPhaseMove?: (phaseId: string, direction: 'up' | 'down') => void
  onPhaseResize?: (phaseId: string, nextRange: { startWeek: number; endWeek: number }) => void
  onPhaseConfirm?: (phaseId: string) => void
  onPhaseCancel?: (phaseId: string) => void
}

export function PhaseTimeline({
  project,
  phases,
  events = [],
  editable = false,
  selectedPhaseId = null,
  onPhaseSelect,
  onPhaseMove,
  onPhaseResize,
  onPhaseConfirm,
  onPhaseCancel,
}: PhaseTimelineProps) {
  const weekSlots = getProjectWeekSlots(project, phases, events)
  const columns = `240px repeat(${weekSlots.length}, minmax(88px, 1fr))`
  const orderedEvents = [...events].sort((left, right) => left.week - right.week)
  const [dragState, setDragState] = useState<{
    phaseId: string
    edge: ResizeEdge
  } | null>(null)

  useEffect(() => {
    if (!dragState) {
      return
    }

    function stopDragging() {
      setDragState(null)
    }

    window.addEventListener('mouseup', stopDragging)

    return () => {
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [dragState])

  function handleResizeStart(phaseId: string, edge: ResizeEdge) {
    if (!editable) {
      return
    }

    onPhaseSelect?.(phaseId)
    setDragState({ phaseId, edge })
  }

  function handleResizeHover(phaseId: string, week: number) {
    if (!editable || !dragState || dragState.phaseId !== phaseId || !onPhaseResize) {
      return
    }

    const phase = phases.find((item) => item.id === phaseId)

    if (!phase) {
      return
    }

    if (dragState.edge === 'start') {
      onPhaseResize(phaseId, {
        startWeek: Math.max(1, Math.min(week, phase.endWeek)),
        endWeek: phase.endWeek,
      })
      return
    }

    onPhaseResize(phaseId, {
      startWeek: phase.startWeek,
      endWeek: Math.max(phase.startWeek, week),
    })
  }

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
          {phases.map((phase, index) => (
            <PhaseRow
              canMoveDown={index < phases.length - 1}
              canMoveUp={index > 0}
              editable={editable}
              isDragging={dragState?.phaseId === phase.id}
              isSelected={selectedPhaseId === phase.id}
              key={phase.id}
              onCancel={onPhaseCancel}
              onConfirm={onPhaseConfirm}
              onMove={onPhaseMove}
              onResizeHover={handleResizeHover}
              onResizeStart={handleResizeStart}
              onSelect={onPhaseSelect}
              phase={phase}
              weekSlots={weekSlots}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
