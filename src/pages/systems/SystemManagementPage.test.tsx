import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemManagementPage } from './SystemManagementPage'

describe('SystemManagementPage', () => {
  it('システム一覧と対象システム列を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    expect(await screen.findByRole('heading', { name: 'システム一覧' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '対象システム' })).toBeInTheDocument()
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('会計基盤')
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('基幹会計刷新')
    expect(screen.getAllByRole('link', { name: 'システムを追加' })[0]).toHaveAttribute(
      'href',
      '/systems/new',
    )
  })

  it('systemId で絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    await screen.findByRole('heading', { name: 'システム一覧' })

    fireEvent.change(screen.getByLabelText('システムIDで絞り込み'), {
      target: { value: 'sys-accounting' },
    })

    expect(screen.getByTestId('system-row-sys-accounting')).toBeInTheDocument()
    expect(screen.queryByTestId('system-row-sys-sales-bi')).not.toBeInTheDocument()
  })

  it('各システムから詳細画面へ移動できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    const row = await screen.findByTestId('system-row-sys-accounting')

    expect(within(row).getByRole('link', { name: '詳細' })).toHaveAttribute(
      'href',
      '/systems/sys-accounting',
    )
    expect(within(row).getByRole('link', { name: '横断ビュー' })).toHaveAttribute(
      'href',
      '/cross-project?systemId=sys-accounting',
    )
    expect(within(row).queryByRole('button', { name: '編集' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: '削除' })).not.toBeInTheDocument()
  })
})
