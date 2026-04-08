import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import styles from './CrossProjectViewPage.module.css'
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

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[3])

    await waitFor(() => {
      expect(screen.queryByText('営業管理BI改善')).not.toBeInTheDocument()
      expect(screen.getByText('基幹会計刷新')).toBeInTheDocument()
      expect(screen.getByText('物流統合ダッシュボード')).toBeInTheDocument()
    })

    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])

    await waitFor(() => {
      expect(screen.getByText('物流統合ダッシュボード')).toBeInTheDocument()
      expect(screen.queryByText('基幹会計刷新')).not.toBeInTheDocument()
      expect(screen.queryByText('販売促進モバイル連携')).not.toBeInTheDocument()
    })
  })

  it('既定値として状態フィルターを保存できる', async () => {
    mockProjectApi()
    window.localStorage.setItem('project-master:user-id', 'm1')

    const view = renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    expect(await screen.findByText('田中 さんのブックマーク 2 件')).toBeInTheDocument()

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    await waitFor(() => {
      expect(checkboxes[0]).not.toBeChecked()
    })
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
      const persistedCheckboxes = screen.getAllByRole('checkbox')
      expect(persistedCheckboxes[0]).not.toBeChecked()
      expect(persistedCheckboxes[3]).toBeChecked()
    })
  })

  it('体制表示を切り替えると案件メンバー一覧を表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    await screen.findByRole('heading', { name: '複数案件横断ビュー' })

    expect(screen.queryByTestId('cross-project-structure-PRJ-001-as-p1-1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '体制を表示' }))

    expect(screen.getByTestId('cross-project-structure-PRJ-001-as-p1-1')).toHaveTextContent('PM')
    expect(screen.getByTestId('cross-project-structure-PRJ-001-as-p1-1')).toHaveTextContent('m1 / 田中')
    expect(screen.getByTestId('cross-project-structure-PRJ-001-as-p1-2')).toHaveTextContent('m8 / 木村')
  })

  it('状況メモを表示して全文展開できる', async () => {
    mockProjectApi()

    await fetch('/api/projects/PRJ-001/note', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note:
          '基本設計はレビュー待ち。会計基盤とのIF確定を今週中に詰める。テスト環境の払出し条件も未確定のため、関係者調整を継続する。週次レビュー向けに論点整理を進め、関連システムの担当部署にも確認を依頼済み。承認後は詳細設計への移行判断とスケジュール再調整までまとめて実施する。',
      }),
    })

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    await screen.findByRole('heading', { name: '複数案件横断ビュー' })

    expect(screen.queryByTestId('cross-project-note-PRJ-001')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'メモを表示' }))

    expect(screen.getByTestId('cross-project-note-PRJ-001')).toHaveTextContent(
      '基本設計はレビュー待ち。会計基盤とのIF確定を今週中に詰める。',
    )
    expect(screen.getByTestId('cross-project-note-toggle-PRJ-001')).toHaveTextContent('全文表示')

    fireEvent.click(screen.getByTestId('cross-project-note-toggle-PRJ-001'))

    expect(screen.getByTestId('cross-project-note-toggle-PRJ-001')).toHaveTextContent('折りたたむ')
  })

  it('短縮モードで左列の補助情報をたたんで表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ['/cross-project'],
    })

    await screen.findByRole('heading', { name: '複数案件横断ビュー' })

    const projectInfo = screen.getByTestId('cross-project-project-info-PRJ-001')
    expect(projectInfo).toHaveTextContent('PM: 田中')
    expect(projectInfo).toHaveTextContent('体制: 7名')
    expect(projectInfo).toHaveTextContent('メモ: あり')
    expect(projectInfo).not.toHaveClass(styles.projectInfoCompact)

    fireEvent.click(screen.getByRole('button', { name: '短く表示' }))

    expect(projectInfo).not.toHaveTextContent('PM: 田中')
    expect(projectInfo).not.toHaveTextContent('体制: 7名')
    expect(projectInfo).not.toHaveTextContent('メモ: あり')
    expect(projectInfo).toHaveClass(styles.projectInfoCompact)
    expect(screen.getByRole('button', { name: '標準表示' })).toBeInTheDocument()
  })
})
