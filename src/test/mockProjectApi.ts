import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import { assignments, members, phases, projects } from '../data/mockData'
import type { CreateProjectInput } from '../types/project'

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
