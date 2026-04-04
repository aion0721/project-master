import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { CrossProjectViewPage } from './CrossProjectViewPage'

describe('CrossProjectViewPage', () => {
  it('複数案件横断ビューと案件別の週次フェーズを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByRole('heading', { name: '複数案件横断ビュー' })).toBeInTheDocument()
    expect(screen.getByText('顧客管理基盤刷新')).toBeInTheDocument()
    expect(screen.getByText('対象案件')).toBeInTheDocument()
    expect(screen.getAllByText('詳細設計').length).toBeGreaterThan(0)
  })
})
