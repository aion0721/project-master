import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { CrossProjectViewPage } from './CrossProjectViewPage'

describe('CrossProjectViewPage', () => {
  it('横断ビューと案件フェーズを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByRole('heading', { name: '複数案件横断ビュー' })).toBeInTheDocument()
    expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
    expect(screen.getByText('対象案件')).toBeInTheDocument()
    expect(screen.getAllByText('詳細設計').length).toBeGreaterThan(0)
  })

  it('ログイン済みならブックマーク案件だけを横断表示できる', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'u1')

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByText('demo さんのブックマーク 2 件')).toBeInTheDocument()

    const bookmarkToggle = screen
      .getAllByRole('button', { name: 'ブックマーク' })
      .find((button) => !button.hasAttribute('disabled'))

    fireEvent.click(bookmarkToggle!)

    await waitFor(() => {
      expect(screen.getAllByText('基幹会計刷新').length).toBeGreaterThan(0)
      expect(screen.queryByText('営業統合ダッシュボード')).not.toBeInTheDocument()
    })
  })
})
