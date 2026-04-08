import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemManagementPage } from './SystemManagementPage'

describe('SystemManagementPage', () => {
  it('システム一覧と関連案件を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    expect(await screen.findByRole('heading', { name: 'システム一覧' })).toBeInTheDocument()
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('会計基盤')
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('基幹会計刷新')
    expect(screen.getByRole('link', { name: 'システムを追加' })).toHaveAttribute('href', '/systems/new')
  })

  it('システムを編集、削除できる', async () => {
    mockProjectApi()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await fetch('/api/systems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'sys-customer',
        name: '顧客管理基盤',
        category: '基盤',
        ownerMemberId: 'm1',
        note: '顧客情報を管理する基盤',
      }),
    })

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    const createdRow = await screen.findByTestId('system-row-sys-customer')

    fireEvent.click(within(createdRow).getByTestId('edit-system-sys-customer'))
    fireEvent.change(within(createdRow).getByDisplayValue('顧客管理基盤'), {
      target: { value: '顧客管理基盤 新版' },
    })
    fireEvent.click(within(createdRow).getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByTestId('system-row-sys-customer')).toHaveTextContent('顧客管理基盤 新版')
    })

    fireEvent.click(screen.getByTestId('delete-system-sys-customer'))

    await waitFor(() => {
      expect(screen.queryByTestId('system-row-sys-customer')).not.toBeInTheDocument()
    })
  })
})
