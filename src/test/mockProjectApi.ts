import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import { assignments, members, phases, projects } from '../data/mockData'

const fixtureData = {
  projects,
  phases,
  members,
  assignments,
}

export function mockProjectApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()

    if (requestUrl.endsWith('/api/projects')) {
      return new Response(JSON.stringify(buildProjectListResponse(fixtureData)), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const detailMatch = requestUrl.match(/\/api\/projects\/([^/]+)$/)
    if (detailMatch) {
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
