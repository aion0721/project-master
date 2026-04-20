import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberCreatePage } from './MemberCreatePage'

describe('MemberCreatePage', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('フォームを送信して追加 API を呼ぶ', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<MemberCreatePage />, {
      initialEntries: ['/members/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'メンバー追加' })

    expect(screen.getByRole('combobox', { name: '上司' })).toBeInTheDocument()

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
    fireEvent.change(screen.getByLabelText('タグを追加'), {
      target: { value: '保守担当' },
    })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
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
            tags: ['保守担当'],
            managerId: 'm1',
          }),
        }),
      ])
    })
  })

  it('env のプレースホルダーを使う', async () => {
    vi.stubEnv('VITE_MEMBER_ID_EXAMPLE', 'EMP0001')
    mockProjectApi()

    renderWithProviders(<MemberCreatePage />, {
      initialEntries: ['/members/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'メンバー追加' })

    expect(screen.getByLabelText('メンバーID')).toHaveAttribute('placeholder', '例: EMP0001')
  })
})
