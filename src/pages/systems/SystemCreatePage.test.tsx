import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemCreatePage } from './SystemCreatePage'

describe('SystemCreatePage', () => {
  it('システム追加フォームを送信して登録 API を呼ぶ', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<SystemCreatePage />, {
      initialEntries: ['/systems/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'システム追加' })

    fireEvent.change(screen.getByLabelText('システムID'), {
      target: { value: 'sys-customer' },
    })
    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: '顧客管理基盤' },
    })
    fireEvent.change(screen.getByLabelText('カテゴリ'), {
      target: { value: '基盤' },
    })
    expect(screen.getByRole('option', { name: 'm1 / 田中' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('オーナー'), {
      target: { value: 'm1' },
    })
    fireEvent.change(screen.getByLabelText('メモ'), {
      target: { value: '顧客情報を管理する基盤' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'システムを登録' }))

    await waitFor(() => {
      expect(fetchMock.mock.calls).toContainEqual([
        expect.stringContaining('/api/systems'),
        expect.objectContaining({
          method: 'POST',
        }),
      ])
    })
  })
})
