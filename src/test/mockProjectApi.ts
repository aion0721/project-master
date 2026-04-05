import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import { assignments, events, members, phases, projects } from '../data/mockData'
import type {
  CreateMemberInput,
  CreateProjectInput,
  Phase,
  Project,
  ProjectEvent,
  UpdateProjectEventsInput,
  UpdateMemberInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectStructureInput,
} from '../types/project'

function cloneFixtures() {
  return {
    projects: projects.map((project) => ({
      ...project,
      projectLinks: project.projectLinks.map((link) => ({ ...link })),
    })),
    phases: phases.map((phase) => ({ ...phase })),
    events: events.map((event) => ({ ...event })),
    members: members.map((member) => ({
      ...member,
      bookmarkedProjectIds: [...member.bookmarkedProjectIds],
    })),
    assignments: assignments.map((assignment) => ({ ...assignment })),
  }
}

type FixtureData = ReturnType<typeof cloneFixtures>

const phaseTemplates = phases
  .filter((phase) => phase.projectId === 'PRJ-001')
  .map(({ name, startWeek, endWeek }) => ({
    name,
    startWeek,
    endWeek,
  }))

const statusLabelByCode = {
  not_started: projects.find((project) => project.projectNumber === 'PRJ-004')!.status,
  in_progress: projects.find((project) => project.projectNumber === 'PRJ-001')!.status,
  completed: projects.find((project) => project.projectNumber === 'PRJ-003')!.status,
  delayed: projects.find((project) => project.projectNumber === 'PRJ-002')!.status,
} as const

function createAssignmentIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`as-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `as-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function createPhaseIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`ph-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `ph-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function createEventIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`ev-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `ev-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function buildProjectKey(projectNumber: string) {
  return projectNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function deriveProjectStatus(projectPhases: Array<{ status: string }>) {
  if (projectPhases.some((phase) => phase.status === statusLabelByCode.delayed)) {
    return statusLabelByCode.delayed
  }

  if (projectPhases.every((phase) => phase.status === statusLabelByCode.completed)) {
    return statusLabelByCode.completed
  }

  if (
    projectPhases.some(
      (phase) =>
        phase.status === statusLabelByCode.in_progress || phase.status === statusLabelByCode.completed,
    )
  ) {
    return statusLabelByCode.in_progress
  }

  return statusLabelByCode.not_started
}

function getOrderedProjectPhases(fixtureData: FixtureData, projectNumber: string) {
  return fixtureData.phases.filter((phase) => phase.projectId === projectNumber)
}

function updateProjectStatus(fixtureData: FixtureData, projectNumber: string) {
  const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

  if (!project) {
    return null
  }

  project.status = deriveProjectStatus(
    getOrderedProjectPhases(fixtureData, projectNumber),
  ) as Project['status']
  return project
}

function updateCurrentPhaseState(fixtureData: FixtureData, projectNumber: string, phaseId: string) {
  const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

  if (!project) {
    return null
  }

  const projectPhases = getOrderedProjectPhases(fixtureData, projectNumber)
  const targetIndex = projectPhases.findIndex((phase) => phase.id === phaseId)

  if (targetIndex === -1) {
    return null
  }

  projectPhases.forEach((phase, index) => {
    if (index < targetIndex) {
      phase.status = statusLabelByCode.completed as Phase['status']
      phase.progress = 100
      return
    }

    if (index === targetIndex) {
      phase.status = statusLabelByCode.in_progress as Phase['status']
      phase.progress = phase.progress === 100 ? 80 : phase.progress
      return
    }

    phase.status = statusLabelByCode.not_started as Phase['status']
    phase.progress = 0
  })

  updateProjectStatus(fixtureData, projectNumber)
  return buildProjectDetailResponse(fixtureData, projectNumber)
}

function buildJsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function mockProjectApi() {
  const fixtureData = cloneFixtures()

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    const method = init?.method ?? 'GET'

    if (requestUrl.endsWith('/api/members') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.members }, 200)
    }

    if (requestUrl.endsWith('/api/members') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as CreateMemberInput

      if (!body.id.trim() || !body.name.trim() || !body.role.trim()) {
        return buildJsonResponse({ message: 'Missing required member fields' }, 400)
      }

      if (fixtureData.members.some((member) => member.id === body.id.trim())) {
        return buildJsonResponse({ message: 'Member ID already exists' }, 400)
      }

      if (
        body.managerId &&
        !fixtureData.members.some((member) => member.id === body.managerId)
      ) {
        return buildJsonResponse({ message: 'Manager not found' }, 400)
      }

      const member = {
        id: body.id.trim(),
        name: body.name.trim(),
        role: body.role.trim(),
        managerId: body.managerId ?? null,
        bookmarkedProjectIds: [],
      }

      fixtureData.members.push(member)
      return buildJsonResponse({ member }, 201)
    }

    if (requestUrl.endsWith('/api/members/login') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { memberKey: string }
      const normalizedMemberKey = body.memberKey.trim().toLocaleLowerCase()
      const user = fixtureData.members.find(
        (member) =>
          member.id.toLocaleLowerCase() === normalizedMemberKey ||
          member.name.toLocaleLowerCase() === normalizedMemberKey,
      )

      return new Response(JSON.stringify(user ? { user } : { message: 'Member not found' }), {
        status: user ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const getUserMatch = requestUrl.match(/\/api\/members\/([^/]+)$/)
    if (getUserMatch && method === 'GET') {
      const user = fixtureData.members.find((item) => item.id === getUserMatch[1])

      return new Response(JSON.stringify({ user }), {
        status: user ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const bookmarkMatch = requestUrl.match(/\/api\/members\/([^/]+)\/bookmarks$/)
    if (bookmarkMatch && method === 'PATCH') {
      const user = fixtureData.members.find((item) => item.id === bookmarkMatch[1])

      if (!user) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const body = JSON.parse(String(init?.body)) as { projectId: string }
      user.bookmarkedProjectIds = user.bookmarkedProjectIds.includes(body.projectId)
        ? user.bookmarkedProjectIds.filter((id) => id !== body.projectId)
        : [...user.bookmarkedProjectIds, body.projectId]

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (requestUrl.endsWith('/api/projects') && method === 'GET') {
      return new Response(JSON.stringify(buildProjectListResponse(fixtureData)), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (requestUrl.endsWith('/api/projects') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as Omit<CreateProjectInput, 'status'> & {
        status: keyof typeof statusLabelByCode
      }

      const project = {
        projectNumber: body.projectNumber,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: statusLabelByCode[body.status],
        pmMemberId: body.pmMemberId,
        projectLinks: body.projectLinks ?? [],
      }

      fixtureData.projects.push(project)
      const projectKey = buildProjectKey(body.projectNumber)

      fixtureData.assignments.push({
        id: `as-${projectKey}-1`,
        projectId: body.projectNumber,
        memberId: body.pmMemberId,
        responsibility: 'PM',
        reportsToMemberId: null,
      })

      phaseTemplates.forEach((phase, index) => {
        fixtureData.phases.push({
          id: `ph-${projectKey}-${index + 1}`,
          projectId: body.projectNumber,
          name: phase.name,
          startWeek: phase.startWeek,
          endWeek: phase.endWeek,
          status: statusLabelByCode.not_started,
          progress: 0,
          assigneeMemberId: body.pmMemberId,
        })
      })

      const detail = buildProjectDetailResponse(fixtureData, body.projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const currentPhaseMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/current-phase$/)
    if (currentPhaseMatch && method === 'PATCH') {
      const projectNumber = currentPhaseMatch[1]
      const body = JSON.parse(String(init?.body)) as { phaseId: string }
      const detail = updateCurrentPhaseState(fixtureData, projectNumber, body.phaseId)

      return new Response(JSON.stringify(detail ?? { message: 'Project or phase not found' }), {
        status: detail ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const scheduleMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/schedule$/)
    if (scheduleMatch && method === 'PATCH') {
      const projectNumber = scheduleMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectScheduleInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      if (body.startDate > body.endDate) {
        return new Response(JSON.stringify({ message: 'Invalid schedule' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.startDate = body.startDate
      project.endDate = body.endDate

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const linksMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/links$/)
    if (linksMatch && method === 'PATCH') {
      const projectNumber = linksMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectLinksInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.projectLinks = body.projectLinks.map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }))

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const eventsMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/events$/)
    if (eventsMatch && method === 'PATCH') {
      const projectNumber = eventsMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectEventsInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const nextEventId = createEventIdGenerator(projectNumber, fixtureData.events.map((event) => event.id))
      const nextEvents: ProjectEvent[] = body.events.map((event) => ({
        id: event.id ?? nextEventId(),
        projectId: projectNumber,
        name: event.name.trim(),
        week: event.week,
        status: event.status,
        ownerMemberId: event.ownerMemberId ?? null,
        note: event.note?.trim() || null,
      }))

      fixtureData.events = fixtureData.events
        .filter((event) => event.projectId !== projectNumber)
        .concat(nextEvents)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const phasesMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/phases$/)
    if (phasesMatch && method === 'PATCH') {
      const projectNumber = phasesMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectPhasesInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const nextPhaseId = createPhaseIdGenerator(projectNumber, fixtureData.phases.map((phase) => phase.id))
      const nextPhases = body.phases.map((phase) => ({
        id: phase.id ?? nextPhaseId(),
        projectId: projectNumber,
        name: phase.name,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        status: phase.status,
        progress: phase.progress,
        assigneeMemberId: project.pmMemberId,
      }))

      fixtureData.phases = fixtureData.phases
        .filter((phase) => phase.projectId !== projectNumber)
        .concat(nextPhases)

      updateProjectStatus(fixtureData, projectNumber)
      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const structureMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/structure$/)
    if (structureMatch && method === 'PATCH') {
      const projectNumber = structureMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectStructureInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.pmMemberId = body.pmMemberId

      const currentProjectAssignments = fixtureData.assignments.filter(
        (assignment) => assignment.projectId === projectNumber,
      )
      const existingIds = currentProjectAssignments.map((assignment) => assignment.id)

      const nextAssignmentId = createAssignmentIdGenerator(buildProjectKey(projectNumber), existingIds)
      const nextAssignments = [
        {
          id:
            currentProjectAssignments.find((assignment) => assignment.responsibility === 'PM')?.id ??
            nextAssignmentId(),
          projectId: projectNumber,
          memberId: body.pmMemberId,
          responsibility: 'PM',
          reportsToMemberId: null,
        },
        ...body.assignments.map((assignment) => ({
          id: assignment.id ?? nextAssignmentId(),
          projectId: projectNumber,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
          reportsToMemberId: assignment.reportsToMemberId ?? null,
        })),
      ]

      fixtureData.assignments = fixtureData.assignments
        .filter((assignment) => assignment.projectId !== projectNumber)
        .concat(nextAssignments)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const phaseMatch = requestUrl.match(/\/api\/phases\/([^/]+)$/)
    if (phaseMatch && method === 'PATCH') {
      const phaseId = phaseMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdatePhaseInput
      const targetPhase = fixtureData.phases.find((phase) => phase.id === phaseId)

      if (!targetPhase) {
        return new Response(JSON.stringify({ message: 'Phase not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      targetPhase.startWeek = body.startWeek
      targetPhase.endWeek = body.endWeek
      targetPhase.status = body.status
      targetPhase.progress = body.progress

      const targetProject = updateProjectStatus(fixtureData, targetPhase.projectId)

      if (!targetProject) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      return new Response(JSON.stringify({ phase: targetPhase, project: targetProject }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const memberMatch = requestUrl.match(/\/api\/members\/([^/]+)$/)
    if (memberMatch && method === 'PATCH') {
      const memberId = memberMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateMemberInput
      const member = fixtureData.members.find((item) => item.id === memberId)

      if (!member) {
        return buildJsonResponse({ message: 'Member not found' }, 404)
      }

      if (!body.name.trim() || !body.role.trim()) {
        return buildJsonResponse({ message: 'Missing required member fields' }, 400)
      }

      if (body.managerId === memberId) {
        return buildJsonResponse({ message: 'Member cannot manage themselves' }, 400)
      }

      if (
        body.managerId &&
        !fixtureData.members.some((item) => item.id === body.managerId)
      ) {
        return buildJsonResponse({ message: 'Manager not found' }, 400)
      }

      member.name = body.name.trim()
      member.role = body.role.trim()
      member.managerId = body.managerId ?? null

      return buildJsonResponse({ member }, 200)
    }

    if (memberMatch && method === 'DELETE') {
      const memberId = memberMatch[1]
      const member = fixtureData.members.find((item) => item.id === memberId)

      if (!member) {
        return buildJsonResponse({ message: 'Member not found' }, 404)
      }

      if (fixtureData.projects.some((project) => project.pmMemberId === memberId)) {
        return buildJsonResponse({ message: 'PM assigned member cannot be deleted' }, 400)
      }

      if (fixtureData.assignments.some((assignment) => assignment.memberId === memberId)) {
        return buildJsonResponse({ message: 'Assigned member cannot be deleted' }, 400)
      }

      if (fixtureData.assignments.some((assignment) => assignment.reportsToMemberId === memberId)) {
        return buildJsonResponse({ message: 'Member is used in a project hierarchy' }, 400)
      }

      if (fixtureData.members.some((item) => item.managerId === memberId)) {
        return buildJsonResponse({ message: 'Manager with subordinates cannot be deleted' }, 400)
      }

      fixtureData.members = fixtureData.members.filter((item) => item.id !== memberId)
      return buildJsonResponse({ memberId }, 200)
    }

    const detailMatch = requestUrl.match(/\/api\/projects\/([^/]+)$/)
    if (detailMatch && method === 'GET') {
      const detail = buildProjectDetailResponse(fixtureData, detailMatch[1])

      return new Response(JSON.stringify(detail), {
        status: detail ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
