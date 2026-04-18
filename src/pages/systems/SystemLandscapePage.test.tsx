import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

  it('データ流れ図からステップ候補を追加できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.click(screen.getByTestId('diagram-mode-transaction'))
    fireEvent.change(screen.getByTestId('transaction-select'), {
      target: { value: 'tx-001' },
    })
    fireEvent.click(screen.getByTestId('transaction-flow-edit-toggle'))
    fireEvent.change(screen.getByTestId('transaction-flow-source-select'), {
      target: { value: 'sys-accounting' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-target-select'), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.click(screen.getByTestId('transaction-flow-start-step'))
    fireEvent.change(screen.getByTestId('transaction-flow-action-input'), {
      target: { value: 'BI転送' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-note-input'), {
      target: { value: '会計基盤からBIへ連携' },
    })
    fireEvent.click(screen.getByTestId('transaction-flow-save-step'))

    await waitFor(() => {
      const updateCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/system-transactions/tx-001') && init?.method === 'PATCH'
      })

      expect(updateCall).toBeDefined()
      const body = JSON.parse(String(updateCall?.[1]?.body))
      expect(body.steps).toHaveLength(2)
      expect(body.steps[1]).toEqual(
        expect.objectContaining({
          relationId: 'rel-004',
          sourceSystemId: 'sys-accounting',
          targetSystemId: 'sys-sales-bi',
          stepOrder: 2,
          actionLabel: 'BI転送',
          note: '会計基盤からBIへ連携',
        }),
      )
    })

    expect(screen.getByTestId('transaction-path-label')).toHaveTextContent(
      '社内ポータル → 会計基盤 → 営業管理BI',
    )
  })

  it('データ流れ図から新しい流れを作成できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    await screen.findByRole('heading', { name: 'システム関連図' })

    fireEvent.click(screen.getByTestId('diagram-mode-transaction'))
    fireEvent.click(screen.getByTestId('transaction-flow-create-toggle'))
    fireEvent.change(screen.getByTestId('transaction-flow-create-name'), {
      target: { value: 'BI配信用フロー' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-create-data-label'), {
      target: { value: '会計集計データ' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-create-note'), {
      target: { value: '会計基盤からBIへ初回配信する。' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-source-select'), {
      target: { value: 'sys-accounting' },
    })
    fireEvent.change(screen.getByTestId('transaction-flow-target-select'), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.click(screen.getByTestId('transaction-flow-start-step'))
    fireEvent.change(screen.getByTestId('transaction-flow-action-input'), {
      target: { value: '初回配信' },
    })
    fireEvent.click(screen.getByTestId('transaction-flow-create-save'))

    await waitFor(() => {
      const createCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/system-transactions') && init?.method === 'POST'
      })

      expect(createCall).toBeDefined()
      const body = JSON.parse(String(createCall?.[1]?.body))
      expect(body).toEqual(
        expect.objectContaining({
          name: 'BI配信用フロー',
          dataLabel: '会計集計データ',
          note: '会計基盤からBIへ初回配信する。',
        }),
      )
      expect(body.steps).toEqual([
        expect.objectContaining({
          relationId: 'rel-004',
          sourceSystemId: 'sys-accounting',
          targetSystemId: 'sys-sales-bi',
          stepOrder: 1,
          actionLabel: '初回配信',
        }),
      ])
    })

    await waitFor(() => {
      expect(screen.getByTestId('transaction-select')).toHaveValue('tx-005')
    })
  })
})
