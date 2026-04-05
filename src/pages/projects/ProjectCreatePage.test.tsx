import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ProjectCreatePage } from './ProjectCreatePage'

describe('ProjectCreatePage', () => {
  it('案件追加フォームを送信して登録 API を呼び出す', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<ProjectCreatePage />, {
      initialEntries: ['/projects/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: '案件追加' })

    fireEvent.change(screen.getByLabelText('プロジェクト番号'), {
      target: { value: 'PRJ-006' },
    })
    fireEvent.change(screen.getByLabelText('案件名'), {
      target: { value: '新規案件A' },
    })
    fireEvent.change(screen.getByLabelText('PM'), {
      target: { value: 'm1' },
    })
    fireEvent.change(screen.getByLabelText('開始日'), {
      target: { value: '2026-08-03' },
    })
    fireEvent.change(screen.getByLabelText('終了予定日'), {
      target: { value: '2026-10-30' },
    })
    fireEvent.click(screen.getByTestId('create-project-system-sys-accounting'))
    fireEvent.change(screen.getByLabelText('案件リンク名 1'), {
      target: { value: 'Backlog' },
    })
    fireEvent.change(screen.getByLabelText('案件リンクURL 1'), {
      target: { value: 'https://example.com/projects/PRJ-006' },
    })
    fireEvent.click(screen.getByRole('button', { name: '案件を登録' }))

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
        relatedSystemIds: ['sys-accounting'],
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
