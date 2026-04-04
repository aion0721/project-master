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
import { getPhaseActualRange, getProjectCurrentPhase, getProjectPm } from '../utils/projectUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

const statusCodeMap = {
  未着手: 'not_started',
  進行中: 'in_progress',
  完了: 'completed',
  遅延: 'delayed',
} as const

interface ApiMember extends Member {
  managerName?: string | null
}

interface ApiProjectListItem extends Project {
  currentPhase: string | null
  pm: ApiMember | null
}

interface ApiProjectListResponse {
  items: ApiProjectListItem[]
}

interface ApiMemberListResponse {
  items: ApiMember[]
}

interface ApiProjectDetailResponse {
  project: Project & {
    pm: ApiMember | null
  }
  phases: Array<
    Phase & {
      range: {
        startDate: string
        endDate: string
      }
    }
  >
  assignments: Array<
    ProjectAssignment & {
      member: ApiMember | null
    }
  >
  events: ProjectEvent[]
  members: ApiMember[]
}

interface ApiPhaseUpdateResponse {
  phase: Phase
  project: Project
}

export interface ProjectDataPayload {
  projects: Project[]
  phases: Phase[]
  events: ProjectEvent[]
  members: Member[]
  assignments: ProjectAssignment[]
}

export interface PhaseUpdatePayload {
  phase: Phase
  project: Project
}

function normalizeMember(member: ApiMember | null | undefined): Member | null {
  if (!member) {
    return null
  }

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    managerId: member.managerId,
  }
}

function normalizeProject(project: Project): Project {
  return {
    projectNumber: project.projectNumber,
    name: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
    pmMemberId: project.pmMemberId,
    projectLinks: (project.projectLinks ?? []).map((link) => ({
      label: link.label,
      url: link.url,
    })),
  }
}

function normalizePhase(phase: Phase): Phase {
  return {
    id: phase.id,
    projectId: phase.projectId,
    name: phase.name,
    startWeek: phase.startWeek,
    endWeek: phase.endWeek,
    status: phase.status,
    progress: phase.progress,
    assigneeMemberId: phase.assigneeMemberId,
  }
}

function normalizeAssignment(assignment: ProjectAssignment): ProjectAssignment {
  return {
    id: assignment.id,
    projectId: assignment.projectId,
    memberId: assignment.memberId,
    responsibility: assignment.responsibility,
    reportsToMemberId: assignment.reportsToMemberId ?? null,
  }
}

function normalizeEvent(event: ProjectEvent): ProjectEvent {
  return {
    id: event.id,
    projectId: event.projectId,
    name: event.name,
    week: event.week,
    status: event.status,
    ownerMemberId: event.ownerMemberId ?? null,
    note: event.note ?? null,
  }
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

async function sendJson<TResponse, TRequest>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: TRequest,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return (await response.json()) as TResponse
}

function normalizeProjectDetail(detail: ApiProjectDetailResponse): ProjectDataPayload {
  const memberMap = new Map<string, Member>()

  detail.members.forEach((member) => {
    const normalized = normalizeMember(member)
    if (normalized) {
      memberMap.set(normalized.id, normalized)
    }
  })

  detail.assignments.forEach((assignment) => {
    const member = normalizeMember(assignment.member)
    if (member) {
      memberMap.set(member.id, member)
    }
  })

  const pm = normalizeMember(detail.project.pm)
  if (pm) {
    memberMap.set(pm.id, pm)
  }

  return {
    projects: [normalizeProject(detail.project)],
    phases: detail.phases.map(normalizePhase),
    events: detail.events.map(normalizeEvent),
    assignments: detail.assignments.map(normalizeAssignment),
    members: [...memberMap.values()],
  }
}

export async function loadProjectData(signal?: AbortSignal): Promise<ProjectDataPayload> {
  const [listResponse, memberResponse] = await Promise.all([
    fetchJson<ApiProjectListResponse>('/api/projects', signal),
    fetchJson<ApiMemberListResponse>('/api/members', signal),
  ])

  const detailResponses = await Promise.all(
    listResponse.items.map((project) =>
      fetchJson<ApiProjectDetailResponse>(`/api/projects/${project.projectNumber}`, signal),
    ),
  )

  const memberMap = new Map(
    memberResponse.items
      .map((member) => normalizeMember(member))
      .filter((member): member is Member => member !== null)
      .map((member) => [member.id, member] as const),
  )
  const phaseMap = new Map<string, Phase>()
  const eventMap = new Map<string, ProjectEvent>()
  const assignmentMap = new Map<string, ProjectAssignment>()

  detailResponses.forEach((detail) => {
    detail.members.forEach((member) => {
      const normalized = normalizeMember(member)
      if (normalized) {
        memberMap.set(normalized.id, normalized)
      }
    })

    detail.phases.forEach((phase) => {
      phaseMap.set(phase.id, normalizePhase(phase))
    })

    detail.events.forEach((event) => {
      eventMap.set(event.id, normalizeEvent(event))
    })

    detail.assignments.forEach((assignment) => {
      assignmentMap.set(assignment.id, normalizeAssignment(assignment))

      const member = normalizeMember(assignment.member)
      if (member) {
        memberMap.set(member.id, member)
      }
    })

    const pm = normalizeMember(detail.project.pm)
    if (pm) {
      memberMap.set(pm.id, pm)
    }
  })

  return {
    projects: listResponse.items.map(normalizeProject),
    phases: [...phaseMap.values()],
    events: [...eventMap.values()],
    members: [...memberMap.values()],
    assignments: [...assignmentMap.values()],
  }
}

