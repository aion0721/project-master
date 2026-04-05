import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberCreatePage } from './MemberCreatePage'

describe('MemberCreatePage', () => {
  it('追加フォームを送信して登録APIを呼ぶ', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<MemberCreatePage />, {
      initialEntries: ['/members/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'メンバー追加' })

    expect(
      within(screen.getByLabelText('上司')).getByRole('option', { name: 'm1 / 田中 (PM)' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('メンバーID'), {
      target: { value: 'm11' },
    })
    fireEvent.change(screen.getByLabelText('名前'), {
      target: { value: '山田 花子' },
    })
    fireEvent.change(screen.getByLabelText('部署コード'), {
      target: { value: 'DEP-APP' },
    })
    fireEvent.change(screen.getByLabelText('部署名'), {
      target: { value: 'アプリ開発部' },
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
          body: JSON.stringify({
            id: 'm11',
            name: '山田 花子',
            departmentCode: 'DEP-APP',
            departmentName: 'アプリ開発部',
            role: 'アプリエンジニア',
            managerId: 'm1',
          }),
        }),
      ])
    })
  })
})
