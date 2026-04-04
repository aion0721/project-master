import { useEffect, useState, type ReactNode } from 'react'
import {
  createMemberRequest,
  createProjectRequest,
  deleteMemberRequest,
  loadProjectData,
  updateMemberRequest,
  updatePhaseRequest,
  updateProjectCurrentPhaseRequest,
  updateProjectEventsRequest,
  updateProjectLinksRequest,
  updateProjectPhasesRequest,
  updateProjectScheduleRequest,
  updateProjectStructureRequest,
} from '../api/projectApi'
import type {
  CreateMemberInput,
  CreateProjectInput,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectEvent,
  UpdateMemberInput,
  UpdateProjectEventsInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectStructureInput,
} from '../types/project'
import type { ProjectDataContextValue } from './projectDataContext'
import { ProjectDataContext } from './projectDataContext'

function mergeByKey<T>(current: T[], incoming: T[], getKey: (item: T) => string) {
  const map = new Map(current.map((item) => [getKey(item), item]))

  incoming.forEach((item) => {
    map.set(getKey(item), item)
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

function replaceEventsForProject(current: ProjectEvent[], projectId: string, incoming: ProjectEvent[]) {
  return current.filter((event) => event.projectId !== projectId).concat(incoming)
}

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [events, setEvents] = useState<ProjectEvent[]>([])
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
        setEvents(payload.events)
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
    events,
    members,
    assignments,
    isLoading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
    createMember: async (input: CreateMemberInput) => {
      const member = await createMemberRequest(input)
      setMembers((current) => mergeByKey(current, [member], (item) => item.id))
      return member
    },
    createProject: async (input: CreateProjectInput) => {
      const payload = await createProjectRequest(input)
      const createdProject = payload.projects[0]

      if (!createdProject) {
        throw new Error('Created project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => mergeByKey(current, payload.events, (item) => item.id))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => mergeByKey(current, payload.assignments, (item) => item.id))

      return createdProject
    },
    updateMember: async (memberId: string, input: UpdateMemberInput) => {
      const member = await updateMemberRequest(memberId, input)
      setMembers((current) => mergeByKey(current, [member], (item) => item.id))
      return member
    },
    deleteMember: async (memberId: string) => {
      await deleteMemberRequest(memberId)
      setMembers((current) => current.filter((member) => member.id !== memberId))
    },
    updatePhase: async (phaseId: string, input: UpdatePhaseInput) => {
      const payload = await updatePhaseRequest(phaseId, input)
      setPhases((current) => mergeByKey(current, [payload.phase], (item) => item.id))
      setProjects((current) => mergeByKey(current, [payload.project], (item) => item.projectNumber))
      return payload.phase
    },
    updateProjectSchedule: async (projectId: string, input: UpdateProjectScheduleInput) => {
      const payload = await updateProjectScheduleRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectLinks: async (projectId: string, input: UpdateProjectLinksInput) => {
      const payload = await updateProjectLinksRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectEvents: async (projectId: string, input: UpdateProjectEventsInput) => {
      const payload = await updateProjectEventsRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectPhases: async (projectId: string, input: UpdateProjectPhasesInput) => {
      const payload = await updateProjectPhasesRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) =>
        current.filter((phase) => phase.projectId !== projectId).concat(payload.phases),
      )
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectCurrentPhase: async (projectId: string, phaseId: string) => {
      const payload = await updateProjectCurrentPhaseRequest(projectId, phaseId)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectStructure: async (projectId: string, input: UpdateProjectStructureInput) => {
      const payload = await updateProjectStructureRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    getProjectById: (projectId) => projects.find((project) => project.projectNumber === projectId),
    getProjectPhases: (projectId) => phases.filter((phase) => phase.projectId === projectId),
    getProjectAssignments: (projectId) =>
      assignments.filter((assignment) => assignment.projectId === projectId),
    getProjectEvents: (projectId) => events.filter((event) => event.projectId === projectId),
    getMemberById: (memberId) => members.find((member) => member.id === memberId),
  }

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>
}
