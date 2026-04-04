import { screen } from '@testing-library/react'
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
})
