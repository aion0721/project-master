import { useEffect, useState, type ReactNode } from 'react'
import { loadProjectData } from '../api/projectApi'
import type { Member, Phase, Project, ProjectAssignment } from '../types/project'
import type { ProjectDataContextValue } from './projectDataContext'
import { ProjectDataContext } from './projectDataContext'

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProjectData() {
      setIsLoading(true)
      setError(null)

      try {
        const payload = await loadProjectData(controller.signal)

        setProjects(payload.projects)
        setPhases(payload.phases)
        setMembers(payload.members)
        setAssignments(payload.assignments)
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load project data')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchProjectData()

    return () => {
      controller.abort()
    }
  }, [refreshKey])

  const value: ProjectDataContextValue = {
    projects,
    phases,
    members,
    assignments,
    isLoading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
    getProjectById: (projectId) => projects.find((project) => project.id === projectId),
    getProjectPhases: (projectId) =>
      phases
        .filter((phase) => phase.projectId === projectId)
        .sort((left, right) => left.startWeek - right.startWeek),
    getProjectAssignments: (projectId) =>
      assignments.filter((assignment) => assignment.projectId === projectId),
    getMemberById: (memberId) => members.find((member) => member.id === memberId),
  }

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>
}
