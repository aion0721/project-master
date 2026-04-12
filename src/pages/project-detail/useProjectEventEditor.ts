import { useEffect, useState } from 'react'
import type { Member, Project, ProjectEvent, UpdateProjectEventsInput, WorkStatus } from '../../types/project'
import { getProjectTotalWeeks } from '../../utils/projectUtils'
import { buildDraftEvent, buildEventFormState, type EventFormState } from './projectDetailTypes'

interface UseProjectEventEditorResult {
  eventDrafts: EventFormState[]
  eventError: string | null
  isSavingEvents: boolean
  addEventDraft: () => void
  removeEventDraft: (key: string) => void
  updateEventDraft: (key: string, patch: Partial<EventFormState>) => void
  saveEvents: () => Promise<void>
}

function createDraftKey() {
  return `event-draft-${crypto.randomUUID()}`
}

function createEmptyEventDraft(workStatusOptions: WorkStatus[], members: Member[]): EventFormState {
  return {
    key: createDraftKey(),
    name: '',
    week: '1',
    status: workStatusOptions[0] ?? '未着手',
    ownerMemberId: members[0]?.id ?? '',
    note: '',
  }
}

export function useProjectEventEditor(
  project: Project | undefined,
  initialEvents: ProjectEvent[],
  workStatusOptions: WorkStatus[],
  members: Member[],
  updateProjectEvents: (projectId: string, input: UpdateProjectEventsInput) => Promise<unknown>,
): UseProjectEventEditorResult {
  const [eventDrafts, setEventDrafts] = useState<EventFormState[]>([])
  const [eventError, setEventError] = useState<string | null>(null)
  const [isSavingEvents, setIsSavingEvents] = useState(false)

  useEffect(() => {
    setEventDrafts(initialEvents.map(buildEventFormState))
    setEventError(null)
  }, [initialEvents])

  function addEventDraft() {
    setEventDrafts((current) => [...current, createEmptyEventDraft(workStatusOptions, members)])
  }

  function removeEventDraft(key: string) {
    setEventDrafts((current) => current.filter((event) => event.key !== key))
  }

  function updateEventDraft(key: string, patch: Partial<EventFormState>) {
    setEventDrafts((current) =>
      current.map((event) => (event.key === key ? { ...event, ...patch } : event)),
    )
  }

  async function saveEvents() {
    if (!project) {
      return
    }

    const maxWeek = getProjectTotalWeeks(project)

    for (const draft of eventDrafts) {
      if (!draft.name.trim()) {
        setEventError('イベント名を入力してください。')
        return
      }

      const week = Number(draft.week)
      if (!Number.isInteger(week) || week < 1) {
        setEventError('イベント週は 1 以上の整数で入力してください。')
        return
      }

      if (week > maxWeek) {
        setEventError(`イベント週は案件期間内の W1 - W${maxWeek} で入力してください。`)
        return
      }
    }

    setIsSavingEvents(true)
    setEventError(null)

    try {
      await updateProjectEvents(project.projectNumber, {
        events: eventDrafts.map((draft) => {
          const event = buildDraftEvent(project.projectNumber, draft)
          return {
            id: draft.id,
            name: event.name,
            week: event.week,
            status: event.status,
            ownerMemberId: event.ownerMemberId,
            note: event.note,
          }
        }),
      })
    } catch (caughtError) {
      setEventError(caughtError instanceof Error ? caughtError.message : 'イベントの更新に失敗しました。')
    } finally {
      setIsSavingEvents(false)
    }
  }

  return {
    eventDrafts,
    eventError,
    isSavingEvents,
    addEventDraft,
    removeEventDraft,
    updateEventDraft,
    saveEvents,
  }
}
