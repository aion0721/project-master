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
    expect(screen.getAllByLabelText('基本設計 の開始週')[0]).toHaveValue(3)
    expect(screen.getAllByLabelText('基本設計 の終了週')[0]).toHaveValue(5)
    expect(screen.getAllByLabelText('基本設計 の進捗率')[0]).toHaveValue(70)
    expect(screen.queryByLabelText('PMを選択')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument()
  })

  it('フェーズの状態、進捗率、週を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/p1'],
      routePath: '/projects/:projectId',
    })

    const startWeekInput = (await screen.findAllByLabelText('基本設計 の開始週'))[0]
    const endWeekInput = screen.getAllByLabelText('基本設計 の終了週')[0]
    const progressInput = screen.getAllByLabelText('基本設計 の進捗率')[0]
    const statusSelect = screen.getAllByLabelText('基本設計 の状態')[0]

    fireEvent.change(startWeekInput, { target: { value: '4' } })
    fireEvent.change(endWeekInput, { target: { value: '6' } })
    fireEvent.change(progressInput, { target: { value: '80' } })
    fireEvent.change(statusSelect, { target: { value: '遅延' } })
    fireEvent.click(screen.getAllByRole('button', { name: '保存' })[1]!)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/phases/ph-p1-2'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            startWeek: 4,
            endWeek: 6,
            status: '遅延',
            progress: 80,
          }),
        }),
      )
    })
  })

  it('プロジェクト体制を編集モードで更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/p1'],
      routePath: '/projects/:projectId',
    })

    fireEvent.click((await screen.findAllByRole('button', { name: '編集' }))[0]!)
    fireEvent.change(screen.getByLabelText('PMを選択'), {
      target: { value: 'm6' },
    })
    fireEvent.click(screen.getByRole('button', { name: '体制を保存' }))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/p1/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.pmMemberId).toBe('m6')
      expect(body.assignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ responsibility: '基本設計', memberId: 'm2' }),
        ]),
      )
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('PMを選択')).not.toBeInTheDocument()
    })
  })
})
