import { useMemo, useState } from 'react'
import type { Member, Phase, Project, ProjectEvent } from '../../types/project'
import {
  getActiveEventsForRange,
  getActiveEventsForWeek,
  getActivePhasesForRange,
  getActivePhasesForWeek,
  getGlobalMonthSlots,
  getGlobalWeekSlots,
  type WeekSlot,
} from '../../utils/projectUtils'
export { getPhaseToneKey } from '../../utils/projectPhasePresets'

export type CrossProjectViewMode = 'all' | 'bookmarks'
export type CrossProjectTimeScale = 'week' | 'month'

interface UseCrossProjectViewParams {
  currentUser: Member | null
  getProjectPhases: (projectId: string) => Phase[]
  getProjectEvents: (projectId: string) => ProjectEvent[]
  projects: Project[]
  selectedStatuses: Project['status'][]
}

export function useCrossProjectView({
  currentUser,
  getProjectPhases,
  getProjectEvents,
  projects,
  selectedStatuses,
}: UseCrossProjectViewParams) {
  const [viewMode, setViewMode] = useState<CrossProjectViewMode>('all')
  const [timeScale, setTimeScale] = useState<CrossProjectTimeScale>('week')
  const [keyword, setKeyword] = useState('')

  const modeFilteredProjects = useMemo(() => {
    if (viewMode !== 'bookmarks' || !currentUser) {
      return projects
    }

    const bookmarkedSet = new Set(currentUser.bookmarkedProjectIds)
    return projects.filter((project) => bookmarkedSet.has(project.projectNumber))
  }, [currentUser, projects, viewMode])

  const statusFilteredProjects = useMemo(
    () => modeFilteredProjects.filter((project) => selectedStatuses.includes(project.status)),
    [modeFilteredProjects, selectedStatuses],
  )

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredProjects = useMemo(() => {
    if (!normalizedKeyword) {
      return statusFilteredProjects
    }

    return statusFilteredProjects.filter((project) => {
      const searchableText = `${project.projectNumber} ${project.name}`.toLowerCase()
      return searchableText.includes(normalizedKeyword)
    })
  }, [normalizedKeyword, statusFilteredProjects])

  const globalWeekSlots = useMemo(() => getGlobalWeekSlots(filteredProjects), [filteredProjects])
  const globalMonthSlots = useMemo(() => getGlobalMonthSlots(filteredProjects), [filteredProjects])
  const timelineSlots = useMemo<WeekSlot[]>(
    () => (timeScale === 'month' ? globalMonthSlots : globalWeekSlots),
    [globalMonthSlots, globalWeekSlots, timeScale],
  )

  const peakBusy = useMemo(
    () =>
      Math.max(
        ...filteredProjects.flatMap((project) =>
          timelineSlots.map((slot) => {
            if (timeScale === 'month') {
              return (
                getActivePhasesForRange(
                  project,
                  getProjectPhases(project.projectNumber),
                  slot.startDate,
                  slot.endDate,
                ).length +
                getActiveEventsForRange(
                  project,
                  getProjectEvents(project.projectNumber),
                  slot.startDate,
                  slot.endDate,
                ).length
              )
            }

            return (
              getActivePhasesForWeek(project, getProjectPhases(project.projectNumber), slot.startDate)
                .length +
              getActiveEventsForWeek(getProjectEvents(project.projectNumber), slot.index).length
            )
          }),
        ),
        0,
      ),
    [filteredProjects, getProjectEvents, getProjectPhases, timeScale, timelineSlots],
  )

  return {
    filteredProjects,
    globalMonthSlots,
    globalWeekSlots,
    hasNoProjectsInMode: modeFilteredProjects.length === 0,
    hasNoSearchResults: statusFilteredProjects.length > 0 && filteredProjects.length === 0,
    hasNoStatusMatches: modeFilteredProjects.length > 0 && selectedStatuses.length > 0 && statusFilteredProjects.length === 0,
    hasNoStatusesSelected: selectedStatuses.length === 0,
    isBookmarkMode: viewMode === 'bookmarks',
    keyword,
    peakBusy,
    setKeyword,
    setTimeScale,
    setViewMode,
    timeScale,
    timelineSlots,
    viewMode,
  }
}
