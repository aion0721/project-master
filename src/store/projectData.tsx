import { useEffect, useState, type ReactNode } from 'react'
import {
  createMemberRequest,
  createProjectRequest,
  createSystemRelationRequest,
  createSystemTransactionRequest,
  createSystemRequest,
  deleteMemberRequest,
  deleteSystemRelationRequest,
  deleteSystemTransactionRequest,
  deleteSystemRequest,
  loadProjectData,
  updateMemberRequest,
  updatePhaseRequest,
  updateProjectCurrentPhaseRequest,
  updateProjectEventsRequest,
  updateProjectLinksRequest,
  updateProjectNoteRequest,
  updateProjectStatusEntriesRequest,
  updateProjectReportStatusRequest,
  updateProjectStatusOverrideRequest,
  updateProjectSystemsRequest,
  updateProjectPhasesRequest,
  updateProjectScheduleRequest,
  updateProjectSummaryRequest,
  updateProjectStructureRequest,
  updateSystemRelationRequest,
  updateSystemRequest,
  updateSystemStructureRequest,
  updateSystemTransactionRequest,
  type ProjectDataPayload,
} from '../api/projectApi'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSystemRelationInput,
  CreateSystemTransactionInput,
  CreateSystemInput,
  ManagedSystem,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectEvent,
  SystemAssignment,
  SystemRelation,
  SystemTransaction,
  SystemTransactionStep,
  UpdateMemberInput,
  UpdateProjectEventsInput,
  UpdateProjectNoteInput,
  UpdateProjectReportStatusInput,
  UpdateProjectStatusEntriesInput,
  UpdateProjectStatusOverrideInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectSystemsInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectSummaryInput,
  UpdateProjectStructureInput,
  UpdateSystemRelationInput,
  UpdateSystemStructureInput,
  UpdateSystemTransactionInput,
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

