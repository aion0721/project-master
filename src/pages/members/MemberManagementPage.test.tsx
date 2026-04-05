import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberManagementPage } from './MemberManagementPage'

describe('MemberManagementPage', () => {
  it('メンバー一覧を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    expect(await screen.findByRole('heading', { name: 'メンバー管理' })).toBeInTheDocument()
    expect(screen.getByTestId('member-row-m1')).toBeInTheDocument()
    expect(screen.getByTestId('member-row-m10')).toBeInTheDocument()
    expect(within(screen.getByTestId('member-row-m1')).getByRole('link', { name: '体制図' })).toHaveAttribute(
      'href',
      '/members/hierarchy?memberId=m1',
    )
    expect(screen.getByRole('link', { name: 'メンバーを追加' })).toHaveAttribute('href', '/members/new')
  })

  it('メンバーを編集できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByRole('heading', { name: 'メンバー管理' })

    const editableRow = screen.getByTestId('member-row-m10')

    fireEvent.click(within(editableRow).getByTestId('edit-member-m10'))

    fireEvent.change(within(editableRow).getByDisplayValue('伊藤'), {
      target: { value: '伊藤 次郎' },
    })
    fireEvent.click(within(editableRow).getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByTestId('member-row-m10')).toHaveTextContent('伊藤 次郎')
    })
  })

  it('未使用メンバーを削除できる', async () => {
    mockProjectApi()

    await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'm11',
        name: '佐々木',
        role: 'アプリエンジニア',
        managerId: null,
      }),
    })

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByTestId('member-row-m11')

    fireEvent.click(screen.getByTestId('delete-member-m11'))

    await waitFor(() => {
      expect(screen.queryByTestId('member-row-m11')).not.toBeInTheDocument()
    })
  })

})
