import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectListPage } from './ProjectListPage'

describe('ProjectListPage', () => {
  it('案件一覧と主要カラムを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    expect(await screen.findByRole('heading', { name: '案件一覧' })).toBeInTheDocument()
    expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
    expect(screen.getByText('営業統合ダッシュボード')).toBeInTheDocument()
    expect(screen.getByText('案件ステータス一覧')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '案件を追加' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '詳細を見る' }).length).toBeGreaterThan(0)
  })

  it('ログイン済みならブックマーク案件だけに絞り込める', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'u1')

    renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    })

    expect(await screen.findByText('demo さんのブックマーク 2 件')).toBeInTheDocument()

    const bookmarkToggle = screen
      .getAllByRole('button', { name: 'ブックマーク' })
      .find((button) => !button.hasAttribute('disabled'))

    fireEvent.click(bookmarkToggle!)

    await waitFor(() => {
      expect(screen.getByText('ブックマーク案件一覧')).toBeInTheDocument()
      expect(screen.getAllByText('基幹会計刷新').length).toBeGreaterThan(0)
      expect(screen.queryByText('営業統合ダッシュボード')).not.toBeInTheDocument()
    })
  })
})