function replaceProjectsForRename(current: Project[], previousProjectId: string, incoming: Project[]) {
  const incomingIds = new Set(incoming.map((project) => project.projectNumber))

  return current
    .filter((project) => project.projectNumber !== previousProjectId && !incomingIds.has(project.projectNumber))
    .concat(incoming)
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

function getFirstProjectOrThrow(projects: Project[], message: string) {
  const project = projects[0]

  if (!project) {
    throw new Error(message)
  }

  return project
}

type CollectionMergeMode = 'merge' | 'replaceByProject'

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [events, setEvents] = useState<ProjectEvent[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [systems, setSystems] = useState<ManagedSystem[]>([])
  const [systemRelations, setSystemRelations] = useState<SystemRelation[]>([])
  const [systemTransactions, setSystemTransactions] = useState<SystemTransaction[]>([])
  const [systemTransactionSteps, setSystemTransactionSteps] = useState<SystemTransactionStep[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [systemAssignments, setSystemAssignments] = useState<SystemAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const applyProjectPayload = (
    projectId: string,
    payload: ProjectDataPayload,
    options?: {
      phaseMode?: CollectionMergeMode
      eventMode?: CollectionMergeMode
      assignmentMode?: CollectionMergeMode
    },
  ) => {
    const phaseMode = options?.phaseMode ?? 'merge'
    const eventMode = options?.eventMode ?? 'replaceByProject'
    const assignmentMode = options?.assignmentMode ?? 'replaceByProject'
    const payloadProject = payload.projects[0]
    const nextProjectId = payloadProject?.projectNumber ?? projectId

    setProjects((current) => {
      if (projectId !== nextProjectId) {
        return replaceProjectsForRename(current, projectId, payload.projects)
      }

      return mergeByKey(current, payload.projects, (item) => item.projectNumber)
    })

    if (phaseMode === 'replaceByProject') {
      setPhases((current) => current.filter((phase) => phase.projectId !== projectId).concat(payload.phases))
    } else {
      setPhases((current) => mergeByKey(current, payload.phases, (item) => item.id))
    }

    if (eventMode === 'replaceByProject') {
      setEvents((current) => replaceEventsForProject(current, projectId, payload.events))
    } else {
      setEvents((current) => mergeByKey(current, payload.events, (item) => item.id))
    }

    setMembers((current) => mergeByKey(current, payload.members, (item) => item.id))
    setSystems((current) => mergeByKey(current, payload.systems, (item) => item.id))
    setSystemRelations((current) => mergeByKey(current, payload.systemRelations, (item) => item.id))
    setSystemTransactions((current) => mergeByKey(current, payload.systemTransactions, (item) => item.id))
    setSystemTransactionSteps((current) =>
      mergeByKey(current, payload.systemTransactionSteps, (item) => item.id),
    )

    if (assignmentMode === 'replaceByProject') {
      setAssignments((current) => replaceAssignmentsForProject(current, projectId, payload.assignments))
    } else {
      setAssignments((current) => mergeByKey(current, payload.assignments, (item) => item.id))
    }
  }

  const applyAndGetUpdatedProject = (
    projectId: string,
    payload: ProjectDataPayload,
    options?: {
      phaseMode?: CollectionMergeMode
      eventMode?: CollectionMergeMode
      assignmentMode?: CollectionMergeMode
    },
  ) => {
    const updatedProject = getFirstProjectOrThrow(payload.projects, 'Updated project payload is empty')
    applyProjectPayload(projectId, payload, options)
    return updatedProject
  }

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
        setSystemTransactions(payload.systemTransactions)
        setSystemTransactionSteps(payload.systemTransactionSteps)
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
    systemTransactions,
    systemTransactionSteps,
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
      const createdProject = getFirstProjectOrThrow(payload.projects, 'Created project payload is empty')

      applyProjectPayload(createdProject.projectNumber, payload, {
        eventMode: 'merge',
        assignmentMode: 'merge',
      })

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
    createSystemTransaction: async (input: CreateSystemTransactionInput) => {
      const payload = await createSystemTransactionRequest(input)
      setSystemTransactions((current) =>
        mergeByKey(current, [payload.transaction], (item) => item.id),
      )
      setSystemTransactionSteps((current) =>
        mergeByKey(current, payload.steps, (item) => item.id),
      )
      return payload
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
    updateSystemRelation: async (relationId: string, input: UpdateSystemRelationInput) => {
      const relation = await updateSystemRelationRequest(relationId, input)
      setSystemRelations((current) => mergeByKey(current, [relation], (item) => item.id))
      return relation
    },
    updateSystemStructure: async (systemId: string, input: UpdateSystemStructureInput) => {
      const payload = await updateSystemStructureRequest(systemId, input)
      setSystems((current) => mergeByKey(current, [payload.system], (item) => item.id))
      setSystemAssignments((current) =>
        current.filter((assignment) => assignment.systemId !== systemId).concat(payload.assignments),
      )
      return payload
    },
    updateSystemTransaction: async (transactionId: string, input: UpdateSystemTransactionInput) => {
      const payload = await updateSystemTransactionRequest(transactionId, input)
      setSystemTransactions((current) =>
        mergeByKey(current, [payload.transaction], (item) => item.id),
      )
      setSystemTransactionSteps((current) =>
        current.filter((step) => step.transactionId !== transactionId).concat(payload.steps),
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
    deleteSystemTransaction: async (transactionId: string) => {
      await deleteSystemTransactionRequest(transactionId)
      setSystemTransactions((current) =>
        current.filter((transaction) => transaction.id !== transactionId),
      )
      setSystemTransactionSteps((current) =>
        current.filter((step) => step.transactionId !== transactionId),
      )
    },
    updatePhase: async (phaseId: string, input: UpdatePhaseInput) => {
      const payload = await updatePhaseRequest(phaseId, input)
      setPhases((current) => mergeByKey(current, [payload.phase], (item) => item.id))
      setProjects((current) => mergeByKey(current, [payload.project], (item) => item.projectNumber))
      return payload.phase
    },
    updateProjectSummary: async (projectId: string, input: UpdateProjectSummaryInput) => {
      const payload = await updateProjectSummaryRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload, {
        phaseMode: 'replaceByProject',
        eventMode: 'replaceByProject',
        assignmentMode: 'replaceByProject',
      })
    },
    updateProjectSchedule: async (projectId: string, input: UpdateProjectScheduleInput) => {
      const payload = await updateProjectScheduleRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectLinks: async (projectId: string, input: UpdateProjectLinksInput) => {
      const payload = await updateProjectLinksRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectNote: async (projectId: string, input: UpdateProjectNoteInput) => {
      const payload = await updateProjectNoteRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectStatusEntries: async (
      projectId: string,
      input: UpdateProjectStatusEntriesInput,
    ) => {
      const payload = await updateProjectStatusEntriesRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectReportStatus: async (projectId: string, input: UpdateProjectReportStatusInput) => {
      const payload = await updateProjectReportStatusRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectStatusOverride: async (
      projectId: string,
      input: UpdateProjectStatusOverrideInput,
    ) => {
      const payload = await updateProjectStatusOverrideRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectSystems: async (projectId: string, input: UpdateProjectSystemsInput) => {
      const payload = await updateProjectSystemsRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectEvents: async (projectId: string, input: UpdateProjectEventsInput) => {
      const payload = await updateProjectEventsRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectPhases: async (projectId: string, input: UpdateProjectPhasesInput) => {
      const payload = await updateProjectPhasesRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload, { phaseMode: 'replaceByProject' })
    },
    updateProjectCurrentPhase: async (projectId: string, phaseId: string) => {
      const payload = await updateProjectCurrentPhaseRequest(projectId, phaseId)
      return applyAndGetUpdatedProject(projectId, payload)
    },
    updateProjectStructure: async (projectId: string, input: UpdateProjectStructureInput) => {
      const payload = await updateProjectStructureRequest(projectId, input)
      return applyAndGetUpdatedProject(projectId, payload)
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
