import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { SystemManagementPage } from './SystemManagementPage'

describe('SystemManagementPage', () => {
  it('システム一覧と関連案件を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    expect(await screen.findByRole('heading', { name: 'システム管理' })).toBeInTheDocument()
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('会計基盤')
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('基幹会計刷新')
  })

  it('システムを追加して編集、削除できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    await screen.findByRole('heading', { name: 'システム管理' })

    fireEvent.change(screen.getByLabelText('システムID'), {
      target: { value: 'sys-customer' },
    })
    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: '顧客管理基盤' },
    })
    fireEvent.change(screen.getByLabelText('カテゴリ'), {
      target: { value: '基盤' },
    })
    fireEvent.change(screen.getByLabelText('オーナー'), {
      target: { value: 'm1' },
    })
    fireEvent.change(screen.getAllByLabelText('メモ')[0]!, {
      target: { value: '顧客情報を管理する基盤' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'システムを追加' }))

    const createdRow = await screen.findByTestId('system-row-sys-customer')
    expect(createdRow).toHaveTextContent('顧客管理基盤')

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

  it('関連システムを登録して削除できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    await screen.findByRole('heading', { name: 'システム管理' })

    fireEvent.change(screen.getByLabelText('接続元システム'), {
      target: { value: 'sys-accounting' },
    })
    fireEvent.change(screen.getByLabelText('接続先システム'), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.change(screen.getAllByLabelText('メモ')[1]!, {
      target: { value: '会計データを分析基盤へ転送' },
    })
    fireEvent.click(screen.getByRole('button', { name: '関連システムを登録' }))

    const relationRow = await screen.findByTestId('system-relation-row-rel-004')
    expect(relationRow).toHaveTextContent('会計基盤')
    expect(relationRow).toHaveTextContent('営業管理BI')

    fireEvent.click(screen.getByTestId('delete-system-relation-rel-004'))

    await waitFor(() => {
      expect(screen.queryByTestId('system-relation-row-rel-004')).not.toBeInTheDocument()
    })
  })
})
