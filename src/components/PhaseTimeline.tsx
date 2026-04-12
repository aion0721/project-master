import { useEffect, useState } from 'react'
import type { Phase, Project, ProjectEvent, WorkStatus } from '../types/project'
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
  selectedEventId?: string | null
  onPhaseSelect?: (phaseId: string) => void
  onPhaseMove?: (phaseId: string, direction: 'up' | 'down') => void
  onPhaseResize?: (phaseId: string, nextRange: { startWeek: number; endWeek: number }) => void
  onPhaseStatusChange?: (phaseId: string, status: WorkStatus) => void
  onPhaseRemove?: (phaseId: string) => void
  onPhaseConfirm?: (phaseId: string) => void
  onPhaseCancel?: (phaseId: string) => void
  onEventAdd?: (week: number) => void
  onEventSelect?: (eventId: string) => void
  workStatusOptions?: WorkStatus[]
}

export function PhaseTimeline({
  project,
  phases,
  events = [],
  editable = false,
  selectedPhaseId = null,
  selectedEventId = null,
  onPhaseSelect,
  onPhaseMove,
  onPhaseResize,
  onPhaseStatusChange,
  onPhaseRemove,
  onPhaseConfirm,
  onPhaseCancel,
  onEventAdd,
  onEventSelect,
  workStatusOptions = [],
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
          <div className={styles.headerLead}>フェーズ / 期間</div>
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

        {orderedEvents.length > 0 || editable ? (
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
                  data-testid={`timeline-event-slot-${slot.index}`}
                >
                  {slotEvents.length > 0 ? (
                    <div className={styles.eventChipList}>
                      {slotEvents.map((event) => (
                        <button
                          key={event.id}
                          className={
                            selectedEventId === event.id
                              ? `${styles.eventChip} ${styles.eventChipSelected}`
                              : styles.eventChip
                          }
                          data-testid={`timeline-event-${event.id}-week-${slot.index}`}
                          onClick={() => onEventSelect?.(event.id)}
                          type="button"
                        >
                          <span className={styles.eventChipTag}>EV</span>
                          <span className={styles.eventChipText}>{event.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.eventEmpty}>イベントなし</span>
                  )}
                  {editable ? (
                    <button
                      className={styles.eventAddButton}
                      data-testid={`timeline-event-add-week-${slot.index}`}
                      onClick={() => onEventAdd?.(slot.index)}
                      type="button"
                    >
                      + 追加
                    </button>
                  ) : null}
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
              onRemove={onPhaseRemove}
              onSelect={onPhaseSelect}
              onStatusChange={onPhaseStatusChange}
              phase={phase}
              canRemove={phases.length > 1}
              weekSlots={weekSlots}
              workStatusOptions={workStatusOptions}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
