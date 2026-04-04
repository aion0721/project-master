import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import { assignments, members, phases, projects } from '../data/mockData'
import type {
  CreateProjectInput,
  Phase,
  Project,
  UpdatePhaseInput,
  UpdateProjectStructureInput,
} from '../types/project'
import type { UserProfile } from '../types/user'

function cloneFixtures() {
  return {
    projects: projects.map((project) => ({ ...project })),
    phases: phases.map((phase) => ({ ...phase })),
    members: members.map((member) => ({ ...member })),
    assignments: assignments.map((assignment) => ({ ...assignment })),
    users: [
      {
        id: 'u1',
        username: 'demo',
        bookmarkedProjectIds: ['p1', 'p5'],
      } satisfies UserProfile,
    ],
  }
}

type FixtureData = ReturnType<typeof cloneFixtures>

const phaseTemplates = phases
  .filter((phase) => phase.projectId === 'p1')
  .sort((left, right) => left.startWeek - right.startWeek)
  .map(({ name, startWeek, endWeek }) => ({
    name,
    startWeek,
    endWeek,
  }))

const statusLabelByCode = {
  not_started: projects.find((project) => project.id === 'p4')!.status,
  in_progress: projects.find((project) => project.id === 'p1')!.status,
  completed: projects.find((project) => project.id === 'p3')!.status,
  delayed: projects.find((project) => project.id === 'p2')!.status,
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

function getOrderedProjectPhases(fixtureData: FixtureData, projectId: string) {
  return fixtureData.phases
    .filter((phase) => phase.projectId === projectId)
    .sort((left, right) => left.startWeek - right.startWeek)
}

function updateProjectStatus(fixtureData: FixtureData, projectId: string) {
  const project = fixtureData.projects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  project.status = deriveProjectStatus(getOrderedProjectPhases(fixtureData, projectId)) as Project['status']
  return project
}

function updateCurrentPhaseState(fixtureData: FixtureData, projectId: string, phaseId: string) {
  const project = fixtureData.projects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  const projectPhases = getOrderedProjectPhases(fixtureData, projectId)
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

  updateProjectStatus(fixtureData, projectId)
  return buildProjectDetailResponse(fixtureData, projectId)
}

export function mockProjectApi() {
  const fixtureData = cloneFixtures()

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    const method = init?.method ?? 'GET'

    if (requestUrl.endsWith('/api/members') && method === 'GET') {
      return new Response(JSON.stringify({ items: fixtureData.members }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (requestUrl.endsWith('/api/users/login') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { username: string }
      const normalizedUsername = body.username.trim()
      const existingUser = fixtureData.users.find(
        (user) => user.username.toLocaleLowerCase() === normalizedUsername.toLocaleLowerCase(),
      )
      const user =
        existingUser ??
        ({
          id: `u${fixtureData.users.length + 1}`,
          username: normalizedUsername,
          bookmarkedProjectIds: [],
        } satisfies UserProfile)

      if (!existingUser) {
        fixtureData.users.push(user)
      }

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const getUserMatch = requestUrl.match(/\/api\/users\/([^/]+)$/)
    if (getUserMatch && method === 'GET') {
      const user = fixtureData.users.find((item) => item.id === getUserMatch[1])

      return new Response(JSON.stringify({ user }), {
        status: user ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const bookmarkMatch = requestUrl.match(/\/api\/users\/([^/]+)\/bookmarks$/)
    if (bookmarkMatch && method === 'PATCH') {
      const user = fixtureData.users.find((item) => item.id === bookmarkMatch[1])

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
      const nextProjectId = `p${fixtureData.projects.length + 1}`
      const project = {
        id: nextProjectId,
        ...body,
        status: statusLabelByCode[body.status],
      }

      fixtureData.projects.push(project)
      fixtureData.assignments.push({
        id: `as-${nextProjectId}-1`,
        projectId: nextProjectId,
        memberId: body.pmMemberId,
        responsibility: 'PM',
      })

      phaseTemplates.forEach((phase, index) => {
        fixtureData.phases.push({
          id: `ph-${nextProjectId}-${index + 1}`,
          projectId: nextProjectId,
          name: phase.name,
          startWeek: phase.startWeek,
          endWeek: phase.endWeek,
          status: statusLabelByCode.not_started,
          progress: 0,
          assigneeMemberId: body.pmMemberId,
        })
      })

      const detail = buildProjectDetailResponse(fixtureData, nextProjectId)

      return new Response(JSON.stringify(detail), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const currentPhaseMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/current-phase$/)
    if (currentPhaseMatch && method === 'PATCH') {
      const projectId = currentPhaseMatch[1]
      const body = JSON.parse(String(init?.body)) as { phaseId: string }
      const detail = updateCurrentPhaseState(fixtureData, projectId, body.phaseId)

      return new Response(JSON.stringify(detail ?? { message: 'Project or phase not found' }), {
        status: detail ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const structureMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/structure$/)
    if (structureMatch && method === 'PATCH') {
      const projectId = structureMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectStructureInput
      const project = fixtureData.projects.find((item) => item.id === projectId)

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
        (assignment) => assignment.projectId === projectId,
      )
      const existingIds = currentProjectAssignments.map((assignment) => assignment.id)

      const nextAssignmentId = createAssignmentIdGenerator(projectId, existingIds)
      const nextAssignments = [
        {
          id:
            currentProjectAssignments.find((assignment) => assignment.responsibility === 'PM')?.id ??
            nextAssignmentId(),
          projectId,
          memberId: body.pmMemberId,
          responsibility: 'PM',
        },
        ...body.assignments.map((assignment) => ({
          id: assignment.id ?? nextAssignmentId(),
          projectId,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
        })),
      ]

      fixtureData.assignments = fixtureData.assignments
        .filter((assignment) => assignment.projectId !== projectId)
        .concat(nextAssignments)

      const detail = buildProjectDetailResponse(fixtureData, projectId)

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
