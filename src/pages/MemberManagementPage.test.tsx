import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
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
  })

  it('メンバーを追加して編集し、削除できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByRole('heading', { name: 'メンバー管理' })

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

    fireEvent.click(screen.getByRole('button', { name: 'メンバーを追加' }))

    const createdRow = await screen.findByTestId('member-row-m11')
    expect(createdRow).toHaveTextContent('佐々木')

    fireEvent.click(within(createdRow).getByTestId('edit-member-m11'))

    fireEvent.change(within(createdRow).getByDisplayValue('佐々木'), {
      target: { value: '佐々木 太郎' },
    })
    fireEvent.click(within(createdRow).getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByTestId('member-row-m11')).toHaveTextContent('佐々木 太郎')
    })

    fireEvent.click(screen.getByTestId('delete-member-m11'))

    await waitFor(() => {
      expect(screen.queryByTestId('member-row-m11')).not.toBeInTheDocument()
    })
  })

})
