import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemLandscapePage } from './SystemLandscapePage'

describe('SystemLandscapePage', () => {
  it('関連図と矢印ラベルを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    expect(await screen.findByRole('heading', { name: 'システム関連図' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'システム関連図' })).toBeInTheDocument()
    expect(screen.getAllByText('仕向け → 被仕向け').length).toBeGreaterThan(0)
  })

  it('データ流れ図に切り替えて経路を表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.click(screen.getByTestId('diagram-mode-transaction'))

    expect(screen.getByTestId('transaction-select')).toBeInTheDocument()
    expect(screen.getByTestId('system-transaction-flow')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-path-label')).toHaveTextContent('社内ポータル → 会計基盤')

    fireEvent.change(screen.getByTestId('transaction-select'), {
      target: { value: 'tx-004' },
    })

    expect(screen.getByTestId('transaction-path-label')).toHaveTextContent(
      '社内ポータル → 会計基盤 → 営業管理BI',
    )
    expect(screen.getByText('申請集計データ')).toBeInTheDocument()
  })

  it('矢印にホバーするとメモを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.mouseEnter(screen.getByTestId('diagram-edge-rel-001'))

    expect(screen.getByRole('tooltip')).toHaveTextContent('社内ポータル → 会計基盤')
    expect(screen.getByRole('tooltip')).toHaveTextContent('ポータルから会計基盤へ申請データを連携')

    fireEvent.mouseLeave(screen.getByTestId('diagram-edge-rel-001'))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('1システムに絞った上流・自分・下流ビューを表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.change(screen.getByTestId('focused-system-select'), {
      target: { value: 'sys-accounting' },
    })

    expect(screen.getByText('データをもらう元')).toBeInTheDocument()
    expect(screen.getByText('データを渡す先')).toBeInTheDocument()
    expect(screen.getByTestId('focused-system-center')).toHaveTextContent('会計基盤')
    expect(within(screen.getByTestId('focused-system-upstream')).getByText('物流ダッシュボード')).toBeInTheDocument()
    expect(within(screen.getByTestId('focused-system-upstream')).getByText('社内ポータル')).toBeInTheDocument()
    expect(within(screen.getByTestId('focused-system-downstream')).getByText('営業管理BI')).toBeInTheDocument()
  })

  it('フォーカスビューのコネクタでも連携メモを確認できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.change(screen.getByTestId('focused-system-select'), {
      target: { value: 'sys-accounting' },
    })

    const upstreamConnector = screen.getByTestId('focused-connector-upstream')

    fireEvent.focus(upstreamConnector)

    expect(within(upstreamConnector).getByText('上流から 会計基盤 への連携')).toBeInTheDocument()
    expect(within(upstreamConnector).getByText('ポータルから会計基盤へ申請データを連携')).toBeInTheDocument()
    expect(within(upstreamConnector).getByText('物流実績を会計仕訳へ受け渡し')).toBeInTheDocument()
  })
})
