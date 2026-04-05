import { fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectCreatePage } from './ProjectCreatePage'

describe('ProjectCreatePage', () => {
  it('案件追加フォームを送信して登録 API を呼び出す', async () => {
    const fetchMock = mockProjectApi()

    const { container } = renderWithProviders(<ProjectCreatePage />, {
      initialEntries: ['/projects/new'],
      routePath: '*',
    })

    await waitFor(() => {
      expect(container.querySelectorAll('input')).toHaveLength(6)
      expect(container.querySelectorAll('select')).toHaveLength(2)
    })

    const inputs = container.querySelectorAll('input')
    const selects = container.querySelectorAll('select')
    const submitButton = container.querySelector('button[type="submit"]')

    expect(submitButton).not.toBeNull()

    fireEvent.change(inputs[0]!, {
      target: { value: 'PRJ-006' },
    })
    fireEvent.change(inputs[1]!, {
      target: { value: '新規案件A' },
    })
    fireEvent.change(selects[0]!, {
      target: { value: 'm1' },
    })
    fireEvent.change(inputs[2]!, {
      target: { value: '2026-08-03' },
    })
    fireEvent.change(inputs[3]!, {
      target: { value: '2026-10-30' },
    })
    fireEvent.change(inputs[4]!, {
      target: { value: 'Backlog' },
    })
    fireEvent.change(inputs[5]!, {
      target: { value: 'https://example.com/projects/PRJ-006' },
    })
    fireEvent.click(submitButton!)

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([url, init]) => {
        return String(url) === 'http://localhost:8787/api/projects' && init?.method === 'POST'
      })

      expect(postCall).toBeDefined()
      const body = JSON.parse(String(postCall?.[1]?.body))
      expect(body).toEqual({
        projectNumber: 'PRJ-006',
        name: '新規案件A',
        startDate: '2026-08-03',
        endDate: '2026-10-30',
        status: 'not_started',
        pmMemberId: 'm1',
        relatedSystemIds: [],
        projectLinks: [
          {
            label: 'Backlog',
            url: 'https://example.com/projects/PRJ-006',
          },
        ],
      })
    })
  })
})
