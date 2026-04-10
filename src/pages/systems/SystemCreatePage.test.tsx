import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemCreatePage } from './SystemCreatePage'

describe('SystemCreatePage', () => {
  it('システム追加フォームを送信して API を呼ぶ', async () => {
    const fetchMock = mockProjectApi()

    renderWithProviders(<SystemCreatePage />, {
      initialEntries: ['/systems/new'],
      routePath: '*',
    })

    await screen.findByRole('heading', { name: 'システム追加' })

    expect(screen.getByRole('combobox', { name: 'オーナー' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('システムID'), {
      target: { value: 'sys-customer' },
    })
    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: '顧客管理基盤' },
    })
    fireEvent.change(screen.getByLabelText('カテゴリ'), {
      target: { value: '基幹' },
    })
    fireEvent.change(screen.getByLabelText('オーナー'), {
      target: { value: 'm1' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: '事業推進部' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'システム設計部' }))
    fireEvent.change(screen.getByLabelText('メモ'), {
      target: { value: '顧客情報と契約更新を管理する基盤' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'システムを登録' }))

    await waitFor(() => {
      const systemCall = fetchMock.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems') && init?.method === 'POST'
      })

      expect(systemCall).toBeDefined()
      const body = JSON.parse(String(systemCall?.[1]?.body))
      expect(body).toEqual(
        expect.objectContaining({
          id: 'sys-customer',
          name: '顧客管理基盤',
          category: '基幹',
          ownerMemberId: 'm1',
          departmentNames: ['事業推進部', 'システム設計部'],
          note: '顧客情報と契約更新を管理する基盤',
        }),
      )
    })
  })
})
