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
    expect(screen.getByText('表示案件数')).toBeInTheDocument()
    expect(screen.getAllByText('詳細設計').length).toBeGreaterThan(0)
  })

  it('ブックマーク表示でもフィルターできる', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'u1')

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByText('demo さんのブックマーク 2 件')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ブックマーク' }))

    await waitFor(() => {
      expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
      expect(screen.queryByText('営業統合ダッシュボード')).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('プロジェクト番号または案件名でフィルター'), {
      target: { value: 'PRJ-005' },
    })

    await waitFor(() => {
      expect(screen.getByText('経費精算モバイル連携')).toBeInTheDocument()
      expect(screen.queryByText('基幹会計刷新')).not.toBeInTheDocument()
    })
  })

  it('案件名でフィルターできる', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    await screen.findByRole('heading', { name: '複数案件横断ビュー' })

    fireEvent.change(screen.getByLabelText('プロジェクト番号または案件名でフィルター'), {
      target: { value: '会計' },
    })

    await waitFor(() => {
      expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
      expect(screen.queryByText('経費精算モバイル連携')).not.toBeInTheDocument()
    })
  })
})
