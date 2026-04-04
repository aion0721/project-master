import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import { assignments, members, phases, projects } from '../data/mockData'
import type {
  CreateProjectInput,
  UpdatePhaseInput,
  UpdateProjectStructureInput,
} from '../types/project'

function cloneFixtures() {
  return {
    projects: projects.map((project) => ({ ...project })),
    phases: phases.map((phase) => ({ ...phase })),
    members: members.map((member) => ({ ...member })),
    assignments: assignments.map((assignment) => ({ ...assignment })),
  }
}

const phaseTemplates = [
  { name: '基礎検討', startWeek: 1, endWeek: 2 },
  { name: '基本設計', startWeek: 3, endWeek: 5 },
  { name: '詳細設計', startWeek: 6, endWeek: 8 },
  { name: 'テスト', startWeek: 9, endWeek: 11 },
  { name: '移行', startWeek: 12, endWeek: 13 },
] as const

const statusLabelByCode = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  delayed: '遅延',
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
  if (projectPhases.some((phase) => phase.status === '遅延')) {
    return '遅延'
  }

  if (projectPhases.every((phase) => phase.status === '完了')) {
    return '完了'
  }

  if (projectPhases.some((phase) => phase.status === '進行中' || phase.status === '完了')) {
    return '進行中'
  }

  return '未着手'
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
          status: '未着手',
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

      const targetProject = fixtureData.projects.find((project) => project.id === targetPhase.projectId)

      if (!targetProject) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      targetProject.status = deriveProjectStatus(
        fixtureData.phases.filter((phase) => phase.projectId === targetProject.id),
      ) as typeof targetProject.status

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
