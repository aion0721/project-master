import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectDetailPage } from './ProjectDetailPage'

describe('ProjectDetailPage', () => {
  it('案件詳細、タイムライン、体制情報を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/p1'],
      routePath: '/projects/:projectId',
    })

    expect(await screen.findByRole('heading', { name: '基幹会計刷新' })).toBeInTheDocument()
    expect(screen.getByText('フェーズ進捗タイムライン')).toBeInTheDocument()
    expect(screen.getByText('プロジェクト体制')).toBeInTheDocument()
    expect(screen.getByText('OS タスク担当')).toBeInTheDocument()
    expect(screen.getAllByLabelText('基本設計の開始週')[0]).toHaveValue(3)
    expect(screen.getAllByLabelText('基本設計の終了週')[0]).toHaveValue(5)
  })

  it('フェーズの開始週と終了週を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/p1'],
      routePath: '/projects/:projectId',
    })

    const startWeekInput = (await screen.findAllByLabelText('基本設計の開始週'))[0]
    const endWeekInput = screen.getAllByLabelText('基本設計の終了週')[0]
    const saveButtons = screen.getAllByRole('button', { name: '保存' })

    fireEvent.change(startWeekInput, { target: { value: '4' } })
    fireEvent.change(endWeekInput, { target: { value: '6' } })
    fireEvent.click(saveButtons[1]!)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/phases/ph-p1-2'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ startWeek: 4, endWeek: 6 }),
        }),
      )
    })
  })
})