export async function createProjectRequest(
  input: CreateProjectInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<
    ApiProjectDetailResponse,
    Omit<CreateProjectInput, 'status'> & {
      status: (typeof statusCodeMap)[keyof typeof statusCodeMap]
    }
  >(
    '/api/projects',
    'POST',
    {
      ...input,
      status: statusCodeMap[input.status],
    },
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function createMemberRequest(
  input: CreateMemberInput,
  signal?: AbortSignal,
): Promise<Member> {
  const response = await sendJson<{ member: ApiMember }, CreateMemberInput>(
    '/api/members',
    'POST',
    input,
    signal,
  )

  const member = normalizeMember(response.member)

  if (!member) {
    throw new Error('Created member payload is empty')
  }

  return member
}

export async function updateMemberRequest(
  memberId: string,
  input: UpdateMemberInput,
  signal?: AbortSignal,
): Promise<Member> {
  const response = await sendJson<{ member: ApiMember }, UpdateMemberInput>(
    `/api/members/${memberId}`,
    'PATCH',
    input,
    signal,
  )

  const member = normalizeMember(response.member)

  if (!member) {
    throw new Error('Updated member payload is empty')
  }

  return member
}

export async function deleteMemberRequest(
  memberId: string,
  signal?: AbortSignal,
): Promise<{ memberId: string }> {
  return sendJson<{ memberId: string }, Record<string, never>>(
    `/api/members/${memberId}`,
    'DELETE',
    {},
    signal,
  )
}

export async function updatePhaseRequest(
  phaseId: string,
  input: UpdatePhaseInput,
  signal?: AbortSignal,
): Promise<PhaseUpdatePayload> {
  const response = await sendJson<ApiPhaseUpdateResponse, UpdatePhaseInput>(
    `/api/phases/${phaseId}`,
    'PATCH',
    input,
    signal,
  )

  return {
    phase: normalizePhase(response.phase),
    project: normalizeProject(response.project),
  }
}

export async function updateProjectStructureRequest(
  projectId: string,
  input: UpdateProjectStructureInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, UpdateProjectStructureInput>(
    `/api/projects/${projectId}/structure`,
    'PATCH',
    input,
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function updateProjectCurrentPhaseRequest(
  projectId: string,
  phaseId: string,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, { phaseId: string }>(
    `/api/projects/${projectId}/current-phase`,
    'PATCH',
    { phaseId },
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function updateProjectScheduleRequest(
  projectId: string,
  input: UpdateProjectScheduleInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, UpdateProjectScheduleInput>(
    `/api/projects/${projectId}/schedule`,
    'PATCH',
    input,
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function updateProjectLinksRequest(
  projectId: string,
  input: UpdateProjectLinksInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, UpdateProjectLinksInput>(
    `/api/projects/${projectId}/links`,
    'PATCH',
    input,
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function updateProjectEventsRequest(
  projectId: string,
  input: UpdateProjectEventsInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, UpdateProjectEventsInput>(
    `/api/projects/${projectId}/events`,
    'PATCH',
    input,
    signal,
  )

  return normalizeProjectDetail(detail)
}

export async function updateProjectPhasesRequest(
  projectId: string,
  input: UpdateProjectPhasesInput,
  signal?: AbortSignal,
): Promise<ProjectDataPayload> {
  const detail = await sendJson<ApiProjectDetailResponse, UpdateProjectPhasesInput>(
    `/api/projects/${projectId}/phases`,
    'PATCH',
    input,
    signal,
  )

  return normalizeProjectDetail(detail)
}

export function buildProjectListResponse(data: ProjectDataPayload) {
  return {
    items: data.projects.map((project) => {
      const projectPhases = data.phases.filter((phase) => phase.projectId === project.projectNumber)
      const currentPhase = getProjectCurrentPhase(projectPhases)
      const pm = getProjectPm(project, data.members)

      return {
        ...project,
        currentPhase: currentPhase?.name ?? null,
        pm: pm ?? null,
      }
    }),
  }
}

export function buildProjectDetailResponse(
  data: ProjectDataPayload,
  projectId: string,
): ApiProjectDetailResponse | null {
  const project = data.projects.find((item) => item.projectNumber === projectId)

  if (!project) {
    return null
  }

  const projectPhases = data.phases.filter((phase) => phase.projectId === project.projectNumber)
  const projectAssignments = data.assignments.filter(
    (assignment) => assignment.projectId === project.projectNumber,
  )
  const projectEvents = data.events.filter((event) => event.projectId === project.projectNumber)
  const memberIds = new Set([
    project.pmMemberId,
    ...projectAssignments.map((assignment) => assignment.memberId),
    ...projectAssignments
      .map((assignment) => assignment.reportsToMemberId)
      .filter((memberId): memberId is string => Boolean(memberId)),
    ...projectEvents
      .map((event) => event.ownerMemberId)
      .filter((memberId): memberId is string => Boolean(memberId)),
  ])

  return {
    project: {
      ...project,
      pm: getProjectPm(project, data.members) ?? null,
    },
    phases: projectPhases.map((phase) => ({
      ...phase,
      range: getPhaseActualRange(project, phase),
    })),
    events: projectEvents.map((event) => ({
      ...event,
    })),
    assignments: projectAssignments.map((assignment) => ({
      ...assignment,
      member: data.members.find((member) => member.id === assignment.memberId) ?? null,
    })),
    members: data.members.filter((member) => memberIds.has(member.id)),
  }
}
