import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { SearchSelect } from '../../components/ui/SearchSelect'
import type { Member, Project, WorkStatus } from '../../types/project'
import { getProjectTotalWeeks } from '../../utils/projectUtils'
import { formatMemberShortLabel } from '../members/memberFormUtils'
import type { EventFormState } from './projectDetailTypes'
import styles from '../projects/ProjectDetailPage.module.css'

interface ProjectEventSectionProps {
  project: Project
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
  project,
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
  const maxWeek = getProjectTotalWeeks(project)
  const summaryEvents = [...eventDrafts].sort((left, right) => Number(left.week) - Number(right.week))
  const memberOptions = members.map((member) => ({
    value: member.id,
    label: formatMemberShortLabel(member),
    keywords: [member.name, member.departmentName, member.role],
  }))

  return (
    <Panel className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>関連イベント</h2>
          <p className={styles.sectionDescription}>
            週番号、状態、担当者とあわせてイベントを一覧で管理します。
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
              <th>担当者</th>
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
                      placeholder="例: レビュー"
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
                    <SearchSelect
                      ariaLabel={`イベント ${index + 1} の担当者`}
                      className={styles.selectInput}
                      dataTestId={`event-owner-${index}`}
                      onChange={(ownerMemberId) => onUpdateEvent(event.key, { ownerMemberId })}
                      options={memberOptions}
                      placeholder="担当者を検索"
                      value={event.ownerMemberId}
                    />
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
