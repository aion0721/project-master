import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberManagementPage } from './MemberManagementPage'

async function openFilterPanel() {
  const toggleButton = await screen.findByRole('button', { name: '絞り込みを表示' })
  fireEvent.click(toggleButton)
  await screen.findByRole('combobox', { name: 'メンバーIDまたは部署名で絞り込み' })
}

describe('MemberManagementPage', () => {
  it('メンバー一覧を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    expect(await screen.findByRole('heading', { name: 'メンバー一覧' })).toBeInTheDocument()
    expect(screen.getByTestId('member-row-m1')).toBeInTheDocument()
    expect(screen.getByTestId('member-row-m10')).toBeInTheDocument()
    expect(within(screen.getByTestId('member-row-m1')).getByText('DEP-BIZ')).toBeInTheDocument()
    expect(within(screen.getByTestId('member-row-m4')).getByText('m1 / 田中')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('member-row-m1')).getByRole('link', { name: '体制図' }),
    ).toHaveAttribute(
      'href',
      '/members/hierarchy?departmentName=%E4%BA%8B%E6%A5%AD%E6%8E%A8%E9%80%B2%E9%83%A8&memberId=m1',
    )
    expect(screen.getByRole('link', { name: '新規メンバー' })).toHaveAttribute(
      'href',
      '/members/new',
    )
  })

  it('メンバーを編集できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByRole('heading', { name: 'メンバー一覧' })

    const editableRow = screen.getByTestId('member-row-m10')

    fireEvent.click(within(editableRow).getByTestId('edit-member-m10'))

    expect(screen.getByRole('combobox', { name: '上司' })).toBeInTheDocument()

    fireEvent.change(within(editableRow).getByDisplayValue('DEP-QA'), {
      target: { value: 'DEP-TEST' },
    })
    fireEvent.change(within(editableRow).getByDisplayValue('品質保証部'), {
      target: { value: 'テスト推進部' },
    })
    fireEvent.change(screen.getByLabelText('上司'), {
      target: { value: 'm2' },
    })
    fireEvent.click(within(editableRow).getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByTestId('member-row-m10')).toHaveTextContent('DEP-TEST')
      expect(screen.getByTestId('member-row-m10')).toHaveTextContent('テスト推進部')
      expect(screen.getByTestId('member-row-m10')).toHaveTextContent('m2 / 山本')
    })
  })

  it('未使用メンバーを削除できる', async () => {
    mockProjectApi()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'm11',
        name: '新田 次郎',
        departmentCode: 'DEP-APP',
        departmentName: 'アプリ開発部',
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

  it('削除確認をキャンセルした場合は削除しない', async () => {
    mockProjectApi()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'm11',
        name: '新田 次郎',
        departmentCode: 'DEP-APP',
        departmentName: 'アプリ開発部',
        role: 'アプリエンジニア',
        managerId: null,
      }),
    })

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByTestId('member-row-m11')

    fireEvent.click(screen.getByTestId('delete-member-m11'))

    expect(screen.getByTestId('member-row-m11')).toBeInTheDocument()
  })

  it('メンバーIDまたは部署名で絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByRole('heading', { name: 'メンバー一覧' })
    await openFilterPanel()

    const keywordFilter = screen.getByRole('combobox', {
      name: 'メンバーIDまたは部署名で絞り込み',
    })

    fireEvent.change(keywordFilter, {
      target: { value: 'm10' },
    })

    expect(screen.getByTestId('member-row-m10')).toBeInTheDocument()
    expect(screen.queryByTestId('member-row-m1')).not.toBeInTheDocument()

    fireEvent.change(keywordFilter, {
      target: { value: '品質保証部' },
    })

    expect(screen.getByTestId('member-row-m5')).toBeInTheDocument()
    expect(screen.getByTestId('member-row-m10')).toBeInTheDocument()
    expect(screen.queryByTestId('member-row-m1')).not.toBeInTheDocument()
  })

  it('ロールでも絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<MemberManagementPage />, {
      initialEntries: ['/members'],
    })

    await screen.findByTestId('member-row-m1')
    await openFilterPanel()

    const roleFilter = screen.getByRole('combobox', { name: 'ロールで絞り込み' })

    fireEvent.change(roleFilter, {
      target: { value: 'PM' },
    })

    expect(screen.getByTestId('member-row-m1')).toBeInTheDocument()
    expect(screen.queryByTestId('member-row-m10')).not.toBeInTheDocument()

    fireEvent.change(roleFilter, {
      target: { value: 'QAエンジニア' },
    })

    expect(screen.getByTestId('member-row-m5')).toBeInTheDocument()
    expect(screen.queryByTestId('member-row-m10')).not.toBeInTheDocument()
    expect(screen.queryByTestId('member-row-m1')).not.toBeInTheDocument()
  })
})
