import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberCreatePage } from './MemberCreatePage'

describe('MemberCreatePage', () => {
  it('メンバー追加フォームを送信して登録 API を呼び出す', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<MemberCreatePage />, {
      initialEntries: ['/members/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'メンバー追加' })

    fireEvent.change(screen.getByLabelText('メンバーID'), {
      target: { value: 'm11' },
    })
    fireEvent.change(screen.getByLabelText('名前'), {
      target: { value: '佐々木' },
    })
    fireEvent.change(screen.getByLabelText('ロール'), {
      target: { value: 'アプリエンジニア' },
    })
    fireEvent.change(screen.getByLabelText('上司'), {
      target: { value: 'm1' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'メンバーを登録' }))

    await waitFor(() => {
      expect(fetchMock.mock.calls).toContainEqual([
        expect.stringContaining('/api/members'),
        expect.objectContaining({
          method: 'POST',
        }),
      ])
    })
  })
})
