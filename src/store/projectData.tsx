import { useEffect, useState, type ReactNode } from 'react'
import {
  createMemberRequest,
  createProjectRequest,
  createSystemRelationRequest,
  createSystemRequest,
  deleteMemberRequest,
  deleteSystemRelationRequest,
  deleteSystemRequest,
  loadProjectData,
  updateMemberRequest,
  updatePhaseRequest,
  updateProjectCurrentPhaseRequest,
  updateProjectEventsRequest,
  updateProjectLinksRequest,
  updateProjectNoteRequest,
  updateProjectReportStatusRequest,
  updateProjectSystemsRequest,
  updateProjectPhasesRequest,
  updateProjectScheduleRequest,
  updateProjectStructureRequest,
  updateSystemRequest,
  updateSystemStructureRequest,
} from '../api/projectApi'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSystemRelationInput,
  CreateSystemInput,
  ManagedSystem,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectEvent,
  SystemAssignment,
  SystemRelation,
  UpdateMemberInput,
  UpdateProjectEventsInput,
  UpdateProjectNoteInput,
  UpdateProjectReportStatusInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectSystemsInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectStructureInput,
  UpdateSystemStructureInput,
  UpdateSystemInput,
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
  const [systems, setSystems] = useState<ManagedSystem[]>([])
  const [systemRelations, setSystemRelations] = useState<SystemRelation[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [systemAssignments, setSystemAssignments] = useState<SystemAssignment[]>([])
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
        setSystems(payload.systems)
        setSystemRelations(payload.systemRelations)
        setAssignments(payload.assignments)
        setSystemAssignments(payload.systemAssignments)
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
    systems,
    systemRelations,
    assignments,
    systemAssignments,
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
      setAssignments((current) => mergeByKey(current, payload.assignments, (item) => item.id))

      return createdProject
    },
    createSystem: async (input: CreateSystemInput) => {
      const system = await createSystemRequest(input)
      setSystems((current) => mergeByKey(current, [system], (item) => item.id))
      const ownerMemberId = system.ownerMemberId ?? null
      if (ownerMemberId) {
        setSystemAssignments((current) => [
          ...current,
          {
            id: `sys-as-${system.id}-1`,
            systemId: system.id,
            memberId: ownerMemberId,
            responsibility: 'オーナー',
            reportsToMemberId: null,
          },
        ])
      }
      return system
    },
    createSystemRelation: async (input: CreateSystemRelationInput) => {
      const relation = await createSystemRelationRequest(input)
      setSystemRelations((current) => mergeByKey(current, [relation], (item) => item.id))
      return relation
    },
    updateMember: async (memberId: string, input: UpdateMemberInput) => {
      const member = await updateMemberRequest(memberId, input)
      setMembers((current) => mergeByKey(current, [member], (item) => item.id))
      return member
    },
    updateSystem: async (systemId: string, input: UpdateSystemInput) => {
      const system = await updateSystemRequest(systemId, input)
      setSystems((current) => mergeByKey(current, [system], (item) => item.id))
      return system
    },
    updateSystemStructure: async (systemId: string, input: UpdateSystemStructureInput) => {
      const payload = await updateSystemStructureRequest(systemId, input)
      setSystems((current) => mergeByKey(current, [payload.system], (item) => item.id))
      setSystemAssignments((current) =>
        current.filter((assignment) => assignment.systemId !== systemId).concat(payload.assignments),
      )
      return payload
    },
    deleteMember: async (memberId: string) => {
      await deleteMemberRequest(memberId)
      setMembers((current) => current.filter((member) => member.id !== memberId))
    },
    deleteSystem: async (systemId: string) => {
      await deleteSystemRequest(systemId)
      setSystems((current) => current.filter((system) => system.id !== systemId))
      setSystemAssignments((current) =>
        current.filter((assignment) => assignment.systemId !== systemId),
      )
    },
    deleteSystemRelation: async (relationId: string) => {
      await deleteSystemRelationRequest(relationId)
      setSystemRelations((current) => current.filter((relation) => relation.id !== relationId))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectNote: async (projectId: string, input: UpdateProjectNoteInput) => {
      const payload = await updateProjectNoteRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectReportStatus: async (projectId: string, input: UpdateProjectReportStatusInput) => {
      const payload = await updateProjectReportStatusRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    updateProjectSystems: async (projectId: string, input: UpdateProjectSystemsInput) => {
      const payload = await updateProjectSystemsRequest(projectId, input)
      const updatedProject = payload.projects[0]

      if (!updatedProject) {
        throw new Error('Updated project payload is empty')
      }

      setProjects((current) => mergeByKey(current, payload.projects, (item) => item.projectNumber))
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
      setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
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
      setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
      setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))

      return updatedProject
    },
    getProjectById: (projectId) => projects.find((project) => project.projectNumber === projectId),
    getProjectPhases: (projectId) => phases.filter((phase) => phase.projectId === projectId),
    getProjectAssignments: (projectId) =>
      assignments.filter((assignment) => assignment.projectId === projectId),
    getProjectEvents: (projectId) => events.filter((event) => event.projectId === projectId),
    getMemberById: (memberId) => members.find((member) => member.id === memberId),
    getSystemById: (systemId) => systems.find((system) => system.id === systemId),
    getSystemAssignments: (systemId) =>
      systemAssignments.filter((assignment) => assignment.systemId === systemId),
  }

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>
}
