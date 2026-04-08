import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Member, Phase, WorkStatus } from '../../types/project'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import type { EventFormState } from './projectDetailTypes'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectEventSectionProps {
  projectPhases: Phase[]
  members: Member[]
  workStatusOptions: WorkStatus[]
  eventDrafts: EventFormState[]
  eventError: string | null
  isSavingEvents: boolean
  onAddEvent: () => void
  onRemoveEvent: (key: string) => void
  onUpdateEvent: (key: string, patch: Partial<EventFormState>) => void
  onSave: () => void
}

export function ProjectEventSection({
  projectPhases,
  members,
  workStatusOptions,
  eventDrafts,
  eventError,
  isSavingEvents,
  onAddEvent,
  onRemoveEvent,
  onUpdateEvent,
  onSave,
}: ProjectEventSectionProps) {
  const maxWeek = Math.max(...projectPhases.map((phase) => phase.endWeek), ...eventDrafts.map((event) => Number(event.week) || 1), 1)
  const summaryEvents = [...eventDrafts].sort((left, right) => Number(left.week) - Number(right.week))

  return (
    <Panel className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>週次イベント</h2>
          <p className={styles.sectionDescription}>
            環境提供やレビュー会のような単発イベントを、対象週ベースで登録します。
          </p>
        </div>
        <div className={styles.phaseHeaderActions}>
          <Button data-testid="project-events-add-button" onClick={onAddEvent} size="small" variant="secondary">
            イベント追加
          </Button>
          <Button
            data-testid="project-events-save-button"
            disabled={isSavingEvents}
            onClick={onSave}
            size="small"
          >
            {isSavingEvents ? '保存中...' : 'イベント保存'}
          </Button>
        </div>
      </div>

      {eventError ? <p className={styles.sectionError}>{eventError}</p> : null}

      <div className={styles.eventTableWrap}>
        <table className={styles.phaseTable}>
          <thead>
            <tr>
              <th>イベント名</th>
              <th>対象週</th>
              <th>状態</th>
              <th>担当</th>
              <th>メモ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {eventDrafts.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={6}>
                  まだイベントは登録されていません。
                </td>
              </tr>
            ) : (
              eventDrafts.map((event, index) => (
                <tr key={event.key}>
                  <td>
                    <input
                      className={styles.selectInput}
                      data-testid={`event-name-${index}`}
                      onChange={(targetEvent) =>
                        onUpdateEvent(event.key, { name: targetEvent.target.value })
                      }
                      placeholder="例: 環境提供"
                      value={event.name}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.weekInput}
                      data-testid={`event-week-${index}`}
                      max={String(maxWeek)}
                      min="1"
                      onChange={(targetEvent) =>
                        onUpdateEvent(event.key, { week: targetEvent.target.value })
                      }
                      type="number"
                      value={event.week}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.selectInput}
                      data-testid={`event-status-${index}`}
                      onChange={(targetEvent) =>
                        onUpdateEvent(event.key, {
                          status: targetEvent.target.value as WorkStatus,
                        })
                      }
                      value={event.status}
                    >
                      {workStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={styles.selectInput}
                      data-testid={`event-owner-${index}`}
                      onChange={(targetEvent) =>
                        onUpdateEvent(event.key, { ownerMemberId: targetEvent.target.value })
                      }
                      value={event.ownerMemberId}
                    >
                      <option value="">未設定</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {formatMemberShortLabel(member)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={styles.selectInput}
                      data-testid={`event-note-${index}`}
                      onChange={(targetEvent) =>
                        onUpdateEvent(event.key, { note: targetEvent.target.value })
                      }
                      placeholder="補足メモ"
                      value={event.note}
                    />
                  </td>
                  <td className={styles.actionCell}>
                    <Button
                      data-testid={`event-remove-${index}`}
                      onClick={() => onRemoveEvent(event.key)}
                      size="small"
                      variant="danger"
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {summaryEvents.length > 0 ? (
        <div className={styles.eventSummary}>
          {summaryEvents.map((event, index) => (
            <span key={`${event.key}-${index}-summary`} className={styles.eventChip}>
              W{event.week}: {event.name}
            </span>
          ))}
        </div>
      ) : null}
    </Panel>
  )
}
