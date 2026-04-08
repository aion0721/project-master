import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemManagementPage } from './SystemManagementPage'

async function openFilterPanel() {
  const toggleButton = await screen.findByRole('button', { name: '絞り込みを表示' })
  fireEvent.click(toggleButton)
  await screen.findByLabelText('システムIDで絞り込み')
}

describe('SystemManagementPage', () => {
  it('システム一覧と対象案件列を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    expect(await screen.findByRole('heading', { name: 'システム一覧' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '対象案件' })).toBeInTheDocument()
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('会計基盤')
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('1 件')
    expect(screen.getByTestId('system-row-sys-accounting')).toHaveTextContent('操作列から案件を表示できます')
    expect(screen.getByRole('link', { name: '新規システム' })).toHaveAttribute(
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
    await openFilterPanel()

    fireEvent.change(screen.getByLabelText('システムIDで絞り込み'), {
      target: { value: 'sys-accounting' },
    })

    expect(screen.getByTestId('system-row-sys-accounting')).toBeInTheDocument()
    expect(screen.queryByTestId('system-row-sys-sales-bi')).not.toBeInTheDocument()
  })

  it('所管部署で絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    await screen.findByRole('heading', { name: 'システム一覧' })
    await openFilterPanel()

    fireEvent.change(screen.getByLabelText('所管部署で絞り込み'), {
      target: { value: 'インフラ基盤部' },
    })

    expect(screen.getByTestId('system-row-sys-infra-common')).toBeInTheDocument()
    expect(screen.queryByTestId('system-row-sys-accounting')).not.toBeInTheDocument()
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

  it('案件の表示をONにすると対象案件列に案件リンクを表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemManagementPage />, {
      initialEntries: ['/systems'],
    })

    await screen.findByRole('heading', { name: 'システム一覧' })
    fireEvent.click(screen.getByRole('button', { name: '案件の表示: OFF' }))

    const row = await screen.findByTestId('system-row-sys-accounting')

    expect(within(row).getByRole('link', { name: 'PRJ-001 / 基幹会計刷新' })).toHaveAttribute(
      'href',
      '/projects/PRJ-001',
    )
  })
})
