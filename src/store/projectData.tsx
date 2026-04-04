import { useEffect, useState, type ReactNode } from 'react'
import {
  createProjectRequest,
  loadProjectData,
  updatePhaseRequest,
  updateProjectStructureRequest,
} from '../api/projectApi'
import type {
  CreateProjectInput,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  UpdatePhaseInput,
  UpdateProjectStructureInput,
} from '../types/project'
import type { ProjectDataContextValue } from './projectDataContext'
import { ProjectDataContext } from './projectDataContext'

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]))

  incoming.forEach((item) => {
    map.set(item.id, item)
  })

  return [...map.values()]
}

function replaceAssignmentsForProject(
  current: ProjectAssignment[],
  projectId: string,
  incoming: ProjectAssignment[],
) {
  return current.filter((assignment) => assignment.projectId !== projectId).concat(incoming)
}

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
    createProject: async (input: CreateProjectInput) => {
      const payload = await createProjectRequest(input)
      const createdProject = payload.projects[0]

      if (!createdProject) {
        throw new Error('Created project payload is empty')
      }

      setProjects((current) => mergeById(current, payload.projects))
      setPhases((current) => mergeById(current, payload.phases))
      setMembers((current) => mergeById(current, payload.members))
      setAssignments((current) => mergeById(current, payload.assignments))

      return createdProject
    },
    updatePhase: async (phaseId: string, input: UpdatePhaseInput) => {
      const payload = await updatePhaseRequest(phaseId, input)
      setPhases((current) => mergeById(current, [payload.phase]))
      setProjects((current) => mergeById(current, [payload.project]))
      return payload.phase
    },
    updateProjectStructure: async (projectId: string, input: UpdateProjectStructureInput) => {
      const payload = await updateProjectStructureRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeById(current, payload.projects))
      setPhases((current) => mergeById(current, payload.phases))
      setMembers((current) => mergeById(current, payload.members))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
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
