import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ProjectCreatePage } from './ProjectCreatePage'

describe('ProjectCreatePage', () => {
  it('フォームを送信して追加 API を呼び出す', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<ProjectCreatePage />, {
      initialEntries: ['/projects/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: '案件追加' })

    expect(screen.getByRole('option', { name: 'm8 / 木村' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'sys-accounting / 会計基盤' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('プロジェクト番号'), {
      target: { value: 'PRJ-006' },
    })
    fireEvent.change(screen.getByLabelText('案件名'), {
      target: { value: '新案件A' },
    })
    fireEvent.change(screen.getByLabelText('PM'), {
      target: { value: 'm8' },
    })
    fireEvent.change(screen.getByLabelText('開始日'), {
      target: { value: '2026-08-03' },
    })
    fireEvent.change(screen.getByLabelText('終了予定日'), {
      target: { value: '2026-10-30' },
    })
    fireEvent.click(screen.getByTestId('create-project-phase-CT'))
    fireEvent.click(screen.getByTestId('create-project-phase-ITa'))
    fireEvent.change(screen.getByTestId('create-project-system-select'), {
      target: { value: 'sys-accounting' },
    })
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
        name: '新案件A',
        startDate: '2026-08-03',
        endDate: '2026-10-30',
        status: 'not_started',
        pmMemberId: 'm8',
        hasReportItems: false,
        initialPhaseNames: [
          '予備検討',
          '基礎検討',
          '基本設計',
          '詳細設計',
          'ITb',
          'UAT',
          '移行',
        ],
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
