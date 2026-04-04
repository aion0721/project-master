import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CrossProjectViewPage } from './CrossProjectViewPage'
import { renderWithProviders } from '../test/renderWithProviders'

describe('CrossProjectViewPage', () => {
  it('複数案件横断ビューと案件別の週次フェーズを表示する', () => {
    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(screen.getByRole('heading', { name: '複数案件横断ビュー' })).toBeInTheDocument()
    expect(screen.getByText('顧客管理基盤刷新')).toBeInTheDocument()
    expect(screen.getByText('対象案件')).toBeInTheDocument()
    expect(screen.getAllByText('詳細設計').length).toBeGreaterThan(0)
  })
})
