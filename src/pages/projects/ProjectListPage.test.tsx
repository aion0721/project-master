import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ProjectListPage } from './ProjectListPage'

async function openFilterPanel() {
  const toggleButton = await screen.findByRole('button', { name: '絞り込みを表示' })
  fireEvent.click(toggleButton)
}

describe('ProjectListPage', () => {
  it('案件一覧と主要カラムを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    expect(await screen.findByRole('heading', { name: '案件一覧' })).toBeInTheDocument()
    expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
    expect(screen.getByText('物流統合ダッシュボード')).toBeInTheDocument()
    expect(screen.getByText('主システム: 会計基盤')).toBeInTheDocument()
    expect(screen.getByText('案件ステータス一覧')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '案件を追加' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '詳細を見る' }).length).toBeGreaterThan(0)
  })

  it('利用メンバー選択済みならブックマーク案件だけに絞り込める', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'm1')

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    await openFilterPanel()
    expect(await screen.findByText('田中 さんのブックマーク 2 件')).toBeInTheDocument()

    const bookmarkToggle = screen
      .getAllByRole('button', { name: 'ブックマーク' })
      .find((button) => !button.hasAttribute('disabled'))

    fireEvent.click(bookmarkToggle!)

    await waitFor(() => {
      expect(screen.getByText('ブックマーク案件一覧')).toBeInTheDocument()
      expect(screen.getAllByText('基幹会計刷新').length).toBeGreaterThan(0)
      expect(screen.queryByText('物流統合ダッシュボード')).not.toBeInTheDocument()
    })
  })

  it('状態フィルターで表示案件を絞り込める', async () => {
    mockProjectApi()

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    expect(await screen.findByRole('heading', { name: '案件一覧' })).toBeInTheDocument()

    await openFilterPanel()
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

  it('状態フィルターの既定値を保存できる', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'm1')

    const view = renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    await openFilterPanel()
    expect(await screen.findByText('田中 さんのブックマーク 2 件')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('完了'))
    fireEvent.click(screen.getByRole('button', { name: 'この状態を既定値に保存' }))

    await waitFor(() => {
      expect(screen.getByText('現在の状態フィルターを既定値として保存しました。')).toBeInTheDocument()
    })

    view.unmount()

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    expect(await screen.findByRole('heading', { name: '案件一覧' })).toBeInTheDocument()
    await openFilterPanel()

    await waitFor(() => {
      expect(screen.getByLabelText('完了')).not.toBeChecked()
      expect(screen.getByLabelText('進行中')).toBeChecked()
    })
  })
})
