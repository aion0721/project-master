import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProjectDetailPage } from './ProjectDetailPage'
import { renderWithProviders } from '../test/renderWithProviders'

describe('ProjectDetailPage', () => {
  it('案件詳細、タイムライン、体制情報を表示する', () => {
    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/p1'],
      routePath: '/projects/:projectId',
    })

    expect(screen.getByRole('heading', { name: '顧客管理基盤刷新' })).toBeInTheDocument()
    expect(screen.getByText('フェーズ進捗タイムライン')).toBeInTheDocument()
    expect(screen.getByText('プロジェクト体制')).toBeInTheDocument()
    expect(screen.getByText('OSタスク担当')).toBeInTheDocument()
    expect(screen.getAllByText('中村').length).toBeGreaterThan(0)
  })
})
