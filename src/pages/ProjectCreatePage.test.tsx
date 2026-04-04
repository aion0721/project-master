import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectCreatePage } from './ProjectCreatePage'

describe('ProjectCreatePage', () => {
  it('案件追加フォームを表示し、登録APIを呼び出す', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<ProjectCreatePage />, {
      initialEntries: ['/projects/new'],
      routePath: '/projects/new',
    })

    expect(await screen.findByRole('heading', { name: '案件追加' })).toBeInTheDocument()

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
    fireEvent.click(screen.getByRole('button', { name: '案件を登録' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8787/api/projects',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })
})
