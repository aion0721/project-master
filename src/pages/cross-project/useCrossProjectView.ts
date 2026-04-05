import { useMemo, useState } from 'react'
import type { Member, Phase, Project, ProjectEvent } from '../../types/project'
import { getActiveEventsForWeek, getActivePhasesForWeek, getGlobalWeekSlots } from '../../utils/projectUtils'

export type CrossProjectViewMode = 'all' | 'bookmarks'

interface UseCrossProjectViewParams {
  currentUser: Member | null
  getProjectPhases: (projectId: string) => Phase[]
  getProjectEvents: (projectId: string) => ProjectEvent[]
  projects: Project[]
}

export function getPhaseToneKey(phaseName: string) {
  switch (phaseName) {
    case '基礎検討':
      return 'discovery'
    case '基本設計':
      return 'basicDesign'
    case '詳細設計':
      return 'detailDesign'
    case 'テスト':
      return 'testing'
    case '移行':
      return 'migration'
    default:
      return 'defaultTone'
  }
}

export function useCrossProjectView({
  currentUser,
  getProjectPhases,
  getProjectEvents,
  projects,
}: UseCrossProjectViewParams) {
  const [viewMode, setViewMode] = useState<CrossProjectViewMode>('all')
  const [keyword, setKeyword] = useState('')

  const baseProjects = useMemo(() => {
    if (viewMode !== 'bookmarks' || !currentUser) {
      return projects
    }

    const bookmarkedSet = new Set(currentUser.bookmarkedProjectIds)
    return projects.filter((project) => bookmarkedSet.has(project.projectNumber))
  }, [currentUser, projects, viewMode])

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredProjects = useMemo(() => {
    if (!normalizedKeyword) {
      return baseProjects
    }

    return baseProjects.filter((project) => {
      const searchableText = `${project.projectNumber} ${project.name}`.toLowerCase()
      return searchableText.includes(normalizedKeyword)
    })
  }, [baseProjects, normalizedKeyword])

  const globalWeekSlots = useMemo(() => getGlobalWeekSlots(filteredProjects), [filteredProjects])

  const peakBusy = useMemo(
    () =>
      Math.max(
        ...filteredProjects.flatMap((project) =>
          globalWeekSlots.map(
            (slot) =>
              getActivePhasesForWeek(project, getProjectPhases(project.projectNumber), slot.startDate)
                .length +
              getActiveEventsForWeek(getProjectEvents(project.projectNumber), slot.index).length,
          ),
        ),
        0,
      ),
    [filteredProjects, getProjectEvents, getProjectPhases, globalWeekSlots],
  )

  return {
    baseProjects,
    filteredProjects,
    globalWeekSlots,
    hasNoProjectsInMode: baseProjects.length === 0,
    hasNoSearchResults: baseProjects.length > 0 && filteredProjects.length === 0,
    isBookmarkMode: viewMode === 'bookmarks',
    keyword,
    peakBusy,
    setKeyword,
    setViewMode,
    viewMode,
  }
}
