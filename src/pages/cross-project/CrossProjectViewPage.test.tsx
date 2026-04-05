import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { CrossProjectViewPage } from './CrossProjectViewPage'

describe('CrossProjectViewPage', () => {
  it('横断ビューと案件フェーズを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByRole('heading', { name: '複数案件横断ビュー' })).toBeInTheDocument()
    expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
    expect(screen.getByText('表示案件数')).toBeInTheDocument()
    expect(screen.getAllByText('詳細設計').length).toBeGreaterThan(0)
    expect(screen.getByTestId('cross-project-event-PRJ-001-ev-p1-1')).toHaveTextContent('環境提供')
  })

  it('ブックマーク表示と検索で絞り込める', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'm1')

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByText('田中 さんのブックマーク 2 件')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ブックマーク' }))

    await waitFor(() => {
      expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
      expect(screen.queryByText('物流統合ダッシュボード')).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('プロジェクト番号または案件名でフィルター'), {
      target: { value: 'PRJ-005' },
    })

    await waitFor(() => {
      expect(screen.getByText('販売促進モバイル連携')).toBeInTheDocument()
      expect(screen.queryByText('基幹会計刷新')).not.toBeInTheDocument()
    })
  })

  it('状態フィルターを複数選択で絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    await screen.findByRole('heading', { name: '複数案件横断ビュー' })

    fireEvent.click(screen.getByLabelText('完了'))

    await waitFor(() => {
      expect(screen.queryByText('営業管理BI改善')).not.toBeInTheDocument()
      expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
      expect(screen.getByText('物流統合ダッシュボード')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('未着手'))
    fireEvent.click(screen.getByLabelText('進行中'))

    await waitFor(() => {
      expect(screen.getByText('物流統合ダッシュボード')).toBeInTheDocument()
      expect(screen.queryByText('基幹会計刷新')).not.toBeInTheDocument()
      expect(screen.queryByText('販売促進モバイル連携')).not.toBeInTheDocument()
    })
  })

  it('横断ビューでも状態フィルターの既定値を保存できる', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'm1')

    const view = renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByText('田中 さんのブックマーク 2 件')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('未着手'))
    fireEvent.click(screen.getByRole('button', { name: 'この状態を既定値に保存' }))

    await waitFor(() => {
      expect(screen.getByText('現在の状態フィルターを既定値として保存しました。')).toBeInTheDocument()
    })

    view.unmount()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByRole('heading', { name: '複数案件横断ビュー' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText('未着手')).not.toBeChecked()
      expect(screen.getByLabelText('遅延')).toBeChecked()
    })
  })
})
